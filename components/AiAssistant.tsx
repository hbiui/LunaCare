
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Sparkles, Bot, ChevronRight, WifiOff, ShieldCheck, Star, Clock, Info, Flame, ShieldAlert, MapPin, Database, Crosshair, Coffee, HeartPulse, BrainCircuit, Activity, Search, Thermometer, Wind, ChevronDown, ChevronUp } from 'lucide-react';
import { getHealthAdviceStream, getPersonaConfig, getLocalSmartResponse } from '../services/gemini';
import { getSettings } from '../services/storage';
import { PeriodLog, CyclePhase, ChatMessage, AppSettings } from '../types';

interface AiAssistantProps {
  currentPhase: CyclePhase;
  logs: PeriodLog[];
  settings: AppSettings;
  externalQuery?: string;
  onClearExternalQuery?: () => void;
}

const CategoryIcon = ({ content }: { content: string }) => {
  const c = content.toLowerCase();
  if (c.includes('饮食') || c.includes('吃') || c.includes('补') || c.includes('糖') || c.includes('汤')) return <Coffee size={14} className="text-amber-500" />;
  if (c.includes('痛') || c.includes('穴位') || c.includes('艾灸') || c.includes('药') || c.includes('病')) return <HeartPulse size={14} className="text-rose-500" />;
  if (c.includes('心情') || c.includes('情绪') || c.includes('想哭') || c.includes('抱抱')) return <BrainCircuit size={14} className="text-purple-500" />;
  if (c.includes('运动') || c.includes('健身') || c.includes('跑步') || c.includes('拉伸') || c.includes('瑜伽')) return <Activity size={14} className="text-emerald-500" />;
  return <Sparkles size={14} className="text-rose-400" />;
};

const MoxibustionGuideCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-5 mb-4 mx-1 p-0 rounded-[2.8rem] bg-white border border-rose-100 shadow-2xl shadow-rose-200/30 animate-slide-up overflow-hidden group">
      <div 
        className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-6 relative overflow-hidden cursor-pointer active:brightness-95 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute -right-6 -top-6 text-white/10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
          <Flame size={120} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
              <Flame size={24} className="text-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-[16px] font-black text-white tracking-tight">艾灸温宫 · 深度理疗指南</h4>
              <p className="text-[10px] font-bold text-rose-100 uppercase tracking-[0.2em] mt-0.5 opacity-80">Professional Moxibustion Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest hidden sm:inline">
              {isExpanded ? '收起详情' : '展开方案'}
            </span>
            <div className={`p-2 rounded-xl bg-white/20 backdrop-blur-md transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-7 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-rose-500" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">核心理疗穴位</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: '气海', pos: '脐下1.5寸', desc: '生气之海' },
                { name: '关元', pos: '脐下3寸', desc: '补肾要穴' },
                { name: '中极', pos: '脐下4寸', desc: '调理胞宫' }
              ].map((point, i) => (
                <div key={i} className="relative bg-gradient-to-b from-gray-50 to-white p-4 rounded-3xl border border-gray-100 flex flex-col items-center text-center shadow-sm hover:border-rose-300 transition-all hover:-translate-y-1 group/point">
                  <Crosshair size={16} className="text-rose-400 mb-2.5 group-hover/point:scale-110 transition-transform" />
                  <span className="text-[14px] font-black text-gray-700">{point.name}</span>
                  <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{point.pos}</span>
                  <div className="mt-2.5 h-0.5 w-4 bg-rose-100 group-hover/point:w-8 transition-all"></div>
                  <span className="text-[8px] font-bold text-rose-300 mt-2 opacity-0 group-hover/point:opacity-100 transition-opacity">{point.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10"><Thermometer size={40} /></div>
              <div className="flex items-center gap-2.5 mb-3 text-rose-600">
                <Info size={16} className="shrink-0" />
                <p className="text-[11px] font-black uppercase tracking-wider">温和灸操作指南</p>
              </div>
              <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                将艾条点燃，距离穴位 <span className="text-rose-500 font-black">2-3cm</span>，以局部温热舒适、不灼痛为度。每个穴位施灸 <span className="text-rose-500 font-black underline decoration-rose-200 underline-offset-4">10-15分钟</span>。
              </p>
            </div>

            <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-100/50 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10"><Wind size={40} /></div>
              <div className="flex items-center gap-2.5 mb-3 text-amber-600">
                <ShieldAlert size={16} className="shrink-0 animate-bounce" />
                <p className="text-[11px] font-black uppercase tracking-wider">安全红线</p>
              </div>
              <ul className="text-[10px] text-amber-800 font-bold space-y-2.5">
                <li className="flex gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                  <span>必须<span className="text-rose-600 underline">开窗通风</span>，严防在密闭环境操作。</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                  <span>灸后半小时内<span className="text-rose-600">禁碰冷水</span>，防止寒湿入侵。</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiAssistant: React.FC<AiAssistantProps> = ({ currentPhase, logs, settings, externalQuery, onClearExternalQuery }) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  // 默认假设在线，只有请求明确失败后才显示离线图标
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [persona, setPersona] = useState(getPersonaConfig(settings.aiPersona));
  const [showPersonaToast, setShowPersonaToast] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

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

    const intentMap: Record<string, string> = {
      '痛': '正在为您匹配缓解痛经的针对性理疗方案...',
      '难受': '正在寻找物理止痛与暖宫建议...',
      '艾灸': '正在为您准备艾灸穴位图与操作指南...',
      '吃': '正在定制暖宫膳食投喂清单...',
      '补': '正在匹配经期营养补充策略...',
      '心情': '正在组织暖心的情感支持语言...',
      '运动': '正在为您匹配柔和的经期拉伸动作...'
    };
    const matchedIntent = Object.keys(intentMap).find(kw => textToSend.includes(kw));
    setDetectedIntent(matchedIntent ? intentMap[matchedIntent] : '正在为您深度分析，请稍候...');

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
          // 如果返回的内容包含离线前缀，说明实际上处于离线回退模式
          if (updatedText.includes(persona.name === '温情守护者' ? '迷路' : '不可用')) {
            setIsOfflineMode(true);
          } else {
            setIsOfflineMode(false);
          }
        }
      );
    } catch (err) {
      setIsOfflineMode(true);
      const localResponse = getLocalSmartResponse(textToSend, currentPhase, settings.aiPersona || 'guardian');
      setChatHistory(prev => prev.map(msg => 
        msg.timestamp === aiMsgId ? { ...msg, content: localResponse } : msg
      ));
    } finally {
      setIsChatLoading(false);
      setDetectedIntent(null);
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

  const mentionsMoxibustion = (text: string) => {
    const keywords = ['艾灸', '气海', '关元', '中极', '施灸', '温灸', '穴位'];
    return keywords.some(kw => text.includes(kw));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`bg-white rounded-[2.8rem] shadow-2xl shadow-rose-200/20 border border-rose-50 overflow-hidden transition-all duration-500 ${isChatOpen ? 'ring-2 ring-rose-200/50' : ''}`}>
        <div 
          className={`p-6 flex justify-between items-center cursor-pointer active:bg-rose-50 transition-colors ${isChatOpen ? 'bg-rose-50/50 border-b border-rose-100' : 'bg-white'}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center gap-4">
            <div className={`relative p-3.5 rounded-2xl text-white shadow-xl transition-all transform ${isChatOpen ? 'bg-gradient-to-br from-rose-500 to-pink-500 rotate-6' : 'bg-rose-400'}`}>
                {isOfflineMode ? <WifiOff size={24} /> : <span className="text-xl">{persona.icon}</span>}
                {!isChatOpen && !isOfflineMode && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                  </span>
                )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-800 text-[15px]">{isOfflineMode ? "离线守护中" : `AI ${persona.name}`}</h3>
                {isOfflineMode && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Local</span>}
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-1 truncate max-w-[200px]">
                {isChatOpen ? (isOfflineMode ? "深度差异化离线库已就绪" : "正在基于您的人格偏好生成方案...") : smartSuggestion}
              </p>
            </div>
          </div>
          <div className={`p-2.5 rounded-full bg-gray-50 text-gray-400 transition-all duration-300 ${isChatOpen ? 'rotate-180 bg-rose-100 text-rose-500' : ''}`}>
             <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>

        {isChatOpen && (
          <div className="bg-white flex flex-col h-[600px] sm:h-[650px] animate-fade-in relative overflow-hidden">
            {detectedIntent && (
              <div className="absolute top-4 left-0 right-0 z-30 px-6 animate-slide-down">
                <div className="bg-white/95 backdrop-blur-xl border border-rose-100 px-5 py-3.5 rounded-3xl shadow-2xl flex items-center gap-3">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-2 rounded-xl text-white shadow-lg">
                    <Search size={14} className="animate-pulse" />
                  </div>
                  <span className="text-[11px] font-black text-gray-700">{detectedIntent}</span>
                </div>
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
              {showPersonaToast && (
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-4 shadow-2xl flex items-center gap-4 animate-slide-down pointer-events-auto m-3 rounded-[1.8rem]">
                  <div className="p-2.5 bg-white/20 rounded-2xl"><Star size={20} className="fill-white" /></div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">人格已切换</span>
                    <p className="text-sm font-black">{persona.name} 准备就绪 ✨</p>
                  </div>
                </div>
              )}
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-gradient-to-b from-rose-50/20 to-white pt-20 pb-10">
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-full py-16 text-center space-y-10">
                  <div className="relative text-7xl animate-bounce filter drop-shadow-xl">{persona.icon}</div>
                  <button 
                    onClick={() => handleSendMessage(smartSuggestion)}
                    className="mx-auto block max-w-xs bg-white p-7 rounded-[2.8rem] border-2 border-dashed border-rose-100 text-left hover:border-rose-400 transition-all group shadow-xl shadow-rose-50"
                  >
                    <div className="flex items-start gap-4">
                      <Sparkles className="text-rose-400 shrink-0 mt-1" size={20} />
                      <p className="text-gray-600 font-black text-[13px] leading-relaxed italic">“{smartSuggestion}”</p>
                    </div>
                  </button>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up group`}>
                  <div className={`relative max-w-[92%] rounded-[2rem] px-6 py-4.5 text-[14px] leading-relaxed shadow-md transition-all ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-br-none font-bold' 
                      : 'bg-white border border-rose-50 text-gray-700 rounded-bl-none font-medium'
                  }`}>
                    {msg.role === 'model' && msg.content && (
                      <div className="mb-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-rose-50 rounded-xl">
                            <CategoryIcon content={msg.content} />
                          </div>
                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.15em]">
                            {isOfflineMode ? "LOCAL AI" : `${persona.name} · 分析结果`}
                          </span>
                        </div>
                        {isOfflineMode && <Database size={10} className="text-emerald-400" />}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap prose prose-sm max-w-none prose-rose prose-p:my-1.5 prose-strong:text-rose-600 prose-li:my-1 prose-headings:text-gray-800 prose-headings:font-black">
                      {msg.content || (msg.role === 'model' && (
                        <div className="flex gap-2 py-2">
                          <div className="w-2.5 h-2.5 bg-rose-200 rounded-full animate-bounce"></div>
                          <div className="w-2.5 h-2.5 bg-rose-200 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2.5 h-2.5 bg-rose-200 rounded-full animate-bounce delay-150"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {msg.role === 'model' && msg.content && mentionsMoxibustion(msg.content) && (
                    <div className="w-full max-w-[98%]">
                      <MoxibustionGuideCard />
                    </div>
                  )}

                  <div className={`mt-2.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${msg.role === 'user' ? 'mr-3' : 'ml-3'}`}>
                     <Clock size={10} className={msg.role === 'user' ? 'text-rose-300' : 'text-gray-300'} />
                     <span className={`text-[10px] font-bold ${msg.role === 'user' ? 'text-rose-300' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-50 flex gap-3 overflow-x-auto scrollbar-hide">
              {dynamicTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(tag)}
                  disabled={isChatLoading}
                  className="px-5 py-2.5 rounded-full bg-rose-50/80 text-rose-600 text-[11px] font-black border border-rose-100 whitespace-nowrap active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="p-5 bg-white border-t border-gray-100">
              <div className="flex gap-4 items-center bg-gray-50/80 p-2.5 rounded-[2.5rem] focus-within:ring-2 focus-within:ring-rose-200 transition-all border border-transparent focus-within:bg-white shadow-inner">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isOfflineMode ? "寻求具体的缓解方案..." : `向 ${persona.name} 咨询差异化照顾方案...`}
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent px-5 py-2.5 outline-none text-[15px] font-bold text-gray-700 placeholder:text-gray-300"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-gradient-to-br from-rose-500 to-pink-500 text-white p-3.5 rounded-full shadow-xl active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isChatLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
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
