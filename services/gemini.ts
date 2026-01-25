
import { GoogleGenAI } from "@google/genai";
import { PeriodLog, CyclePhase, AiPersona, AiProvider } from '../types';
import { getValidAdviceFromCache, saveAdviceToCache, getSettings } from './storage';
import { OFFLINE_QA_BANK } from '../data/offlineQa';

const PERSONA_CONFIGS: Record<AiPersona, { name: string; icon: string; instruction: string; offlinePrefix: string }> = {
  'guardian': {
    name: "温情守护者",
    icon: "💝",
    offlinePrefix: "宝贝，虽然云端暂时忙碌，但我对你的照顾永不掉线：",
    instruction: "你是一位极其温柔、体贴的满分男朋友。语气要极其宠溺，称呼用户为‘宝贝’。在提供科学建议的同时，必须给予极强的情感支持。如果提到痛经缓解，可以温和地推荐艾灸关元、气海等穴位，但必须强调注意通风和防烫伤。多用暖心 emoji。"
  },
  'expert': {
    name: "医疗百科专家",
    icon: "🏥",
    offlinePrefix: "你好，我是你的私人健康顾问。基于目前的生理数据，我为你整理了以下专业建议：",
    instruction: "你是一位专业的妇产科医生。语气严谨、专业。在回答痛经时，除药物外，可引入艾灸物理疗法，提及气海、关元、中极等穴位，并说明温和灸的科学操作规范及禁忌症。给出的建议必须具备医学参考价值。"
  },
  'wit': {
    name: "幽默开心果",
    icon: "🤡",
    offlinePrefix: "报告！大姨妈这位‘贵客’又来视察了。为了让她早点‘起驾回宫’，咱们先试这几招：",
    instruction: "你是一位幽默风趣的伴侣。擅长用幽默缓解经期压力。提供建议时可以加入‘给肚皮点个火（艾灸）’之类的幽默表述，但随后要给出严谨的穴位和防烫伤提示。"
  }
};

const PHASES_CORE: Record<string, string> = {
  '月经期': "宝贝，现在身体最需要温暖。保暖、休息、多喝水是三大核心。我会承包所有家务，你只需要负责美美地睡一觉。☕️",
  '卵泡期': "生理期终于走啦！现在的你代谢快、心情好，简直是‘人间小太阳’。✨",
  '排卵期': "现在是你最有魅力、状态最好的时候。🥰",
  '黄体期': "最近可能会觉得胸胀或想睡，这是身体在提醒你‘该慢下来了’。🫂",
};

/**
 * 本地智能回复逻辑：优先匹配离线问答库，其次匹配阶段核心建议
 */
const getLocalSmartResponse = (query: string, phase: CyclePhase, persona: AiPersona): string => {
  const q = query.toLowerCase();
  const config = PERSONA_CONFIGS[persona];
  let bestMatch: string | null = null;
  let maxScore = 0;

  // 1. 遍历问答库进行关键词加权匹配
  for (const entry of OFFLINE_QA_BANK) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length; // 匹配词越长权重越高
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = entry.answer;
    }
  }

  // 2. 如果没有匹配到特定问题，使用阶段兜底
  if (!bestMatch || maxScore < 2) {
    bestMatch = PHASES_CORE[phase] || "无论发生什么，我都会是你最坚实的依靠。❤️";
  }

  return `${config.offlinePrefix}\n\n${bestMatch}`;
};

async function fetchOpenAICompatible(baseUrl: string, apiKey: string, model: string, prompt: string, onChunk?: (text: string) => void) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${normalizedBase}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      stream: !!onChunk
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
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
    const pingPrompt = "ping";
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: pingPrompt,
      });
      if (response.text) return { success: true, message: "连接成功！Google Gemini 响应正常。" };
    } else {
      const defaultBases: any = {
        deepseek: 'https://api.deepseek.com/v1',
        zhipu: 'https://open.bigmodel.cn/api/paas/v4',
        custom: apiBase
      };
      const models: any = {
        deepseek: 'deepseek-chat',
        zhipu: 'glm-4-flash',
        custom: customModel || 'gpt-3.5-turbo'
      };
      const baseUrl = apiBase || defaultBases[provider];
      if (!baseUrl) throw new Error("请输入 API Base URL");
      
      await fetchOpenAICompatible(baseUrl, apiKey, models[provider], pingPrompt);
      return { success: true, message: `连接成功！${provider === 'custom' ? '自定义模型' : provider} 已就绪。` };
    }
    throw new Error("未知错误");
  } catch (err: any) {
    return { success: false, message: `连接失败: ${err.message}` };
  }
};

export const getHealthAdviceStream = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const settings = getSettings();
  const cached = getValidAdviceFromCache(currentPhase, userQuery);
  if (cached) { onChunk(cached); return; }

  const persona = settings.aiPersona || 'guardian';
  const provider = settings.aiProvider || 'gemini';
  const config = PERSONA_CONFIGS[persona];
  const apiKey = settings.customApiKey || process.env.API_KEY;

  try {
    if (!apiKey) throw new Error("NO_KEY");

    const latestLog = recentLogs[0];
    const cycleContext = latestLog 
      ? `[背景]：周期第 ${Math.ceil(Math.abs(Date.now() - new Date(latestLog.startDate).getTime()) / 86400000)} 天，${currentPhase}。`
      : `[背景]：${currentPhase}。`;

    const prompt = `[身份]：${config.instruction}\n${cycleContext}\n[用户提问]："${userQuery}"\n[规则]：1. 温暖共情。2. 提供包含物理方案（如艾灸穴位）或生活的具体建议。3. 注意防烫伤等安全提示。4. 控制在150字内。`;

    let fullText = "";
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.8 }
      });
      for await (const chunk of result) {
        if (chunk.text) { fullText += chunk.text; onChunk(fullText); }
      }
    } else {
      const defaultBases: any = {
        deepseek: 'https://api.deepseek.com/v1',
        zhipu: 'https://open.bigmodel.cn/api/paas/v4',
        custom: settings.customApiBase
      };
      const models: any = {
        deepseek: 'deepseek-chat',
        zhipu: 'glm-4-flash',
        custom: settings.customModelName || 'gpt-3.5-turbo'
      };
      const baseUrl = settings.customApiBase || defaultBases[provider];
      fullText = await fetchOpenAICompatible(baseUrl, apiKey, models[provider], prompt, onChunk);
    }

    if (fullText.length > 10) saveAdviceToCache(fullText, currentPhase, userQuery);

  } catch (error) {
    onChunk(getLocalSmartResponse(userQuery, currentPhase, persona));
  }
};

export const getHealthAdvice = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery?: string
): Promise<string> => {
  const cached = getValidAdviceFromCache(currentPhase, userQuery);
  if (cached) return cached;

  const settings = getSettings();
  const persona = settings.aiPersona || 'guardian';
  const config = PERSONA_CONFIGS[persona];
  const apiKey = settings.customApiKey || process.env.API_KEY;

  try {
    if (!apiKey) throw new Error("NO_KEY");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = userQuery 
      ? `[${config.name}] 针对问题 "${userQuery}" 给出 100 字内体贴的建议（可含穴位艾灸等物理缓解）。阶段：${currentPhase}。`
      : `[${config.name}] 此时是 ${currentPhase}，写一段 60 字内暖心的今日贴士。多用 emoji。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || getLocalSmartResponse(userQuery || '', currentPhase, persona);
    saveAdviceToCache(text, currentPhase, userQuery);
    return text;
  } catch (error) {
    return userQuery ? getLocalSmartResponse(userQuery, currentPhase, persona) : (PHASES_CORE[currentPhase] || "欢迎使用燕子经期。🌸");
  }
};

export const getPersonaConfig = (p?: AiPersona) => PERSONA_CONFIGS[p || 'guardian'];
