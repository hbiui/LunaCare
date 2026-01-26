
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, Calendar as CalendarIcon, Activity, Heart, Trash2, Edit2, CalendarClock, Settings, Share2, Sparkles, Loader2, BookOpen, ChevronRight, Home, BarChart2, Info, Lightbulb, MessageSquare, Zap, Brain, CircleDot, Thermometer, Moon, Utensils, BatteryLow, Smile } from 'lucide-react';
import { PeriodLog, CyclePhase, AppSettings } from './types';
import { getLogs, addLog, deleteLog, updateLog, getSettings, saveSettings, clearAllData, checkCacheSync } from './services/storage';
import { getHealthAdvice } from './services/gemini';
import { KNOWLEDGE_BASE } from './data/knowledge';
import LogForm from './components/LogForm';
import StatsChart from './components/StatsChart';
import AiAssistant from './components/AiAssistant';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ notificationsEnabled: false, reminderOffset: 0 });
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingLog, setEditingLog] = useState<PeriodLog | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'knowledge'>('overview');
  
  // AI Interaction State
  const [dailyTip, setDailyTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [aiTriggerQuery, setAiTriggerQuery] = useState<string | undefined>(undefined);

  // 引用与滚动位置记忆
  const aiAssistantRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({
    overview: 0,
    trends: 0,
    knowledge: 0
  });

  useEffect(() => {
    setLogs(getLogs());
    setAppSettings(getSettings());
  }, []);

  // 处理标签切换：先保存当前滚动位置，再切换
  const handleTabSwitch = (newTab: 'overview' | 'trends' | 'knowledge') => {
    if (newTab === activeTab) {
      // 如果点击当前正在查看的标签，可以选择回到顶部，或者保持不动
      // 这里我们选择不处理，或者你可以改为 window.scrollTo({top: 0, behavior: 'smooth'})
      return;
    }
    scrollPositions.current[activeTab] = window.scrollY;
    setActiveTab(newTab);
  };

  // 当标签页切换后，恢复该页面之前的滚动位置
  useEffect(() => {
    // 如果是因为点击了百科/建议触发的跳转，由该逻辑自行处理滚动，此处跳过
    if (aiTriggerQuery) return;

    const savedPos = scrollPositions.current[activeTab] || 0;
    // 使用 requestAnimationFrame 确保在 DOM 更新后执行滚动还原
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedPos, behavior: 'auto' });
    });
  }, [activeTab]);

  const handleSaveLog = (log: PeriodLog) => {
    if (editingLog && editingLog.id) {
      setLogs(updateLog(log));
    } else {
      setLogs(addLog(log));
    }
    setShowForm(false);
    setEditingLog(undefined);
  };

  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    saveSettings(newSettings);
    setAppSettings(newSettings);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      setLogs(deleteLog(id));
    }
  };

  const handleClearData = () => {
    if (window.confirm('⚠️ 警告：确定要清除所有数据吗？\n\n这将删除所有的经期记录、自定义症状和设置，且无法恢复！')) {
      clearAllData();
      setLogs([]);
      setAppSettings({ notificationsEnabled: false, reminderOffset: 0, postPeriodReminder: false, postPeriodDays: 3 });
      setDailyTip("欢迎使用 燕子经期！记录你的第一次经期数据，我将为你生成专属贴士。");
      setShowSettings(false);
    }
  };

  const handleEdit = (log: PeriodLog) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleKnowledgeClick = (query: string) => {
      // 先记录当前百科页面的滚动位置
      scrollPositions.current[activeTab] = window.scrollY;
      
      setActiveTab('overview');
      setAiTriggerQuery(query);
      
      // 切换后立即滚动到 AI 助手对话框
      setTimeout(() => {
        if (aiAssistantRef.current) {
          aiAssistantRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
  };

  const getSymptomIcon = (s: string) => {
    const map: Record<string, React.ReactNode> = {
      '痛经': <Zap size={10} />,
      '腰酸': <Activity size={10} />,
      '头痛': <Brain size={10} />,
      '长痘': <CircleDot size={10} />,
      '乳房胀痛': <Thermometer size={10} />,
      '失眠': <Moon size={10} />,
      '食欲大增': <Utensils size={10} />,
      '疲劳': <BatteryLow size={10} />
    };
    return map[s] || <CircleDot size={10} />;
  };

  const handleShareSingle = async (log: PeriodLog) => {
    const mood = getMoodEmoji(log.mood) + " " + getMoodLabel(log.mood);
    const flow = getFlowDisplay(log.flow).label + " " + getFlowDisplay(log.flow).drops;
    const symptoms = log.symptoms.length > 0 ? log.symptoms.join('、') : '无明显不适';
    const notes = log.notes ? `\n📝 照顾点滴：${log.notes}` : '';

    const text = `🌸 燕子经期·关怀时刻
-----------------------
📅 日期：${log.startDate}${log.endDate ? ` ~ ${log.endDate}` : ''}
✨ 心情：${mood}
💧 流量：${flow}
🤒 症状：${symptoms}${notes}

❤️ 宝贝，这一天我也在好好守护你。`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '经期关怀记录', text });
      } catch (err) { console.debug('Share cancelled'); }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('宠爱记录已复制到剪贴板！');
      } catch (err) { alert('复制失败'); }
    }
  };

  const handleShareAll = async () => {
    if (logs.length === 0) return;
    const recent = logs.slice(0, 3);
    let historyText = recent.map((log, i) => {
      const duration = log.endDate ? 
        ` (持续 ${Math.round((new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) / 86400000) + 1} 天)` : 
        ' (进行中)';
      return `${i+1}. ${log.startDate}${duration} | ${getMoodLabel(log.mood)}`;
    }).join('\n');

    const text = `📊 燕子经期·历史足迹摘要
-----------------------
共累计守护：${logs.length} 次生理周期
最近记录：
${historyText}

✨ 每一天，我们都在一起变得更好。`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '经期足迹摘要', text });
      } catch (err) { console.debug('Share cancelled'); }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('足迹摘要已复制到剪贴板！');
      } catch (err) { alert('复制失败'); }
    }
  };

  const prediction = useMemo(() => {
    if (logs.length === 0) return null;
    const latestLog = logs[0];
    if (!latestLog.endDate) return null;
    let avgCycle = 28;
    if (logs.length >= 2) {
       let totalDays = 0;
       let count = 0;
       for(let i=0; i < Math.min(logs.length - 1, 3); i++) {
          const curr = new Date(logs[i].startDate);
          const prev = new Date(logs[i+1].startDate);
          totalDays += (curr.getTime() - prev.getTime()) / (86400000);
          count++;
       }
       if (count > 0) avgCycle = Math.round(totalDays / count);
    }
    const lastStart = new Date(latestLog.startDate);
    const nextStart = new Date(lastStart);
    nextStart.setDate(lastStart.getDate() + avgCycle);
    const nextStartStr = nextStart.toISOString().split('T')[0];
    const exists = logs.some(log => log.startDate === nextStartStr);
    if (exists) return null;
    return { startDate: nextStartStr };
  }, [logs]);

  const { currentPhase, currentCycleDay } = useMemo(() => {
    if (logs.length === 0) return { currentPhase: CyclePhase.Unknown, currentCycleDay: 0 };
    const lastPeriod = logs[0];
    const lastStart = new Date(lastPeriod.startDate);
    const today = new Date();
    const cycleDay = Math.ceil(Math.abs(today.getTime() - lastStart.getTime()) / (86400000)); 
    
    let phase = CyclePhase.Follicular;
    if (cycleDay <= 5) phase = CyclePhase.Menstrual;
    else if (cycleDay <= 13) phase = CyclePhase.Follicular;
    else if (cycleDay <= 15) phase = CyclePhase.Ovulation;
    else phase = CyclePhase.Luteal;
    return { currentPhase: phase, currentCycleDay: cycleDay };
  }, [logs]);

  const todayLog = useMemo(() => {
    if (logs.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return logs.find(log => log.startDate === todayStr || (log.endDate && todayStr >= log.startDate && todayStr <= log.endDate));
  }, [logs]);

  const proactiveSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if (currentPhase === CyclePhase.Menstrual) {
      suggestions.push("🤒 宝贝痛经很难受，我该怎么做？");
      suggestions.push("🍵 煮什么热饮能缓解痛经？");
    } else if (currentPhase === CyclePhase.Luteal) {
      suggestions.push("📉 她最近情绪波动，是因为PMS吗？");
      suggestions.push("😴 她最近总是喊累，有什么照顾建议？");
    } else {
      suggestions.push("✨ 现在是黄金期，有什么健康建议？");
    }
    return suggestions.slice(0, 2);
  }, [currentPhase]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTip = async () => {
      if (logs.length === 0) {
        setDailyTip("欢迎使用 燕子经期！记录你的第一次经期数据，我将为你生成专属贴士。");
        return;
      }

      const cached = checkCacheSync(currentPhase);
      if (cached) {
        setDailyTip(cached);
        return;
      }

      setLoadingTip(true);
      try {
        const tip = await getHealthAdvice(currentPhase, logs);
        if (isMounted) setDailyTip(tip);
      } finally {
        if (isMounted) setLoadingTip(false);
      }
    };

    fetchTip();
    return () => { isMounted = false; };
  }, [currentPhase, logs.length]);

  const getMoodEmoji = (moodKey: string) => {
    const map: Record<string, string> = {
      'Happy': '😊', 'Sensitive': '🥺', 'Irritable': '😤', 'Tired': '😴',
      'Energetic': '✨', 'Down': '🌧️', 'Teary': '😢',
      'Craving': '🍰', 'In Pain': '😣', 'Needs Hugs': '🫂'
    };
    return map[moodKey] || '😐';
  };

  const getMoodLabel = (moodKey: string) => {
    const map: Record<string, string> = {
      'Happy': '开心', 'Sensitive': '敏感', 'Irritable': '烦躁', 'Tired': '疲惫',
      'Energetic': '活力', 'Down': '低落', 'Teary': '想哭',
      'Craving': '嘴馋', 'In Pain': '痛痛', 'Needs Hugs': '抱抱'
    };
    return map[moodKey] || '一般';
  };

  const getMoodColor = (moodKey: string) => {
    const map: Record<string, string> = {
      'Happy': 'bg-yellow-50 text-yellow-600',
      'Sensitive': 'bg-purple-50 text-purple-600',
      'Irritable': 'bg-red-50 text-red-600',
      'Tired': 'bg-slate-100 text-slate-600',
      'Energetic': 'bg-orange-50 text-orange-600',
      'Down': 'bg-indigo-50 text-indigo-600',
      'Teary': 'bg-blue-50 text-blue-600',
      'Craving': 'bg-pink-50 text-pink-600',
      'In Pain': 'bg-rose-50 text-rose-600',
      'Needs Hugs': 'bg-rose-100 text-rose-700'
    };
    return map[moodKey] || 'bg-gray-50 text-gray-500';
  };

  const getFlowDisplay = (flowKey: string) => {
    const map: Record<string, { label: string, drops: string }> = {
      'Light': { label: '少量', drops: '💧' },
      'Medium': { label: '中等', drops: '💧💧' },
      'Heavy': { label: '大量', drops: '💧💧💧' }
    };
    return map[flowKey] || { label: flowKey, drops: '' };
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-fade-in px-1">
        {/* Today's Status Card - Full width focus */}
        <div className="relative overflow-hidden rounded-[2.8rem] bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 p-8 pt-10 pb-12 shadow-2xl shadow-rose-200/60 transition-all">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl animate-pulse" />
            <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-pink-300/10 blur-2xl" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="rounded-full bg-white/15 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl border border-white/20 mb-10">
                    {currentPhase}
                </div>
                
                <div className="relative mb-10">
                    <div className="flex h-44 w-44 items-center justify-center rounded-full border-[8px] border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)] ring-1 ring-white/20 animate-pop">
                        <div className="flex flex-col items-center">
                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)]">{currentCycleDay}</span>
                            <span className="text-[11px] font-black text-rose-100 uppercase tracking-widest mt-1 opacity-80 font-bold">Cycle Day</span>
                        </div>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center gap-6">
                    {todayLog ? (
                        <div className="inline-flex items-center gap-3 bg-white/10 px-8 py-3 rounded-full backdrop-blur-xl border border-white/20 shadow-lg">
                            <span className="text-3xl filter drop-shadow-md">{getMoodEmoji(todayLog.mood)}</span>
                            <div className="h-5 w-[1px] bg-white/30" />
                            <span className="text-sm font-black text-white">今日{getMoodLabel(todayLog.mood)}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-sm font-bold text-rose-50 text-opacity-95">今天是{currentPhase}第{currentCycleDay}天</p>
                            <button 
                                onClick={() => setShowForm(true)}
                                className="px-6 py-2 rounded-full bg-white/10 text-[11px] font-black text-white uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                            >
                                立即同步身体数据 ✨
                            </button>
                        </div>
                    )}

                    <div className="w-full pt-4">
                        <div className="glass-card rounded-[2.5rem] p-6 text-left border border-white/20 shadow-xl">
                            <h4 className="mb-3 flex items-center gap-2 text-[11px] font-black text-rose-800/80 uppercase tracking-widest">
                                <Sparkles size={16} className="text-rose-500 animate-pulse" />
                                男友宠爱指南
                            </h4>
                            <div className="text-[14px] leading-relaxed text-gray-800 font-medium">
                                {loadingTip ? (
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                        <span className="text-gray-400 font-bold text-xs uppercase tracking-tighter">AI 精研中...</span>
                                    </div>
                                ) : (
                                    <p className="italic leading-relaxed">“{dailyTip}”</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Suggestion Section */}
        {proactiveSuggestions.length > 0 && (
          <div className="animate-fade-in space-y-4 px-1">
              <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">精选建议：</span>
              </div>
              <div className="flex flex-col gap-3">
                  {proactiveSuggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleKnowledgeClick(suggestion)}
                        className="flex items-center justify-between w-full p-6 bg-white border border-rose-50 rounded-[2.2rem] shadow-sm text-left group active:scale-[0.98] transition-all hover:border-rose-200"
                      >
                          <span className="text-[14px] font-black text-gray-700 group-hover:text-rose-600 transition-colors pr-4">{suggestion}</span>
                          <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                              <ChevronRight size={16} />
                          </div>
                      </button>
                  ))}
              </div>
          </div>
        )}

        <div ref={aiAssistantRef}>
          <AiAssistant 
              currentPhase={currentPhase} 
              logs={logs} 
              settings={appSettings}
              externalQuery={aiTriggerQuery}
              onClearExternalQuery={() => setAiTriggerQuery(undefined)}
          />
        </div>

        {/* History Section */}
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between px-2">
              <h3 className="flex items-center gap-2 text-md font-black text-gray-800 tracking-tight">
                  <div className="p-1.5 bg-rose-100 rounded-xl text-rose-500"><CalendarIcon size={16}/></div>
                  经期历史
              </h3>
              {logs.length > 0 && (
                <button 
                    onClick={handleShareAll}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-rose-100 text-[11px] font-black text-rose-500 shadow-sm active:scale-95 transition-all hover:bg-rose-50"
                >
                    <Share2 size={14} />
                    报告摘要
                </button>
              )}
            </div>
            
            {prediction && (
                <div className="flex items-center justify-between rounded-[2.5rem] bg-white p-6 shadow-sm border border-rose-50 ring-1 ring-rose-50/30">
                    <div className="flex items-center gap-4">
                        <div className="rounded-[1.3rem] bg-rose-50 p-4 text-rose-500 shadow-inner">
                            <CalendarClock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">下月预测</p>
                            <p className="text-[16px] font-black text-gray-800 mt-0.5">{prediction.startDate}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setEditingLog({ startDate: prediction.startDate } as PeriodLog); setShowForm(true); }}
                        className="rounded-2xl bg-rose-500 px-6 py-3 text-[12px] font-black text-white shadow-xl shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all"
                    >
                        标记开始
                    </button>
                </div>
            )}

            <div className="grid gap-5">
                {logs.length === 0 ? (
                    <div className="rounded-[3rem] border-2 border-dashed border-rose-100 py-24 text-center bg-white/40">
                        <Heart size={48} className="mx-auto mb-4 text-rose-100" />
                        <p className="text-sm font-black text-gray-400 tracking-wide">还没有记录，开始宠爱她吧</p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const flowData = getFlowDisplay(log.flow);
                        return (
                            <div key={log.id} className="group relative rounded-[2.5rem] bg-white p-8 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:border-rose-100 active:scale-[0.99] animate-fade-in">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-6">
                                        <div className="flex flex-col items-center justify-center rounded-[1.8rem] bg-gray-50/60 px-5 py-3 text-center min-w-[72px] border border-gray-100 shadow-sm">
                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter leading-none">{new Date(log.startDate).getMonth() + 1}月</span>
                                            <span className="text-3xl font-black text-gray-800 leading-none mt-2.5">{new Date(log.startDate).getDate()}</span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] opacity-80">{log.startDate} {log.endDate ? `~ ${log.endDate}` : ''}</p>
                                                <div className="mt-3 flex flex-wrap gap-2.5">
                                                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black shadow-sm ${getMoodColor(log.mood)}`}>
                                                        <span className="text-sm">{getMoodEmoji(log.mood)}</span>
                                                        <span>{getMoodLabel(log.mood)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black shadow-sm border border-blue-100/30">
                                                        <span className="text-[10px] opacity-80">{flowData.drops}</span>
                                                        <span>{flowData.label}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {log.symptoms && log.symptoms.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {log.symptoms.map(s => (
                                                        <span key={s} className="flex items-center gap-2 text-[11px] font-bold text-gray-500 bg-gray-50/80 border border-gray-100 px-3.5 py-1.5 rounded-2xl">
                                                            <span className="text-gray-400">{getSymptomIcon(s)}</span>
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {log.notes && (
                                                <div className="flex items-start gap-2.5 max-w-[220px] border-l-3 border-rose-100 pl-4 py-0.5">
                                                    <MessageSquare size={14} className="text-rose-200 mt-1 shrink-0" />
                                                    <p className="text-[12px] text-gray-400 italic font-medium line-clamp-2 leading-relaxed">
                                                        {log.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => handleShareSingle(log)} className="p-2.5 text-gray-300 hover:text-emerald-500 transition-all bg-gray-50/80 rounded-2xl active:scale-90" title="分享"><Share2 size={18}/></button>
                                        <button onClick={() => handleEdit(log)} className="p-2.5 text-gray-300 hover:text-rose-500 transition-all bg-gray-50/80 rounded-2xl active:scale-90" title="编辑"><Edit2 size={18}/></button>
                                        <button onClick={() => handleDelete(log.id)} className="p-2.5 text-gray-300 hover:text-red-500 transition-all bg-gray-50/80 rounded-2xl active:scale-90" title="删除"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#fff5f7]">
      <header className="sticky top-0 z-40 border-b border-rose-50 bg-white/95 px-6 py-6 backdrop-blur-xl pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-rose-500 text-white shadow-xl shadow-rose-200 ring-2 ring-white animate-pop">
                <Heart size={24} fill="currentColor" />
            </div>
            <div>
                <h1 className="text-xl font-black text-gray-800 tracking-tight">燕子经期</h1>
                <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest opacity-80">Care Assistant</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-gray-50 text-gray-400 transition-all hover:bg-gray-100 active:scale-90 shadow-sm border border-gray-100"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] scroll-container">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && <div className="animate-fade-in px-1"><StatsChart logs={logs} /></div>}
        {activeTab === 'knowledge' && (
            <div className="space-y-8 animate-fade-in px-1">
                <div className="px-2">
                    <h2 className="text-3xl font-black text-gray-800">百科全书</h2>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Knowledge Library</p>
                </div>
                <div className="grid gap-6">
                    {KNOWLEDGE_BASE.map(category => (
                        <div key={category.id} className="overflow-hidden rounded-[2.8rem] bg-white shadow-sm border border-gray-100 group transition-all hover:shadow-lg">
                             <div className={`p-7 ${category.color} bg-opacity-10 flex items-center gap-5 border-b border-gray-50`}>
                                 <div className={`p-4 rounded-[1.4rem] bg-white shadow-sm ${category.color} transition-transform group-hover:scale-110`}>
                                    <category.icon size={24} />
                                 </div>
                                 <h3 className="text-lg font-black text-gray-800">{category.title}</h3>
                             </div>
                             <div className="divide-y divide-gray-50">
                                 {category.items.map(item => (
                                     <button 
                                        key={item.id}
                                        onClick={() => handleKnowledgeClick(item.query)}
                                        className="flex w-full items-center justify-between px-7 py-6 text-left transition-all hover:bg-rose-50/30 group active:bg-rose-50"
                                     >
                                         <span className="text-[15px] font-bold text-gray-600 group-hover:text-rose-500 transition-colors">{item.title}</span>
                                         <ChevronRight size={18} className="text-gray-300 group-hover:text-rose-300 transition-all transform group-hover:translate-x-1" />
                                     </button>
                                 ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {activeTab === 'overview' && (
        <button 
          onClick={() => { setEditingLog(undefined); setShowForm(true); }}
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-6 z-50 flex h-18 w-18 items-center justify-center rounded-[2rem] bg-rose-500 text-white shadow-2xl shadow-rose-300 transition-all hover:scale-105 active:scale-90 animate-pop ring-4 ring-white"
          style={{ width: '4.5rem', height: '4.5rem' }}
        >
          <Plus size={36} strokeWidth={3} />
        </button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-rose-50 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl shadow-[0_-10px_30px_rgba(255,200,210,0.1)]">
        <div className="mx-auto flex max-w-2xl items-center justify-around py-4 h-20">
          <button 
            onClick={() => handleTabSwitch('overview')}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'overview' ? 'text-rose-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`rounded-[1.2rem] p-3 transition-all ${activeTab === 'overview' ? 'bg-rose-50 shadow-inner' : ''}`}><Home size={26} /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">主页</span>
          </button>
          <button 
             onClick={() => handleTabSwitch('trends')}
             className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'trends' ? 'text-rose-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`rounded-[1.2rem] p-3 transition-all ${activeTab === 'trends' ? 'bg-rose-50 shadow-inner' : ''}`}><BarChart2 size={26} /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">趋势</span>
          </button>
          <button 
             onClick={() => handleTabSwitch('knowledge')}
             className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'knowledge' ? 'text-rose-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`rounded-[1.2rem] p-3 transition-all ${activeTab === 'knowledge' ? 'bg-rose-50 shadow-inner' : ''}`}><BookOpen size={26} /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">百科</span>
          </button>
        </div>
      </nav>

      {showForm && <LogForm onSave={handleSaveLog} onCancel={() => { setShowForm(false); setEditingLog(undefined); }} initialData={editingLog} />}
      {showSettings && <SettingsModal settings={appSettings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} onClearData={handleClearData} />}
    </div>
  );
};

export default App;
