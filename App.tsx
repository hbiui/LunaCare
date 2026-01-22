import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Activity, Heart, Trash2, Edit2, CalendarClock, Settings, Share2, Sparkles, Loader2, BookOpen, ChevronRight } from 'lucide-react';
import { PeriodLog, CyclePhase, AppSettings } from './types';
import { getLogs, addLog, deleteLog, updateLog, getSettings, saveSettings, clearAllData } from './services/storage';
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

  useEffect(() => {
    setLogs(getLogs());
    setAppSettings(getSettings());
  }, []);

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
      setActiveTab('overview');
      setAiTriggerQuery(query);
      // Allow UI to switch tab before scrolling/triggering could be handled by AiAssistant
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Logic to predict next period date based on history
  const prediction = useMemo(() => {
    if (logs.length === 0) return null;
    const latestLog = logs[0];
    
    // Only predict if the latest log has an end date
    if (!latestLog.endDate) return null;

    // Calculate average cycle length
    let avgCycle = 28;
    if (logs.length >= 2) {
       let totalDays = 0;
       let count = 0;
       for(let i=0; i < Math.min(logs.length - 1, 3); i++) {
          const curr = new Date(logs[i].startDate);
          const prev = new Date(logs[i+1].startDate);
          totalDays += (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          count++;
       }
       if (count > 0) avgCycle = Math.round(totalDays / count);
    }
    
    const lastStart = new Date(latestLog.startDate);
    const nextStart = new Date(lastStart);
    nextStart.setDate(lastStart.getDate() + avgCycle);
    // Use local YYYY-MM-DD
    const year = nextStart.getFullYear();
    const month = String(nextStart.getMonth() + 1).padStart(2, '0');
    const day = String(nextStart.getDate()).padStart(2, '0');
    const nextStartStr = `${year}-${month}-${day}`;

    // Check for duplicates
    const exists = logs.some(log => {
        const logDate = new Date(log.startDate);
        const diff = Math.abs(logDate.getTime() - nextStart.getTime());
        return diff < 7 * 24 * 60 * 60 * 1000;
    });

    if (exists) return null;

    return {
        startDate: nextStartStr,
    };
  }, [logs]);

  // Helper logic to determine current phase and next period
  const { currentPhase, daysUntilNext, currentCycleDay } = useMemo(() => {
    if (logs.length === 0) {
      return { currentPhase: CyclePhase.Unknown, daysUntilNext: 0, currentCycleDay: 0 };
    }

    const lastPeriod = logs[0]; // logs are sorted desc
    const lastStart = new Date(lastPeriod.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastStart.getTime());
    const cycleDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    let avgCycle = 28;
    if (logs.length >= 2) {
       let totalDays = 0;
       let count = 0;
       for(let i=0; i < Math.min(logs.length - 1, 3); i++) {
          const curr = new Date(logs[i].startDate);
          const prev = new Date(logs[i+1].startDate);
          totalDays += (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          count++;
       }
       if (count > 0) avgCycle = Math.round(totalDays / count);
    }

    let phase = CyclePhase.Follicular;
    if (cycleDay <= 5) phase = CyclePhase.Menstrual; // Approximate
    else if (cycleDay <= 13) phase = CyclePhase.Follicular;
    else if (cycleDay <= 15) phase = CyclePhase.Ovulation;
    else phase = CyclePhase.Luteal;

    const daysLeft = avgCycle - cycleDay;

    return { 
        currentPhase: phase, 
        daysUntilNext: daysLeft,
        currentCycleDay: cycleDay 
    };
  }, [logs]);

  // Determine Today's Active Log (if any)
  const todayLog = useMemo(() => {
    if (logs.length === 0) return null;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTs = new Date(todayStr).getTime();

    // Check recent logs
    for (const log of logs) {
        const startTs = new Date(log.startDate).getTime();
        const endTs = log.endDate ? new Date(log.endDate).getTime() : null;

        // If today is equal or after start
        if (todayTs >= startTs) {
            // And (today is equal or before end OR end is null)
            if (!endTs || todayTs <= endTs) {
                return log;
            }
        }
    }
    return null;
  }, [logs]);

  // Fetch Daily Tip
  useEffect(() => {
    let isMounted = true;
    const fetchTip = async () => {
      setLoadingTip(true);
      const tip = await getHealthAdvice(currentPhase, logs);
      if (isMounted) {
        setDailyTip(tip);
        setLoadingTip(false);
      }
    };
    
    if (logs.length > 0) {
        fetchTip();
    } else {
        setDailyTip("欢迎使用 燕子经期！记录你的第一次经期数据，我将为你生成专属贴士。");
    }

    return () => { isMounted = false; };
  }, [currentPhase, logs.length]); // Intentionally limited deps

  // Check for notifications
  useEffect(() => {
    if (!Notification || Notification.permission !== 'granted') return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (appSettings.lastNotifiedDate === todayStr) return;

    let notificationSent = false;

    if (appSettings.postPeriodReminder && logs.length > 0) {
      const latestLog = logs[0];
      if (latestLog.endDate) {
        const endDate = new Date(latestLog.endDate);
        const targetDate = new Date(endDate);
        targetDate.setDate(endDate.getDate() + (appSettings.postPeriodDays || 3));
        
        const tYear = targetDate.getFullYear();
        const tMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
        const tDay = String(targetDate.getDate()).padStart(2, '0');
        const targetStr = `${tYear}-${tMonth}-${tDay}`;

        if (todayStr === targetStr) {
           const title = "燕子经期 经后关怀";
           const body = `她的经期已经结束 ${appSettings.postPeriodDays} 天啦，身体应该恢复得不错了。今天是个带她出去玩或吃好吃的绝佳时机！`;
           new Notification(title, { body });
           notificationSent = true;
        }
      }
    }

    if (!notificationSent && appSettings.notificationsEnabled && prediction) {
      const [pYear, pMonth, pDay] = prediction.startDate.split('-').map(Number);
      const predDate = new Date(pYear, pMonth - 1, pDay);
      
      const targetDate = new Date(predDate);
      targetDate.setDate(predDate.getDate() - appSettings.reminderOffset);
      
      const tYear = targetDate.getFullYear();
      const tMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
      const tDay = String(targetDate.getDate()).padStart(2, '0');
      const targetStr = `${tYear}-${tMonth}-${tDay}`;
      
      if (todayStr === targetStr) {
          const title = "燕子经期 温馨提醒";
          const body = appSettings.reminderOffset === 1 
              ? "亲爱的，根据预测，她的生理期可能明天开始，记得多给些关爱哦。"
              : "亲爱的，根据预测，她的生理期可能今天开始，请注意照顾她的情绪和身体。";
          
          new Notification(title, { body });
          notificationSent = true;
      }
    }

    if (notificationSent) {
      handleSaveSettings({ ...appSettings, lastNotifiedDate: todayStr });
    }

  }, [appSettings, prediction, logs, handleSaveSettings]);
  
  const getMoodLabel = (moodKey: string) => {
      const map: Record<string, string> = {
          'Happy': '开心',
          'Calm': '平静',
          'Energetic': '活力',
          'Tired': '疲惫',
          'Irritated': '烦躁',
          'Irritable': '烦躁', 
          'Down': '低落',
          'Teary': '脆弱',
          'Craving': '嘴馋',
          'In Pain': '痛痛',
          'Needs Hugs': '求抱抱',
          'Sensitive': '敏感' 
      };
      return map[moodKey] || moodKey;
  };

  const getMoodEmoji = (moodKey: string) => {
    const map: Record<string, string> = {
      'Happy': '😊', 'Calm': '🍃', 'Energetic': '✨', 'Tired': '😴',
      'Irritated': '😤', 'Irritable': '😤', 'Down': '🌧️', 'Teary': '😢',
      'Craving': '🍰', 'In Pain': '😣', 'Needs Hugs': '🫂', 'Sensitive': '🥺'
    };
    return map[moodKey] || '😐';
  };

  // --- Sharing Functionality ---
  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '燕子经期 分享',
          text: text,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('内容已复制到剪贴板，快去分享吧！');
      } catch (err) {
        alert('复制失败，请重试');
      }
    }
  };

  const shareLog = (log: PeriodLog) => {
    const duration = log.endDate 
        ? Math.round((new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) / (86400000)) + 1 
        : '?';
    const text = `🌸 她的经期记录\n📅 时间: ${log.startDate} ${log.endDate ? '~ ' + log.endDate : ''} (${duration}天)\n✨ 状态: ${getMoodLabel(log.mood)}\n🌡️ 流量: ${log.flow === 'Light' ? '少量' : log.flow === 'Medium' ? '中等' : '大量'}\n${log.symptoms.length ? `🤒 症状: ${log.symptoms.join(', ')}\n` : ''}${log.notes ? `📝 备注: ${log.notes}\n` : ''}\n-- 来自 燕子经期 经期助手`;
    handleShare(text);
  };

  const shareTrends = () => {
    if (logs.length < 2) {
        alert('需要至少两条记录才能生成趋势分析哦');
        return;
    }

    let totalCycle = 0;
    let cycleCount = 0;
    let totalDuration = 0;
    let durationCount = 0;

    const sortedLogs = [...logs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    for (let i = 0; i < sortedLogs.length; i++) {
        if (sortedLogs[i].endDate) {
            const days = Math.round((new Date(sortedLogs[i].endDate!).getTime() - new Date(sortedLogs[i].startDate).getTime()) / (86400000)) + 1;
            totalDuration += days;
            durationCount++;
        }
        if (i < sortedLogs.length - 1) {
             const days = Math.round((new Date(sortedLogs[i+1].startDate).getTime() - new Date(sortedLogs[i].startDate).getTime()) / (86400000));
             totalCycle += days;
             cycleCount++;
        }
    }

    const avgCycle = cycleCount > 0 ? Math.round(totalCycle / cycleCount) : 28;
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 5;
    const nextDate = prediction ? prediction.startDate : '计算中...';

    const text = `📊 她的周期趋势分析\n\n🔄 平均周期: ${avgCycle} 天\n⏳ 平均经期: ${avgDuration} 天\n🔮 预计下次: ${nextDate}\n\n-- 来自 燕子经期 经期助手`;
    handleShare(text);
  };

  const renderContent = () => {
    if (activeTab === 'trends') {
        return (
            <div className="animate-fade-in">
                 <div className="flex items-center justify-between mb-4 px-2">
                     <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <Activity size={18} className="text-purple-500" />
                        数据分析
                     </div>
                     <button 
                        onClick={shareTrends}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-50 hover:text-purple-600 transition-colors shadow-sm"
                     >
                        <Share2 size={14} />
                        分享趋势
                     </button>
                 </div>
                 <StatsChart logs={logs} />
            </div>
        );
    }

    if (activeTab === 'knowledge') {
        return (
            <div className="animate-fade-in space-y-6">
                <div className="px-2">
                     <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-pink-500" size={24} />
                        生理周期百科
                     </h2>
                     <p className="text-sm text-gray-500 mt-1">
                        点击感兴趣的话题，AI 助手将为你详细解答。
                     </p>
                </div>

                <div className="space-y-6">
                    {KNOWLEDGE_BASE.map(category => (
                        <div key={category.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                             <div className="flex items-center gap-3 mb-4">
                                 <div className={`p-2 rounded-xl ${category.color}`}>
                                    <category.icon size={20} />
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-gray-800">{category.title}</h3>
                                     <p className="text-xs text-gray-400">{category.description}</p>
                                 </div>
                             </div>
                             
                             <div className="grid gap-2">
                                 {category.items.map(item => (
                                     <button 
                                        key={item.id}
                                        onClick={() => handleKnowledgeClick(item.query)}
                                        className="text-left p-3 rounded-xl bg-gray-50 hover:bg-pink-50 transition-colors flex justify-between items-center group"
                                     >
                                         <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">{item.title}</span>
                                         <ChevronRight size={16} className="text-gray-300 group-hover:text-pink-400" />
                                     </button>
                                 ))}
                             </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between">
                     <div>
                         <h3 className="font-bold text-gray-700 text-sm">没找到想问的？</h3>
                         <p className="text-xs text-gray-500 mt-1">直接去问 AI 助手吧，它什么都知道！</p>
                     </div>
                     <button 
                        onClick={() => setActiveTab('overview')}
                        className="bg-white text-blue-500 text-xs font-bold px-4 py-2 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50"
                     >
                        去提问
                     </button>
                </div>
            </div>
        );
    }

    // Default: Overview Tab
    return (
        <div className="space-y-6">
            {/* NEW: Today's Status & Tip Card */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-pink-100 text-sm font-bold uppercase tracking-wider mb-1">今日状态</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{currentPhase}</span>
                                <span className="text-pink-100 text-sm">第 {currentCycleDay} 天</span>
                            </div>
                        </div>
                        {todayLog && (
                            <div className="flex flex-col items-end">
                                <span className="text-3xl filter drop-shadow-md mb-1" title={getMoodLabel(todayLog.mood)}>
                                    {getMoodEmoji(todayLog.mood)}
                                </span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm">
                                    {todayLog.flow === 'Light' ? '少量' : todayLog.flow === 'Medium' ? '中等' : '大量'}
                                </span>
                            </div>
                        )}
                    </div>

                    {todayLog && todayLog.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {todayLog.symptoms.map(s => (
                                <span key={s} className="bg-white/10 border border-white/20 px-2 py-1 rounded-lg text-xs backdrop-blur-sm">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <h4 className="flex items-center gap-2 font-bold text-pink-50 mb-2 text-sm">
                            <Sparkles size={14} className="text-yellow-200" />
                            AI 今日贴士
                        </h4>
                        <div className="text-sm leading-relaxed text-pink-50/90">
                            {loadingTip ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={16}/>
                                    <span>生成中...</span>
                                </div>
                            ) : (
                                <p>{dailyTip}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Chat */}
            <AiAssistant 
                currentPhase={currentPhase} 
                logs={logs} 
                externalQuery={aiTriggerQuery}
                onClearExternalQuery={() => setAiTriggerQuery(undefined)}
            />

            {/* Recent History List */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 px-2 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-gray-400"/>
                    历史记录
                </h3>
                
                <div className="space-y-3">
                    {/* Prediction Card - Only show if upcoming within 7 days or overdue */}
                    {prediction && daysUntilNext <= 7 && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 flex justify-between items-center animate-fade-in shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2.5 rounded-full text-purple-500 shadow-sm border border-purple-100">
                                    <CalendarClock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">下一次经期预测</h4>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        预计 <span className="font-semibold text-purple-600">{prediction.startDate}</span> 开始
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditingLog({ startDate: prediction.startDate } as PeriodLog); 
                                    setShowForm(true);
                                }}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                                确认开始
                            </button>
                        </div>
                    )}

                    {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start group relative">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-800">{log.startDate}</span>
                                    {log.endDate && <span className="text-gray-400 text-sm">→ {log.endDate}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-md ${log.flow === 'Heavy' ? 'bg-red-100 text-red-600' : 'bg-pink-50 text-pink-500'}`}>
                                        量: {log.flow === 'Light' ? '少' : log.flow === 'Medium' ? '中' : '多'}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-600">
                                        {getMoodLabel(log.mood)}
                                    </span>
                                </div>
                                {log.symptoms.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2 truncate max-w-[200px]">
                                        症状: {log.symptoms.join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm">
                                <button 
                                  onClick={() => shareLog(log)} 
                                  className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                                  title="分享记录"
                                >
                                    <Share2 size={16} />
                                </button>
                                <button onClick={() => handleEdit(log)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(log.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            暂无历史数据
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-10 bg-[#fdf2f8]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-pink-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-pink-500 p-2 rounded-lg text-white shadow-md">
                <Heart size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">燕子经期</h1>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setShowSettings(true)}
                className="bg-white border border-pink-100 text-gray-500 p-2 rounded-full hover:bg-gray-50 transition-colors"
             >
                <Settings size={24} />
             </button>
             <button 
                onClick={() => { setEditingLog(undefined); setShowForm(true); }}
                className="bg-pink-100 text-pink-600 p-2 rounded-full hover:bg-pink-200 transition-colors"
             >
                <Plus size={24} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs - Refined Style */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CalendarIcon size={16} />
            记录
          </button>
          <button 
             onClick={() => setActiveTab('trends')}
             className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'trends' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Activity size={16} />
            趋势
          </button>
          <button 
             onClick={() => setActiveTab('knowledge')}
             className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'knowledge' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BookOpen size={16} />
            科普
          </button>
        </div>

        {/* Tab Content */}
        {renderContent()}

      </main>

      {/* Modal Form */}
      {showForm && (
        <LogForm 
            onSave={handleSaveLog} 
            onCancel={() => { setShowForm(false); setEditingLog(undefined); }} 
            initialData={editingLog}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
            settings={appSettings}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
            onClearData={handleClearData}
        />
      )}
    </div>
  );
};

export default App;