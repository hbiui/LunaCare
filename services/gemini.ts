
import { GoogleGenAI } from "@google/genai";
import { PeriodLog, CyclePhase } from '../types';
import { getValidAdviceFromCache, saveAdviceToCache } from './storage';
import { KNOWLEDGE_BASE } from '../data/knowledge';

// 暖心本地文案库 - 深度覆盖高频场景
const LOCAL_BRAIN: Record<string, string[]> = {
  '痛经': [
    "宝贝，痛经的时候可以试试用暖水袋热敷小肚子，或者我帮你按摩一下腰部。记得多喝 40℃ 左右的温开水。如果实在太疼了，千万别硬撑，我们可以吃一点非甾体类止痛药。我会一直陪着你的。🫂",
    "听着，现在的疼痛只是暂时的。我已经准备好了暖宫贴，你先躺一会。要不要听我讲个笑话分散下注意力？❤️"
  ],
  '红糖': [
    "关于红糖水，科学研究说它主要提供热量，缓解痛感更多是热水的功劳。不过只要你喝了觉得心里暖暖的，我每天都给你冲。记得趁热喝哦！☕️",
    "红糖水虽然不是神药，但那一抹甜能让你心情好一点。如果你想更有效果，我下次加点生姜和红枣一起煮。✨"
  ],
  '心情': [
    "最近情绪波动是正常的激素变化，不是你的错。哪怕你对我发脾气也没关系，我会照单全收。想吃什么好吃的吗？我这就去买。🧁",
    "如果你觉得想哭或者心烦，就抱抱我。我会安静地当你的听众。现在的你最需要温柔的对待，而我就是那个执行者。🫂"
  ],
  '饮食': [
    "这几天咱们避开生冷和太辣的食物，好吗？我想带你去吃热气腾腾的汤面，或者温润的粥。身体暖了，心情也会跟着变好。🍜",
    "我知道你最近可能想吃甜的，但咱们适量好吗？我买了你最爱的那家低糖小蛋糕，既满足了嘴馋又不会增加身体负担。🍰"
  ],
  '洗头': [
    "生理期是可以洗头的，但一定要注意：洗完立刻用吹风机吹干，千万别着凉。如果你觉得累，我来帮你洗，顺便帮你吹干，好不好？💇‍♀️"
  ]
};

const FALLBACK_ADVICE: Record<string, string> = {
  '月经期': "宝贝，现在是特殊时期，肚子可能不舒服。记得多喝暖暖的红糖姜茶，早点休息，我会一直陪着你的。❤️",
  '卵泡期': "生理期终于结束啦！现在是你的黄金变美期，身体代谢加快，心情也会越来越好，要不要一起出去散散步？✨",
  '排卵期': "现在身体状态最棒啦！皮肤也会很有光泽。记得多补充水分，保持活力满满哦。🥰",
  '黄体期': "最近可能会觉得有点累或者情绪波动，这是正常的生理现象。我会更加温柔地照顾你，累了就靠在我肩膀上。🫂",
  '未知': "欢迎开启燕子经期！记录第一条数据，我将为你生成专属的宠爱策略。🌸"
};

/**
 * 本地知识检索引擎：在断网或 API 故障时提供智能回复
 */
const getLocalSmartResponse = (query: string, phase: CyclePhase): string => {
  const q = query.toLowerCase();
  
  // 1. 尝试从 LOCAL_BRAIN 匹配关键词
  for (const [key, responses] of Object.entries(LOCAL_BRAIN)) {
    if (q.includes(key)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  // 2. 尝试从 KNOWLEDGE_BASE 匹配百科条目
  for (const category of KNOWLEDGE_BASE) {
    for (const item of category.items) {
      if (q.includes(item.title.replace('？', '').replace('?', ''))) {
        return `关于“${item.title}”，我的建议是：${item.query.length > 50 ? '这是个很好的问题。生理期要注意保持温暖，避免过度劳累，心情愉悦最重要。具体的细节我们可以一起慢慢了解。' : item.query}。宝贝，我会一直守护你的。✨`;
      }
    }
  }

  // 3. 默认阶段性回复
  return `宝贝，关于“${query}”，由于网络连接的小调皮，我暂时无法从云端获取专家建议。但请记得：目前你处于${phase}，保持心情舒畅和身体温暖是最重要的。我会一直在这里陪着你！❤️`;
};

const fetchWithRetry = async (fn: () => Promise<any>, retries = 1, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay);
  }
};

export const getHealthAdviceStream = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery: string,
  onChunk: (text: string) => void
): Promise<void> => {
  // 1. 优先检查本地缓存
  const cachedContent = getValidAdviceFromCache(currentPhase, userQuery);
  if (cachedContent) {
    onChunk(cachedContent);
    return;
  }

  // 2. 预检：如果是百科条目，且处于断网边缘，可以快速给出本地响应
  const localResponse = getLocalSmartResponse(userQuery, currentPhase);

  try {
    // 检查环境变量是否存在
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
        throw new Error("MISSING_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;
    
    let cycleContext = latestLog 
      ? `- 周期第 ${Math.ceil(Math.abs(Date.now() - new Date(latestLog.startDate).getTime()) / 86400000)} 天，阶段: ${currentPhase}。`
      : `- 阶段: ${currentPhase}。`;

    const prompt = `
      你是一位极其温柔的男朋友。
      背景：${cycleContext}
      用户提问："${userQuery}"
      要求：1. 开头宠溺。2. 3条实用建议。3. 不用加粗符号。4. 150字内。
    `;

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8 }
    });

    let fullText = '';
    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
    }

    if (fullText.length > 20) {
      saveAdviceToCache(fullText, currentPhase, userQuery);
    }

  } catch (error: any) {
    console.warn("AI Stream failing, falling back to Local Brain:", error);
    // 3. API 失败时，输出本地智能回复
    onChunk(localResponse);
  }
};

export const getHealthAdvice = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery?: string
): Promise<string> => {
  const cachedAdvice = getValidAdviceFromCache(currentPhase, userQuery);
  if (cachedAdvice) return cachedAdvice;

  try {
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
        throw new Error("MISSING_API_KEY");
    }

    const advice = await fetchWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = userQuery 
        ? `你是温柔男友，针对 "${userQuery}" 给出100字内建议。阶段 ${currentPhase}。不用加粗。`
        : `你是体贴男友。基于处于 ${currentPhase} 阶段，生成一段80字内的今日照顾建议。多用 emoji，不用加粗。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || FALLBACK_ADVICE[currentPhase];
    });

    saveAdviceToCache(advice, currentPhase, userQuery);
    return advice;
  } catch (error: any) {
    return userQuery ? getLocalSmartResponse(userQuery, currentPhase) : (FALLBACK_ADVICE[currentPhase] || FALLBACK_ADVICE['未知']);
  }
};
