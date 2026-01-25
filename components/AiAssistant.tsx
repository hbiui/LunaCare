
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Sparkles, Bot, ChevronRight, WifiOff, ShieldCheck, Star, Clock, Info, Flame, ShieldAlert, MapPin, Database, Crosshair } from 'lucide-react';
import { getHealthAdviceStream, getPersonaConfig } from '../services/gemini';
import { getSettings } from '../services/storage';
import { PeriodLog, CyclePhase, ChatMessage, AppSettings } from '../types';

interface AiAssistantProps {
  currentPhase: CyclePhase;
  logs: PeriodLog[];
  settings: AppSettings;
  externalQuery?: string;
  onClearExternalQuery?: () => void;
}

/**
 * 艾灸护宫指南专家卡片
 * 采用独立布局，强调专业性与安全性
 */
const MoxibustionGuideCard: React.FC = () => (
  <div className="mt-3 mb-2 mx-1 p-6 rounded-[2.5rem] bg-gradient-to-br from-rose-50 via-white to-pink-50 border border-rose-100 shadow-xl shadow-rose-200/20 animate-slide-up overflow-hidden relative group">
    {/* 背景动效装饰 */}
    <div className="absolute -right-6 -top-6 text-rose-100/40 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
      <Flame size={120} />
    </div>
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500 rounded-xl text-white shadow-lg shadow-rose-200">
            <Flame size={18} />
          </div>
          <div>
            <span className="text-xs font-black text-rose-800 uppercase tracking-widest block">燕子经期专家建议</span>
            <span className="text-[10px] font-bold text-rose-400 block mt-0.5">Moxibustion Care Guide</span>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-rose-200"></div>
          <div className="w-1 h-1 rounded-full bg-rose-300"></div>
          <div className="w-1 h-1 rounded-full bg-rose-400"></div>
        </div>
      </div>

      {/* 核心穴位展示区 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { name: '气海', pos: '脐下1.5寸', icon: Crosshair },
          { name: '关元', pos: '脐下3寸', icon: Crosshair },
          { name: '中极', pos: '脐下4寸', icon: Crosshair }
        ].map((point, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-rose-100/50 flex flex-col items-center text-center shadow-sm group/point hover:border-rose-300 transition-colors">
            <point.icon size={12} className="text-rose-400 mb-1.5 group-hover/point:scale-125 transition-transform" />
            <span className="text-[12px] font-black text-gray-700">{point.name}</span>
            <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{point.pos}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* 操作指导 */}
        <div className="bg-white/60 p-4 rounded-2xl border border-rose-100/30">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <Info size={14} className="shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-wider">温和灸操作指南</p>
          </div>
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
            将艾条点燃后对准穴位，保持 <span className="text-rose-500 font-black underline decoration-rose-200 underline-offset-4">2-3厘米</span> 距离，以局部温热舒适、皮肤微红为度。每个穴位施灸 <span className="text-rose-500 font-black">10-15分钟</span>。
          </p>
        </div>

        {/* 安全警示 - 视觉强化 */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100/50 ring-1 ring-amber-200/20">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <ShieldAlert size={14} className="shrink-0 animate-pulse" />
            <p className="text-[11px] font-black uppercase tracking-wider">安全红线 · 必读</p>
          </div>
          <ul className="text-[10px] text-amber-800 font-bold space-y-1.5">
            <li className="flex gap-2"><span className="text-amber-400">•</span> 施灸时必须<span className="text-red-500 underline decoration-red-200">开窗通风</span>，保持空气流通。</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> 随时注意温度，严防局部烫伤。</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> 灸后半小时内禁洗冷水澡，避免受寒。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const AiAssistant: React.FC<AiAssistantProps> = ({ currentPhase, logs, settings, externalQuery, onClearExternalQuery }) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [persona, setPersona] = useState(getPersonaConfig(settings.aiPersona));
  const [showPersonaToast, setShowPersonaToast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

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
    const newPersona = getPersonaConfig(settings.aiPersona);
    if (newPersona.name !== persona.name) {
      setPersona(newPersona);
      if (isChatOpen) {
        setShowPersonaToast(true);
        setTimeout(() => setShowPersonaToast(false), 3000);
      }
    }
  }, [settings.aiPersona, isChatOpen]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior });
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => scrollToBottom(chatHistory.length <= 2 ? 'auto' : 'smooth'), 100);
      return () => clearTimeout(timer);
    }
  }, [chatHistory.length, isChatOpen]);

  useEffect(() => {
    if (isChatLoading && isChatOpen) {
      const timer = setTimeout(() => scrollToBottom('smooth'), 50);
      return () => clearTimeout(timer);
    }
  }, [chatHistory, isChatLoading, isChatOpen]);

  useEffect(() => {
    if (externalQuery) {
      setIsChatOpen(true);
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) onClearExternalQuery();
    }
  }, [externalQuery]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    const aiMsgId = Date.now() + 1;
    setChatHistory(prev => [...prev, { role: 'model', content: '', timestamp: aiMsgId }]);

    try {
      await getHealthAdviceStream(
        currentPhase,
        logs,
        textToSend,
        (updatedText) => {
          setChatHistory(prev => prev.map(msg => 
            msg.timestamp === aiMsgId ? { ...msg, content: updatedText } : msg
          ));
        }
      );
    } catch (err) {
      setIsOffline(true);
    } finally {
      setIsChatLoading(false);
    }
  };

  const smartSuggestion = useMemo(() => {
    const latestLog = logs.length > 0 ? logs[0] : null;
    if (!latestLog) return "👋 记录第一次经期，让我为你提供照顾策略。";
    if (currentPhase === CyclePhase.Menstrual) return "🤒 宝贝今天很难受吗？让我教你缓解痛经。";
    if (currentPhase === CyclePhase.Luteal) return "📉 她最近情绪波动，我该怎么哄她？";
    return "✨ 现在是黄金期，有哪些宠爱建议？";
  }, [currentPhase, logs]);

  const dynamicTags = useMemo(() => {
    const base = ["🤒 缓解痛经", "🔥 艾灸温宫", "🍲 暖宫食谱", "❌ 经期禁忌", "📖 周期科普"];
    if (currentPhase === CyclePhase.Menstrual) return base;
    return ["✨ 黄金期建议", "🍵 经后补血", ...base.slice(2)];
  }, [currentPhase]);

  /**
   * 增强型检测逻辑：除了艾灸，还检测核心穴位名词
   */
  const mentionsMoxibustion = (text: string) => {
    const keywords = ['艾灸', '气海', '关元', '中极', '施灸', '温灸'];
    return keywords.some(kw => text.includes(kw));
  };

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
                <h3 className="font-black text-gray-800 text-sm">{isOffline ? "本地守护模式" : `AI ${persona.name}`}</h3>
                {isOffline && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Local Brain</span>}
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[180px]">
                {isChatOpen ? (isOffline ? "离线智库已就绪" : "云端神经网络已连接") : smartSuggestion}
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${isChatOpen ? 'rotate-180 bg-rose-100 text-rose-500' : ''}`}>
             <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>

        {isChatOpen && (
          <div className="bg-white flex flex-col h-[550px] sm:h-[600px] animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
              {showPersonaToast && (
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-3 shadow-xl flex items-center gap-3 animate-slide-down pointer-events-auto m-2 rounded-2xl">
                  <div className="p-2 bg-white/20 rounded-xl"><Star size={18} className="fill-white" /></div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">人格已切换</span>
                    <p className="text-xs font-black">{persona.name} 准备就绪 ✨</p>
                  </div>
                </div>
              )}
              {isOffline && !showPersonaToast && (
                <div className="bg-emerald-50/95 backdrop-blur-md px-5 py-3 flex items-center gap-3 border-b border-emerald-100 animate-slide-down pointer-events-auto m-2 rounded-2xl border shadow-lg">
                  <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-sm ring-2 ring-white"><ShieldCheck size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">已启用本地守护模式 <WifiOff size={10} /></p>
                    <p className="text-[9px] font-bold text-emerald-700/70 mt-0.5">离线状态下，我仍能回答有关艾灸、痛经缓解的常见问题。</p>
                  </div>
                </div>
              )}
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-gradient-to-b from-rose-50/10 to-white pt-16">
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-full py-10 text-center space-y-8">
                  <div className="relative text-5xl animate-bounce">{persona.icon}</div>
                  <button 
                    onClick={() => handleSendMessage(smartSuggestion)}
                    className="mx-auto block max-w-xs bg-white p-5 rounded-[2rem] border-2 border-dashed border-rose-100 text-left hover:border-rose-400 transition-all group shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="text-rose-400 shrink-0 mt-0.5" size={18} />
                      <p className="text-gray-600 font-black text-xs leading-relaxed">{smartSuggestion}</p>
                    </div>
                  </button>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up group`}>
                  {/* 消息正文气泡 */}
                  <div className={`relative max-w-[90%] rounded-[1.8rem] px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${
                    msg.role === 'user' 
                      ? 'bg-rose-500 text-white rounded-br-none font-bold' 
                      : 'bg-white border border-rose-100/50 text-gray-700 rounded-bl-none font-medium'
                  }`}>
                    {isOffline && msg.role === 'model' && msg.content && (
                      <div className="mb-2 flex items-center gap-1.5">
                        <div className="p-1 bg-emerald-100 rounded-md text-emerald-600">
                          <Database size={8} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">本地库建议</span>
                      </div>
                    )}

                    {msg.content || (msg.role === 'model' && (
                      <div className="flex gap-1 py-1">
                        <div className="w-1.5 h-1.5 bg-rose-200 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-rose-200 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-rose-200 rounded-full animate-bounce delay-150"></div>
                      </div>
                    ))}
                  </div>

                  {/* 独立于气泡之外的专家卡片 */}
                  {msg.role === 'model' && msg.content && mentionsMoxibustion(msg.content) && (
                    <div className="w-full max-w-[95%]">
                      <MoxibustionGuideCard />
                    </div>
                  )}

                  <div className={`mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                     <Clock size={8} className={msg.role === 'user' ? 'text-rose-300' : 'text-gray-300'} />
                     <span className={`text-[9px] font-bold ${msg.role === 'user' ? 'text-rose-300' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</span>
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
                  placeholder={isOffline ? "向本地智库提问，如：痛经..." : `向 ${persona.name} 咨询...`}
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-rose-500 text-white p-3 rounded-full shadow-lg active:scale-90 transition-all disabled:opacity-50"
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
