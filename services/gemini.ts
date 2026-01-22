import { GoogleGenAI } from "@google/genai";
import { PeriodLog, CyclePhase } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const getHealthAdvice = async (
  currentPhase: CyclePhase,
  recentLogs: PeriodLog[],
  userQuery?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Calculate context data
    const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;
    let dayInCycle = 1;
    let cycleContext = "";

    if (latestLog) {
        const lastStart = new Date(latestLog.startDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastStart.getTime());
        dayInCycle = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        cycleContext = `
        - 当前处于周期的第 ${dayInCycle} 天。
        - 最近一次记录开始于: ${latestLog.startDate}。
        - 最近记录的心情: ${latestLog.mood || '未知'}。
        - 最近记录的症状: ${latestLog.symptoms?.join(', ') || '无'}。
        - 最近记录的流量: ${latestLog.flow || '未知'}。
        `;
    } else {
        cycleContext = "- 这是用户第一次使用，暂无历史数据。";
    }
    
    let prompt = "";
    
    // Determine mood context for better empathy
    let moodContext = "";
    if (latestLog && latestLog.mood) {
        const mood = latestLog.mood;
        const symptoms = latestLog.symptoms || [];

        if (['Irritated', 'Irritable', '烦躁'].includes(mood)) {
            moodContext = "她最近记录心情“烦躁”。安抚时请务必顺着她，不要讲道理，用幽默或宠溺化解火气，表达“无论怎样我都站在你这边”。";
        } else if (['Down', 'Teary', 'Sensitive', '低落', '想哭', '敏感', '脆弱'].includes(mood)) {
            moodContext = "她最近记录心情“低落/脆弱”。安抚时语气要极度温柔，给予安全感，告诉她“想哭就哭出来，我一直陪着你”，强调陪伴。";
        } else if (['In Pain', '痛痛'].includes(mood) || symptoms.includes('痛经')) {
            moodContext = "她记录了“痛经”或心情“痛痛”。安抚时要表现出感同身受的心疼，例如：“看着你疼我好难受，恨不得替你疼”，语气要轻柔哄着。";
        } else if (['Needs Hugs', '求抱抱'].includes(mood)) {
            moodContext = "她最近记录心情“求抱抱”。请在回复中营造出“抱紧她”的氛围，多使用拥抱的表情或描写，例如“快过来让我紧紧抱住”。";
        } else if (['Tired', '疲惫'].includes(mood)) {
            moodContext = "她最近记录心情“疲惫”。安抚时让她什么都别做，好好休息，传递出“我会搞定一切”的可靠感。";
        }
    }

    if (userQuery) {
       prompt = `
       你现在的身份是用户非常温柔、体贴的男朋友，同时也是一位拥有丰富女性健康知识的专家。
       
       **用户女友的生理状态**:
       - 阶段: ${currentPhase}
       ${cycleContext}
       
       **用户的问题**: "${userQuery}"
       
       ${moodContext ? `**特别情感指示（基于她最近的心情）**: ${moodContext}` : ''}
       
       请严格按照以下步骤回答：
       
       1. **共情与安抚**: 开头必须先用温柔、宠溺的语气安抚她（可以使用昵称如“宝贝”、“亲爱的”），表达你的心疼。
          ${moodContext ? `(请重点参考上面的“特别情感指示”来生成这段话，要让她感到被理解)` : ''}
       2. **症状分析与建议**: 针对她提到的不适或问题，给出 **3 条** 具体的、可执行的缓解措施。
          - 拒绝废话，要具体。例如：不要只说“吃点好的”，要说“给她买一块黑巧克力或者煮一碗红豆沙”。
          - 结合物理疗法（按摩、热敷）、饮食和情绪价值。
       3. **结尾**: 再次表达关爱。
       
       **格式要求**: 
       - 请不要使用 Markdown 的粗体符号（**），因为界面无法渲染。请使用 emoji (✨, 🍵, 💆‍♀️, ❤️) 标记重点。
       - 分段清晰，总字数控制在 300 字以内。
       `;
    } else {
      prompt = `
      你是一个体贴的男朋友助手。请根据以下女友的生理周期数据，为“男朋友用户”生成一份今日的**简短行动指南**。
      
      **女友状态档案**:
      - 当前阶段: ${currentPhase}
      ${cycleContext}
      
      请生成一段温馨的纯文本内容（不要 Markdown 标题），包含以下三个部分：
      
      1. 🌡️ **身体状态解码**: 用一句通俗易懂的话告诉男朋友，她今天身体里发生了什么？（例如：激素水平下降，她可能会感到很累/很嗨/很敏感）。
      2. ✅ **男友行动清单**: 给出 2 个今天具体的行动建议（例如：今天适合带她去吃火锅/今天绝对不要惹她生气/今天适合给她揉揉腰）。
      3. 🥗 **投喂建议**: 推荐一种适合今天的具体食物或饮品。
      
      **语气要求**: 
      - 像是哥们之间的秘密攻略，但充满了对女朋友的爱意。
      - 幽默、轻松、实用。
      - 如果她最近记录了痛经或心情不好，请特别强调照顾情绪。
      - 总字数控制在 150 字左右，不要太长。
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "暂时无法获取建议，请稍后再试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，AI 助手暂时掉线了，请检查网络或稍后再试。";
  }
};