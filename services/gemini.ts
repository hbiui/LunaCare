
import { GoogleGenAI } from "@google/genai";
import { PeriodLog, CyclePhase } from '../types';
import { getValidAdviceFromCache, saveAdviceToCache } from './storage';

// 暖心本地文案库
const FALLBACK_ADVICE: Record<string, string> = {
  '月经期': "宝贝，现在是特殊时期，肚子可能不舒服。记得多喝暖暖的红糖姜茶，早点休息，我会一直陪着你的。❤️",
  '卵泡期': "生理期终于结束啦！现在是你的黄金变美期，身体代谢加快，心情也会越来越好，要不要一起出去散散步？✨",
  '排卵期': "现在身体状态最棒啦！皮肤也会很有光泽。记得多补充水分，保持活力满满哦。🥰",
  '黄体期': "最近可能会觉得有点累或者情绪波动，这是正常的生理现象。我会更加温柔地照顾你，累了就靠在我肩膀上。🫂",
  '未知': "欢迎开启燕子经期！记录第一条数据，我将为你生成专属的宠爱策略。🌸"
};

// 固定话题关键字，用于触发流式缓存
const FIXED_TOPICS = ["禁忌", "不能吃", "怎么办", "红糖水", "洗头", "运动", "食谱", "科普"];

const fetchWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 1500): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Gemini API Quota exceeded (429). Switching to fallback mode.");
      throw error;
    }
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
};

/**
 * 流式健康建议获取，带缓存检查
 */
export const getHealthAdviceStream = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery: string,
  onChunk: (text: string) => void
): Promise<void> => {
  // 1. 优先检查缓存
  const cachedContent = getValidAdviceFromCache(currentPhase, userQuery);
  if (cachedContent) {
    console.debug("Streaming from cache:", userQuery);
    onChunk(cachedContent);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;
    
    let cycleContext = latestLog 
      ? `- 周期第 ${Math.ceil(Math.abs(Date.now() - new Date(latestLog.startDate).getTime()) / 86400000)} 天，阶段: ${currentPhase}。`
      : `- 阶段: ${currentPhase}。`;

    const prompt = `
      你是一位极其温柔的男朋友专家。
      背景：${cycleContext}
      用户提问："${userQuery}"
      要求：
      1. 开头用宠溺语气。
      2. 给出 3 条实用建议，多用 emoji。
      3. 严禁使用加粗符号（**）。
      4. 200字以内。
    `;

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8 }
    });

    let fullText = '';
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }

    // 2. 自动保存结果到缓存
    if (fullText.length > 30) {
      saveAdviceToCache(fullText, currentPhase, userQuery);
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    const errorMsg = error?.message || "";
    if (errorMsg.includes("429")) {
      onChunk("宝贝，我刚才被太多人咨询啦（配额超限），不过我对你的关心不打折：最近要记得多喝暖水，我会一直守护你的。❤️");
    } else {
      onChunk("⚠️ 网络连接有些调皮，请尝试稍后再试。");
    }
  }
};

/**
 * 获取健康建议（非流式）
 */
export const getHealthAdvice = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery?: string
): Promise<string> => {
  // 1. 优先从缓存获取
  const cachedAdvice = getValidAdviceFromCache(currentPhase, userQuery);
  if (cachedAdvice) {
    return cachedAdvice;
  }

  // 2. 缓存未命中，调用 API
  try {
    const advice = await fetchWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = userQuery 
        ? `你是温柔男友，针对提问 "${userQuery}" 给出建议。当前阶段 ${currentPhase}。不用加粗符号。`
        : `你是体贴男友助手。基于女友处于 ${currentPhase} 阶段，生成一段100字内的今日照顾建议。包含身体解码、行动清单。多用 emoji，不用加粗符号。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || FALLBACK_ADVICE[currentPhase] || FALLBACK_ADVICE['未知'];
    });

    // 3. 结果存入缓存
    saveAdviceToCache(advice, currentPhase, userQuery);

    return advice;
  } catch (error: any) {
    console.warn("Returning fallback advice due to API error/quota");
    return FALLBACK_ADVICE[currentPhase] || FALLBACK_ADVICE['未知'];
  }
};
