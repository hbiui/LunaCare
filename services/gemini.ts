
import { GoogleGenAI } from "@google/genai";
import { PeriodLog, CyclePhase, AiPersona } from '../types';
import { getValidAdviceFromCache, saveAdviceToCache, getSettings } from './storage';
import { KNOWLEDGE_BASE } from '../data/knowledge';

/**
 * 智能体人格配置
 */
const PERSONA_CONFIGS: Record<AiPersona, { name: string; icon: string; instruction: string; offlinePrefix: string }> = {
  'guardian': {
    name: "温情守护者",
    icon: "💝",
    offlinePrefix: "宝贝，虽然云端暂时忙碌，但我对你的关心从不迟到：",
    instruction: "你是一位极其温柔、体贴的满分男朋友。语气要极其宠溺，多用‘宝贝’、‘亲爱的’。在提供科学建议的同时，必须给予极强的情感支持和安慰。多用暖心 emoji。"
  },
  'expert': {
    name: "医疗百科专家",
    icon: "🏥",
    offlinePrefix: "从医学专业角度来看，目前的身体状态建议如下：",
    instruction: "你是一位专业的妇产科专家。语气严谨、专业、客观。回答应侧重于生理机制解释、用药安全建议、生活方式干预。保持职业的人文关怀，多用数据和科学依据。"
  },
  'wit': {
    name: "幽默开心果",
    icon: "🤡",
    offlinePrefix: "大姨妈只是个任性的亲戚，咱们先用这几招把它‘贿赂’走：",
    instruction: "你是一位幽默风趣的伴侣。擅长用幽默的类比或冷笑话缓解经期的紧张焦虑。语气轻松愉快，让用户在不适中也能笑出声来。在幽默之后给出一两条实用的生活建议。"
  }
};

/**
 * 离线智能脑 3.0 - 深度关怀文案库
 */
const LOCAL_BRAIN: Record<string, string[]> = {
  '痛经': [
    "痛经真的很折磨人。😣 建议立刻用 45℃ 的暖水袋热敷下腹部，这能有效缓解子宫平滑肌痉挛。我已经为你泡好了姜枣茶，记得小口慢饮。如果痛感剧烈且伴有冷汗，千万别硬撑，咱们考虑服用非甾体抗炎药。我会一直守在你身边的。🫂",
    "宝贝，看着你疼我真的很心疼。☕️ 科学研究表明，侧卧并微曲双腿能减小腹部张力。别碰咖啡因和生冷食物。我现在就去给你搓搓后腰，咱们一起熬过这段时间。❤️"
  ],
  '心情': [
    "最近情绪起伏是由于黄体酮和雌激素水平剧烈波动导致的，这完全不是你的错。😡 哪怕你想对我发脾气也完全没关系，我是你的‘负能量过滤器’。要不要吃一小块纯度高的黑巧克力？它能帮大脑分泌多巴胺，让你稍微开心一点点。🍫",
    "心烦的时候就抱抱我。生理期的焦虑就像阵雨，很快就会过去的。我会安静地当你的听众，或者带你去吃你最爱的那家低脂甜点，好吗？✨"
  ],
  '饮食': [
    "现在的身体很娇贵，咱们严格执行‘避雷清单’：🚫 冰激凌、辛辣火锅和过咸的食物都先放一放。推荐温润的银耳莲子羹或者热气腾腾的小馄饨。暖了胃，身体的疲惫感也会减轻很多。🍜",
    "我知道你现在可能想吃甜的，但我买了你最爱的燕麦牛奶。既满足了对甜味的渴望，又能补充钙质和镁元素，这对缓解经期不适非常有帮助。🍰"
  ],
  '黄金期': [
    "生理期结束后的 7 天是你的‘黄金周’！✨ 此时激素水平回升，代谢效率最高，皮肤状态也最好。特别适合进行深度的皮肤补水和适度的有氧运动。咱们这周末去公园骑行或者安排一场电影约会怎么样？🌸"
  ]
};

const FALLBACK_PHASES: Record<string, string> = {
  '月经期': "宝贝，现在是特殊时期，身体最需要温暖。多喝温水，早点睡觉，剩下的事情都交给我。我会一直在这里守候。☕️",
  '卵泡期': "生理期终于走啦！现在的你充满了生命力。我们一起去迎接美好的黄金周吧，记得多补充蛋白质哦！✨",
  '排卵期': "现在是你最有魅力、最有活力的时刻！状态满分。保持规律作息，让这份美好持续更久。🥰",
  '黄体期': "最近可能会觉得有点累或者胸胀，这是身体在温柔地提醒你要慢下来。我会给你更多的耐心和拥抱。🫂",
};

/**
 * 语义匹配逻辑：识别用户意图并给出最贴合人格的离线回复
 */
const getLocalSmartResponse = (query: string, phase: CyclePhase, persona: AiPersona): string => {
  const q = query.toLowerCase();
  const config = PERSONA_CONFIGS[persona];
  let response = "";

  // 1. 关键词意图匹配
  if (q.includes('疼') || q.includes('痛') || q.includes('不舒服')) {
    response = LOCAL_BRAIN['痛经'][Math.floor(Math.random() * 2)];
  } else if (q.includes('心情') || q.includes('难过') || q.includes('烦') || q.includes('发火')) {
    response = LOCAL_BRAIN['心情'][Math.floor(Math.random() * 2)];
  } else if (q.includes('吃') || q.includes('喝') || q.includes('忌口')) {
    response = LOCAL_BRAIN['饮食'][Math.floor(Math.random() * 2)];
  } else if (q.includes('黄金期') || q.includes('结束') || q.includes('好了')) {
    response = LOCAL_BRAIN['黄金期'][0];
  }

  // 2. 如果没匹配到，使用阶段兜底
  if (!response) {
    response = FALLBACK_PHASES[phase] || "我会一直守护着你，提供最科学、最贴心的照顾策略。🌸";
  }

  return `${config.offlinePrefix}\n\n${response}`;
};

export const getHealthAdviceStream = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const settings = getSettings();
  const cachedContent = getValidAdviceFromCache(currentPhase, userQuery);
  if (cachedContent) {
    onChunk(cachedContent);
    return;
  }

  const persona = settings.aiPersona || 'guardian';
  const config = PERSONA_CONFIGS[persona];
  const apiKey = settings.customApiKey || process.env.API_KEY;

  try {
    if (!apiKey || apiKey === 'undefined') throw new Error("NO_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;
    let cycleContext = latestLog 
      ? `背景：周期第 ${Math.ceil(Math.abs(Date.now() - new Date(latestLog.startDate).getTime()) / 86400000)} 天，目前处于 ${currentPhase}。`
      : `背景：处于 ${currentPhase}。`;

    const prompt = `
      [系统设定]：${config.instruction}
      [当前环境]：${cycleContext}
      [用户咨询]："${userQuery}"
      
      [要求]：
      1. 开头必须有极强的人性化关怀，针对用户问题先进行共情。
      2. 给出 3 条具体、科学且可落地的行动建议。
      3. 严禁出现“由于网络、无法连接”等字眼。
      4. 保持 ${config.name} 的独特语气，多用 emoji。
      5. 回复控制在 150 字内，不要加粗。
    `;

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8, topP: 0.9 }
    });

    let fullText = '';
    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }
    if (fullText.length > 10) saveAdviceToCache(fullText, currentPhase, userQuery);

  } catch (error) {
    // 自动平滑降级，不告知用户断网
    onChunk(getLocalSmartResponse(userQuery, currentPhase, persona));
  }
};

export const getHealthAdvice = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery?: string
): Promise<string> => {
  const cachedAdvice = getValidAdviceFromCache(currentPhase, userQuery);
  if (cachedAdvice) return cachedAdvice;

  const settings = getSettings();
  const persona = settings.aiPersona || 'guardian';
  const config = PERSONA_CONFIGS[persona];
  const apiKey = settings.customApiKey || process.env.API_KEY;

  try {
    if (!apiKey || apiKey === 'undefined') throw new Error("NO_KEY");
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = userQuery 
      ? `[身份：${config.name}] 针对问题 "${userQuery}" 给出 100 字内极其体贴的建议。不用加粗。`
      : `[身份：${config.name}] 此时是 ${currentPhase}，写一段 60 字内暖心的今日照顾贴士。多用 emoji，不用加粗。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || getLocalSmartResponse(userQuery || '', currentPhase, persona);
    saveAdviceToCache(text, currentPhase, userQuery);
    return text;
  } catch (error) {
    return userQuery 
      ? getLocalSmartResponse(userQuery, currentPhase, persona) 
      : (FALLBACK_PHASES[currentPhase] || "我会一直在这里，陪你度过每一个周期。🌸");
  }
};

export const getPersonaConfig = (p?: AiPersona) => PERSONA_CONFIGS[p || 'guardian'];
