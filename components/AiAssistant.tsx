import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Sparkles, Bot, Lightbulb } from 'lucide-react';
import { getHealthAdvice } from '../services/gemini';
import { PeriodLog, CyclePhase, ChatMessage } from '../types';
import { QUICK_TAGS } from '../data/knowledge';

interface AiAssistantProps {
  currentPhase: CyclePhase;
  logs: PeriodLog[];
  externalQuery?: string; // Prop to receive query from Knowledge Base
  onClearExternalQuery?: () => void; // Callback to clear query after sending
}

const AiAssistant: React.FC<AiAssistantProps> = ({ currentPhase, logs, externalQuery, onClearExternalQuery }) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading, isChatOpen]);

  // Handle External Query (from Knowledge Base)
  useEffect(() => {
    if (externalQuery) {
      setIsChatOpen(true);
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) {
        onClearExternalQuery();
      }
    }
  }, [externalQuery]);

  // Generate Smart Suggestion (The "Guess what you want to ask" single prominent tag)
  const smartSuggestion = useMemo(() => {
    const latestLog = logs.length > 0 ? logs[0] : null;
    if (!latestLog) return "👋 初次见面，我可以帮你做什么？";

    const { mood, symptoms } = latestLog;

    // Menstrual Phase Logic
    if (currentPhase === CyclePhase.Menstrual) {
        if (symptoms.includes('痛经') || mood === 'In Pain') {
            return "🤕 她痛经很难受，有什么快速缓解的办法？";
        }
        if (mood === 'Craving') {
            return "🍰 她生理期想吃甜食，有什么健康的推荐吗？";
        }
        if (['Irritated', 'Irritable', '烦躁'].includes(mood)) {
            return "💣 她生理期心情烦躁，我该怎么哄她？";
        }
        if (['Down', 'Teary', '低落', '脆弱'].includes(mood)) {
            return "🌧️ 她心情很低落，我该怎么安慰她？";
        }
        return "🩸 生理期这几天我需要特别注意什么？";
    }

    // Luteal (PMS) Logic
    if (currentPhase === CyclePhase.Luteal) {
         if (['Irritated', 'Irritable', '烦躁'].includes(mood)) {
            return "😤 她最近是不是PMS（经前综合症）？我该怎么办？";
         }
         if (symptoms.includes('乳房胀痛')) {
             return "👙 她胸胀不舒服，怎么帮她缓解？";
         }
         return "📉 黄体期（PMS）她会有什么身体反应？";
    }

    // Other Phases
    if (currentPhase === CyclePhase.Ovulation) {
        return "🥚 排卵期她的身体有什么特别的变化？";
    }

    // Default based on mood only
    if (mood === 'Tired') return "💤 她最近很累，怎么帮她恢复精力？";
    if (mood === 'Needs Hugs') return "🫂 她求抱抱，除了拥抱我还适合做什么？";

    return "📅 根据她的周期，今天有什么建议？";
  }, [currentPhase, logs]);

  // Generate Secondary Dynamic Tags
  const dynamicTags = useMemo(() => {
    const newTags: string[] = [];
    
    // Fallbacks based on phase
    switch (currentPhase) {
      case CyclePhase.Menstrual:
        newTags.push("🤕 缓解痛经妙招", "🍲 经期暖身食谱", "❌ 经期禁忌清单");
        break;
      case CyclePhase.Follicular:
        newTags.push("✨ 适合做什么运动？", "🥗 增肌减脂食谱");
        break;
      case CyclePhase.Ovulation:
        newTags.push("👶 备孕注意事项", "🌡️ 排卵痛是怎么回事？");
        break;
      case CyclePhase.Luteal:
        newTags.push("💣 缓解经前暴躁", "🎈 消除水肿小贴士");
        break;
      default:
        newTags.push("🍎 健康饮食建议");
    }
    
    // Add generic
    if (newTags.length < 5) {
         newTags.push("📖 生理周期科普", "🍵 红糖水有用吗？");
    }

    return newTags.slice(0, 8);
  }, [currentPhase]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // Get response
    const response = await getHealthAdvice(currentPhase, logs, textToSend);

    const aiMsg: ChatMessage = {
      role: 'model',
      content: response,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, aiMsg]);
    setIsChatLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Chat Interface */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden transition-all duration-300">
        {/* Header */}
        <div 
          className="p-4 bg-gradient-to-r from-pink-50 to-white border-b border-pink-100 flex justify-between items-center cursor-pointer hover:bg-pink-50 transition-colors"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white shadow-sm transition-all ${isChatOpen ? 'bg-gradient-to-br from-pink-400 to-rose-400' : 'bg-pink-400'}`}>
                <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">男友助手 Dr. AI</h3>
                {isChatLoading && <span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full animate-pulse">思考中...</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">基于当前周期的智能建议</p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isChatOpen ? 'rotate-180' : ''} text-gray-400`}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
        </div>

        {isChatOpen && (
          <div className="bg-gray-50 flex flex-col h-[500px] sm:h-[450px]">
            {/* Chat Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent"
            >
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-full py-6 text-center space-y-6 opacity-100">
                  <div className="bg-pink-100 p-4 rounded-full">
                    <Sparkles size={32} className="text-pink-400" />
                  </div>
                  
                  {/* Smart Suggestion Card */}
                  <div className="w-full max-w-xs px-4">
                      <p className="text-gray-400 text-xs mb-3 font-medium uppercase tracking-widest">猜你想问</p>
                      <button 
                        onClick={() => handleSendMessage(smartSuggestion)}
                        className="w-full bg-white p-4 rounded-2xl shadow-sm border border-pink-200 text-left hover:shadow-md hover:border-pink-300 transition-all group relative overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-1 h-full bg-pink-400"></div>
                         <div className="flex items-start gap-3">
                            <Lightbulb className="text-pink-400 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-gray-800 font-bold text-sm leading-relaxed group-hover:text-pink-600 transition-colors">
                                    {smartSuggestion}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    基于她的{currentPhase === CyclePhase.Menstrual ? '经期' : '周期'}和心情记录
                                </p>
                            </div>
                         </div>
                      </button>
                  </div>

                  {/* Quick Tags Grid (Common Questions) */}
                  <div className="w-full max-w-xs px-4">
                    <p className="text-gray-400 text-xs mb-3 font-medium uppercase tracking-widest">常见问题</p>
                    <div className="grid grid-cols-2 gap-2">
                        {QUICK_TAGS.slice(0, 4).map((tag, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(tag)}
                                className="p-2.5 bg-white border border-gray-100 rounded-xl text-xs text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors shadow-sm text-left truncate font-medium"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-none' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start animate-fade-in">
                   <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                      <Loader2 className="animate-spin text-pink-400" size={16} />
                      <span className="text-xs text-gray-400">AI 正在组织语言...</span>
                   </div>
                </div>
              )}
            </div>

            {/* Secondary Quick Suggestions Tags (Bottom Scroller) */}
            <div className="bg-gray-50 pt-2 pb-2 border-t border-gray-100">
                 <div className="px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                     <div className="flex gap-2">
                        {dynamicTags.map((tag, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(tag)}
                                disabled={isChatLoading}
                                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-pink-100 text-xs text-gray-600 font-medium shadow-sm hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {tag}
                            </button>
                        ))}
                     </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入问题，例如：她肚子疼怎么办？"
                disabled={isChatLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-gray-50 text-sm disabled:opacity-70"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-pink-500 text-white p-2.5 rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;