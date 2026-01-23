
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Sparkles, Bot, Lightbulb, ChevronRight, MessageSquareHeart, WifiOff, Zap, ShieldCheck } from 'lucide-react';
import { getHealthAdviceStream, getPersonaConfig } from '../services/gemini';
import { getSettings } from '../services/storage';
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [persona, setPersona] = useState(getPersonaConfig(getSettings().aiPersona));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      setPersona(getPersonaConfig(getSettings().aiPersona));
    }
  }, [isChatOpen]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isChatOpen) setTimeout(scrollToBottom, 100);
  }, [chatHistory, isChatLoading, isChatOpen]);

  useEffect(() => {
    if (externalQuery) {
      setIsChatOpen(true);
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) onClearExternalQuery();
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

    const userMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    const aiMsgId = Date.now() + 1;
    setChatHistory(prev => [...prev, { role: 'model', content: '', timestamp: aiMsgId }]);

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
    return ["🤒 缓解痛经", "🍲 暖宫食谱", "❌ 经期禁忌", "📖 周期科普", "🍵 红糖水真相"];
  }, [currentPhase]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-rose-100/50 border border-rose-50 overflow-hidden transition-all duration-500 ${isChatOpen ? 'ring-2 ring-rose-200/50' : ''}`}>
        <div 
          className={`p-5 flex justify-between items-center cursor-pointer active:bg-rose-50 transition-colors ${isChatOpen ? 'bg-rose-50/50 border-b border-rose-100' : 'bg-white'}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center gap-4">
            <div className={`relative p-3 rounded-2xl text-white shadow-lg transition-all transform ${isChatOpen ? 'bg-gradient-to-br from-rose-500 to-pink-500 rotate-6' : 'bg-rose-400'}`}>
                {isOffline ? <WifiOff size={24} /> : <span className="text-xl">{persona.icon}</span>}
                {!isChatOpen && !isOffline && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                  </span>
                )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-800 text-sm">
                  {isOffline ? "本地守护模式" : `AI ${persona.name}`}
                </h3>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[180px]">
                {isChatOpen ? (isOffline ? "已启用高级本地关怀策略" : "云端神经网络已建立连接") : smartSuggestion}
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${isChatOpen ? 'rotate-180 bg-rose-100 text-rose-500' : ''}`}>
             <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>

        {isChatOpen && (
          <div className="bg-white flex flex-col h-[550px] sm:h-[500px] animate-fade-in">
            {isOffline && (
              <div className="bg-rose-50/50 px-5 py-2 flex items-center gap-2 border-b border-rose-100">
                <ShieldCheck size={12} className="text-rose-500" />
                <span className="text-[10px] font-black text-rose-700">守护中：网络不稳定，我将调用本地最体贴的知识库为你解答。</span>
              </div>
            )}
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide bg-gradient-to-b from-rose-50/10 to-white">
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-full py-10 text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-200 blur-3xl rounded-full opacity-20 animate-pulse"></div>
                    <div className="relative text-5xl animate-bounce">{persona.icon}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{persona.name} 已准备好听你倾诉</p>
                    <button 
                      onClick={() => handleSendMessage(smartSuggestion)}
                      className="mx-auto block max-w-xs bg-white p-5 rounded-[2rem] border-2 border-dashed border-rose-100 text-left hover:border-rose-400 transition-all group active:scale-95 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="text-rose-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-gray-600 font-black text-xs leading-relaxed">{smartSuggestion}</p>
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
                      : 'bg-white border border-rose-100/50 text-gray-700 rounded-bl-none font-medium'
                  }`}>
                    {msg.content || (msg.role === 'model' && <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 bg-rose-200 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-rose-200 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-rose-200 rounded-full animate-bounce delay-150"></div></div>)}
                  </div>
                </div>
              ))}
            </div>

            {/* 保留并美化的常用问答标签区域 */}
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
                  placeholder={isOffline ? "离线智库已就绪..." : `向 ${persona.name} 咨询...`}
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-rose-500 text-white p-3 rounded-full shadow-lg shadow-rose-200 active:scale-90 transition-all disabled:opacity-50"
                >
                  {isChatLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;
