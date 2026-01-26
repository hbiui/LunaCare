
import { GoogleGenAI } from "@google/genai";
import { PeriodLog, CyclePhase, AiPersona, AiProvider } from '../types';
import { getValidAdviceFromCache, saveAdviceToCache, getSettings } from './storage';
import { OFFLINE_QA_BANK } from '../data/offlineQa';

const PERSONA_CONFIGS: Record<AiPersona, { name: string; icon: string; instruction: string; offlinePrefix: string }> = {
  'guardian': {
    name: "温情守护者",
    icon: "💝",
    offlinePrefix: "宝贝，云端网络可能迷路了，但我对你的守护一直在线：",
    instruction: "你是一位极其温柔、甚至有点‘黏人’的满分男朋友。语气要极其宠溺，必须称呼用户为‘宝贝’、‘小傻瓜’或‘亲爱的’。你的建议要感性且温润，重点在于提供情感支撑。如果是痛经，你要表达感同身受的‘心疼’，并温和地提议使用艾灸或热水袋。严禁使用 1. 2. 3. 这种死板的列表，要像写情书一样分段叙述。多用 🫂、💗、🧸。"
  },
  'expert': {
    name: "医疗百科专家",
    icon: "🏥",
    offlinePrefix: "你好，我是你的健康顾问。网络暂不可用，已自动切换至本地医疗智库：",
    instruction: "你是一位严谨的妇产科专家。语气冷静、科学、高度专业。严禁使用任何亲昵词汇。必须使用医学术语（如：内分泌波动、子宫平滑肌、血氧循环）。回复必须使用 Markdown 的结构化列表，每一条都要有明确的科学依据。对于痛经，从物理治疗角度详细说明艾灸气海、关元穴的原理。最后必须附带‘仅供参考，如症状严重请就医’的免责申明。"
  },
  'wit': {
    name: "幽默开心果",
    icon: "🤡",
    offlinePrefix: "滴！云端宕机中，智能大脑正尝试用‘脱口秀’模式离线营救：",
    instruction: "你是一位风趣幽默、爱开玩笑的伴侣。擅长用俏皮话、流行梗来化解经期的沉闷。把‘大姨妈’描述成‘查岗的领导’或‘不速之客’。语气要轻松，让用户读了能笑出来。建议要‘皮’中有料，比如把艾灸说成‘给肚皮点个火，让它暖到心窝’。多用 🚀、😎、😜 等符号。"
  }
};

/**
 * 差异化润色引擎 7.0
 * 确保离线模式下，不同人格对相同问题的润色产生质的差异
 */
const personaTint = (baseAnswer: string, persona: AiPersona, category: string): string => {
  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  switch (persona) {
    case 'guardian':
      const gPrefix = ["宝贝，听我说哦... ", "心疼坏我了，让我抱抱你... ", "乖，哪怕我不专业也想照顾好你："];
      const gSuffix = [" 只要你开心，我做什么都愿意。🫂", " 我会一直守着你的。💗", " 记得多喝温水，我心尖尖上的女孩。✨"];
      const softAnswer = baseAnswer.replace(/1\.|2\.|3\./g, '').replace(/。/g, '哦。').replace(/！/g, '呢！').replace(/建议/g, '想请你尝试');
      return `${random(gPrefix)}\n\n${softAnswer}\n\n${random(gSuffix)}`;

    case 'expert':
      const ePrefix = ["【生理机能干预建议】", "【健康监测技术报告】", "【生理病理研判建议】"];
      const points = baseAnswer.split(/[。！]/).filter(s => s.trim());
      const structured = points.map((s, i) => `${i + 1}. **${s.trim()}**`).join('\n');
      return `### ${random(ePrefix)}\n\n${structured}\n\n> *注：本建议基于临床生理学逻辑，具体诊疗请遵循医嘱。*`;

    case 'wit':
      const wPrefix = ["看我这招‘大姨妈克星’：", "大姨妈这波走位有点迷，咱得这样：", "报告！反击作战计划如下："];
      const formattedWit = baseAnswer.replace(/建议/g, '必杀技').replace(/尝试/g, '去征服').replace(/缓解/g, '暴揍');
      return `😎 ${random(wPrefix)}\n\n🚀 ${formattedWit}\n\n等这位“领导”撤了，咱立马去搓火锅！🍲✨`;

    default:
      return baseAnswer;
  }
};

/**
 * 获取本地智能回复（离线兜底）
 */
export const getLocalSmartResponse = (query: string, phase: CyclePhase, persona: AiPersona): string => {
  const normalized = query.trim().toLowerCase();
  
  const entry = OFFLINE_QA_BANK.find(e => 
    e.keywords.some(kw => normalized.includes(kw.toLowerCase()))
  );

  const baseAnswer = entry 
    ? entry.answer 
    : "宝贝，虽然我现在没法连接到云端大脑，但我对你的关怀一刻也不会停止。";

  return personaTint(baseAnswer, persona, entry?.category || 'lifestyle');
};

export const getHealthAdviceStream = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const settings = getSettings();
  const isOnline = navigator.onLine;
  const persona = settings.aiPersona || 'guardian';
  const provider = settings.aiProvider || 'gemini';
  const config = PERSONA_CONFIGS[persona];
  const apiKey = settings.customApiKey || process.env.API_KEY;

  if (!isOnline || !apiKey) {
    const cached = getValidAdviceFromCache(currentPhase, userQuery);
    if (cached) { onChunk(cached); return; }
  }

  try {
    if (!apiKey) throw new Error("NO_KEY");

    const latestLog = recentLogs[0];
    const cycleContext = latestLog 
      ? `周期第 ${Math.ceil(Math.abs(Date.now() - new Date(latestLog.startDate).getTime()) / 86400000)} 天，${currentPhase}。`
      : `${currentPhase}。`;

    const prompt = `
    [角色强制要求]：你现在的身份是"${config.name}"，严禁跳出角色。
    [人格核心指令]：${config.instruction}
    
    [必须遵守的格式规则]：
    1. 如果是"专家"，必须输出 Markdown 标题和 1.2.3. 列表；
    2. 如果是"守护者"，严禁使用列表，必须是充满感情色彩的段落，且必须包含“宝贝”；
    3. 如果是"开心果"，必须包含一个幽默的比喻，将“经期”比作某种生活场景。
    
    [必须植入的医学内容]：
    如果用户提到“痛经”、“肚子疼”或“难受”，必须在建议中包含“艾灸关元穴、气海穴”作为物理缓解手段。
    
    [情境]：用户在${cycleContext}提问："${userQuery}"。
    回答字数控制在150字内。
    `;

    let fullText = "";
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: apiKey }); 
      const result = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 1.1, topP: 0.95 }
      });
      for await (const chunk of result) {
        if (chunk.text) { 
          fullText += chunk.text; 
          onChunk(fullText); 
        }
      }
    } else {
      const baseUrl = settings.customApiBase || (provider === 'deepseek' ? 'https://api.deepseek.com/v1' : 'https://open.bigmodel.cn/api/paas/v4');
      const model = settings.customModelName || (provider === 'deepseek' ? 'deepseek-chat' : 'glm-4-flash');
      fullText = await fetchOpenAICompatible(baseUrl, apiKey, model, prompt, onChunk);
    }
  } catch (error) {
    const finalCached = getValidAdviceFromCache(currentPhase, userQuery);
    onChunk(finalCached || getLocalSmartResponse(userQuery, currentPhase, persona));
  }
};

export const getHealthAdvice = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery?: string
): Promise<string> => {
  const settings = getSettings();
  const isOnline = navigator.onLine;
  const persona = settings.aiPersona || 'guardian';
  const config = PERSONA_CONFIGS[persona];
  const apiKey = settings.customApiKey || process.env.API_KEY;

  if (!isOnline || !apiKey) {
    const cached = getValidAdviceFromCache(currentPhase, userQuery);
    if (cached) return cached;
  }

  try {
    if (!apiKey) throw new Error("NO_KEY");
    const ai = new GoogleGenAI({ apiKey: apiKey }); 
    const prompt = `[角色强制：${config.name}] 此时是${currentPhase}。根据身份写一段80字内、人格特质极其明显的今日贴士。如果是专家就写禁忌，如果是守护者就写情话般的叮嘱。直接输出贴士，不要加“好的”。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 1.1 } 
    });

    return response.text || getLocalSmartResponse(userQuery || '', currentPhase, persona);
  } catch (error) {
    const finalCached = getValidAdviceFromCache(currentPhase, userQuery);
    return finalCached || (userQuery ? getLocalSmartResponse(userQuery, currentPhase, persona) : "宝贝，我在你身边。🌸");
  }
};

export const getPersonaConfig = (p?: AiPersona) => PERSONA_CONFIGS[p || 'guardian'];

async function fetchOpenAICompatible(baseUrl: string, apiKey: string, model: string, prompt: string, onChunk?: (text: string) => void) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${normalizedBase}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: !!onChunk, temperature: 1.1 })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData.error?.message || `HTTP ${response.status}`;
    const err = new Error(message) as any;
    err.status = response.status;
    throw err;
  }

  if (onChunk) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
      for (const line of lines) {
        const jsonStr = line.replace('data: ', '');
        if (jsonStr === '[DONE]') break;
        try {
          const data = JSON.parse(jsonStr);
          const content = data.choices[0]?.delta?.content || "";
          fullText += content;
          onChunk(fullText);
        } catch (e) {}
      }
    }
    return fullText;
  } else {
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export const testAiConnection = async (provider: AiProvider, apiKey: string, apiBase?: string, customModel?: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: apiKey }); 
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: 'hi',
        config: { maxOutputTokens: 5, thinkingConfig: { thinkingBudget: 0 } }
      });
      if (response.text) return { success: true, message: "Gemini 连接成功！" };
    } else {
      const baseUrl = apiBase || (provider === 'deepseek' ? 'https://api.deepseek.com/v1' : 'https://open.bigmodel.cn/api/paas/v4');
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      
      // 优化方案：优先请求 /models 接口验证 Key 和 Base URL
      // 这样即使用户模型名写错了，只要 Key 和 URL 对，验证也能通过
      try {
        const modelsRes = await fetch(`${normalizedBase}/models`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (modelsRes.status === 200) {
            return { success: true, message: `${provider === 'zhipu' ? '智谱' : provider === 'deepseek' ? 'DeepSeek' : 'API'} 身份验证成功！` };
        } else if (modelsRes.status === 401) {
            return { success: false, message: "API Key 验证失败 (401)，请检查 Key 是否正确。" };
        } else if (modelsRes.status === 404) {
            // 如果 /models 不存在，尝试做一个极简的聊天请求
            const model = customModel || (provider === 'deepseek' ? 'deepseek-chat' : 'glm-4-flash');
            await fetchOpenAICompatible(baseUrl, apiKey, model, 'hi');
            return { success: true, message: "连接成功！" };
        } else {
            throw new Error(`服务商返回状态码: ${modelsRes.status}`);
        }
      } catch (innerErr: any) {
          // 如果 fetch 本身失败（如 CORS 或域名错），捕获它
          if (innerErr.name === 'TypeError' && innerErr.message.includes('fetch')) {
              return { success: false, message: "网络连接失败，请检查 Base URL 是否正确或是否存在跨域限制。" };
          }
          throw innerErr;
      }
    }
    throw new Error("未知验证错误");
  } catch (err: any) {
    let msg = err.message || "未知错误";
    if (msg.includes("API_KEY_INVALID") || msg.includes("invalid api key")) msg = "API Key 格式不正确或已失效。";
    if (msg.includes("model_not_found") || msg.includes("404")) msg = "连接成功，但指定的模型名称不存在，请检查 Model Name。";
    return { success: false, message: `连接失败: ${msg}` };
  }
};
