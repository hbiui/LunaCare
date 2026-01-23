
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Sparkles, Bot, Lightbulb, ChevronRight, MessageSquareHeart } from 'lucide-react';
import { getHealthAdviceStream } from '../services/gemini';
import { PeriodLog, CyclePhase, ChatMessage } from '../types';

interface AiAssistantProps {
  currentPhase: CyclePhase;
  logs: PeriodLog[];
  externalQuery?: string;
  onClearExternalQuery?: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ currentPhase, logs, externalQuery, onClearExternalQuery }) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatHistory, isChatLoading, isChatOpen]);

  useEffect(() => {
    if (externalQuery) {
      setIsChatOpen(true);
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) {
        onClearExternalQuery();
      }
    }
  }, [externalQuery]);

  const smartSuggestion = useMemo(() => {
    const latestLog = logs.length > 0 ? logs[0] : null;
    if (!latestLog) return "👋 记录第一次经期，让我为你提供照顾策略。";
    if (currentPhase === CyclePhase.Menstrual) return "🤒 宝贝今天很难受吗？让我教你缓解痛经。";
    if (currentPhase === CyclePhase.Luteal) return "📉 她最近情绪波动，我该怎么哄她？";
    return "✨ 现在是黄金期，有哪些宠爱建议？";
  }, [currentPhase, logs]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // 创建 AI 占位消息用于流式更新
    const aiMsgId = Date.now() + 1;
    setChatHistory(prev => [...prev, {
      role: 'model',
      content: '',
      timestamp: aiMsgId
    }]);

    await getHealthAdviceStream(
      currentPhase,
      logs,
      textToSend,
      (updatedText) => {
        setChatHistory(prev => prev.map(msg => 
          msg.timestamp === aiMsgId ? { ...msg, content: updatedText } : msg
        ));
        setIsChatLoading(false);
      }
    );
  };

  const dynamicTags = useMemo(() => {
    const tags = ["🤒 缓解痛经", "🍲 暖宫食谱", "❌ 经期禁忌", "📖 周期科普", "🍵 喝红糖水有用吗？"];
    return tags.slice(0, 4);
  }, [currentPhase]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-rose-100/50 border border-rose-50 overflow-hidden transition-all duration-500 ${isChatOpen ? 'ring-2 ring-rose-200/50' : ''}`}>
        <div 
          className={`p-5 flex justify-between items-center cursor-pointer active:bg-rose-50 transition-colors ${isChatOpen ? 'bg-rose-50/50 border-b border-rose-100' : 'bg-white'}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl text-white shadow-lg transition-all transform ${isChatOpen ? 'bg-gradient-to-br from-rose-500 to-pink-500 rotate-6' : 'bg-rose-400'}`}>
                <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-800 text-sm">男友专属 AI</h3>
                {!isChatOpen && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>}
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[180px]">
                {isChatOpen ? "实时流式响应已开启" : smartSuggestion}
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${isChatOpen ? 'rotate-180 bg-rose-100 text-rose-500' : ''}`}>
             <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>

        {isChatOpen && (
          <div className="bg-white flex flex-col h-[550px] sm:h-[500px] animate-fade-in">
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide"
            >
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-full py-10 text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-200 blur-2xl rounded-full opacity-30 animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm">
                      <MessageSquareHeart size={48} className="text-rose-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">试试这样问我</p>
                    <button 
                      onClick={() => handleSendMessage(smartSuggestion)}
                      className="w-full max-w-xs bg-rose-50/50 p-5 rounded-[2rem] border-2 border-dashed border-rose-100 text-left hover:border-rose-400 hover:bg-rose-50 transition-all group active:scale-95"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-gray-700 font-black text-sm leading-relaxed">
                            {smartSuggestion}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`group relative max-w-[85%] rounded-[1.8rem] px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${
                    msg.role === 'user' 
                      ? 'bg-rose-500 text-white rounded-br-none font-bold' 
                      : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-bl-none font-medium'
                  }`}>
                    {msg.content || (msg.role === 'model' && <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-150"></div></div>)}
                    <span className={`absolute -bottom-5 text-[8px] font-black text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'right-0' : 'left-0'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-white border-t border-gray-50 flex gap-2 overflow-x-auto scrollbar-hide">
              {dynamicTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(tag)}
                  disabled={isChatLoading}
                  className="px-4 py-2 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-100 whitespace-nowrap active:scale-90 transition-all disabled:opacity-50"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-[2rem] focus-within:ring-2 focus-within:ring-rose-200 transition-all">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="问问 AI：她痛经怎么办？"
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 disabled:opacity-50 shadow-lg shadow-rose-200 active:scale-90 transition-all"
                >
                  {isChatLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
              <p className="text-[8px] text-center text-gray-300 font-bold mt-2 uppercase tracking-tighter">Global High-Speed Link Enabled</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;
