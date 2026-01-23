import React, { useMemo } from 'react';
import { PeriodLog } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { Activity, Clock, CalendarCheck, TrendingUp, Info, Share2, Sparkles } from 'lucide-react';

interface StatsChartProps {
  logs: PeriodLog[];
}

const StatsChart: React.FC<StatsChartProps> = ({ logs }) => {
  const { chartData, stats } = useMemo(() => {
    if (logs.length < 2) return { chartData: [], stats: null };
    const sortedLogs = [...logs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const data = [];
    let totalCycle = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let cycleCount = 0;
    const cycleLengths: number[] = [];

    for (let i = 1; i < sortedLogs.length; i++) {
      const current = sortedLogs[i];
      const previous = sortedLogs[i - 1];
      const cycleLength = Math.round((new Date(current.startDate).getTime() - new Date(previous.startDate).getTime()) / (86400000));
      
      let duration = 0;
      if (previous.endDate) {
        duration = Math.round((new Date(previous.endDate).getTime() - new Date(previous.startDate).getTime()) / (86400000)) + 1;
        totalDuration += duration;
        durationCount++;
      }
      
      totalCycle += cycleLength;
      cycleLengths.push(cycleLength);
      cycleCount++;
      
      data.push({ 
        date: current.startDate, 
        displayDate: new Date(current.startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        cycleLength, 
        duration: duration > 0 ? duration : null, 
        flow: current.flow 
      });
    }

    const avgCycle = cycleCount > 0 ? Math.round(totalCycle / cycleCount) : 28;
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 5;

    let regularityStatus = "计算中";
    let variationDisplay = "";
    let regularityAdvice = "";
    let statusColor = "text-rose-500";
    
    if (cycleCount > 1) {
        const mean = totalCycle / cycleCount;
        const stdDev = Math.sqrt(cycleLengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / cycleCount);
        variationDisplay = `±${Math.round(stdDev)}天`;

        if (stdDev < 2) {
            regularityStatus = "极度规律";
            statusColor = "text-emerald-500";
            regularityAdvice = "她的周期像钟表一样精准！这说明她最近生活作息非常健康，心情也很好。继续保持这种完美的宠爱节奏吧。";
        } else if (stdDev < 4) {
            regularityStatus = "正常波动";
            statusColor = "text-rose-500";
            regularityAdvice = "周期在3-4天内波动属于完全正常的生理现象。气温变化、轻微压力或睡眠波动都会引起这种微调。";
        } else {
            regularityStatus = "波动较大";
            statusColor = "text-amber-500";
            regularityAdvice = "最近她的周期波动有些明显。建议回想下她最近是否压力过大、经常熬夜或饮食不规律？多给她一些温柔的陪伴和充足的休息。";
        }
    }

    return { 
        chartData: data, 
        stats: { avgCycle, avgDuration, regularityStatus, variationDisplay, regularityAdvice, statusColor } 
    };
  }, [logs]);

  const handleShare = async () => {
    if (!stats) return;

    const shareText = `📊 燕子经期·趋势分析报告
--------------------------
📅 平均周期：${stats.avgCycle} 天
⏳ 平均经期：${stats.avgDuration} 天
✨ 规律程度：${stats.regularityStatus} (${stats.variationDisplay})

💡 专家建议：${stats.regularityAdvice}

❤️ 来自“燕子经期”的暖心关怀报告。`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '燕子经期趋势分析',
          text: shareText,
        });
      } catch (err) {
        console.debug('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('报告摘要已复制到剪贴板！');
      } catch (err) {
        alert('复制失败，请截图进行分享。');
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-[1.5rem] shadow-2xl border border-rose-50 animate-fade-in">
          <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{payload[0].payload.date}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                <span className="text-xs font-bold text-gray-600">周期长度</span>
              </div>
              <span className="text-sm font-black text-rose-600">{payload[0].value} 天</span>
            </div>
            {payload[0].payload.duration && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs font-bold text-gray-600">经期时长</span>
                </div>
                <span className="text-sm font-black text-purple-600">{payload[0].payload.duration} 天</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!chartData.length || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-white rounded-[3rem] border-2 border-dashed border-rose-50 shadow-sm animate-fade-in">
        <div className="p-5 bg-rose-50 rounded-full mb-6">
            <TrendingUp size={48} className="text-rose-300" />
        </div>
        <h3 className="text-xl font-black text-gray-800">趋势数据收集中...</h3>
        <p className="text-sm font-bold text-gray-400 mt-3 leading-relaxed max-w-[240px]">
          别急，还需要 <span className="text-rose-500">2 次</span> 以上记录，我就能为你揭示她的身体密码。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-gray-800">趋势报告</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Cycle Insights</p>
        </div>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-rose-500 shadow-sm border border-rose-100 active:scale-95 hover:bg-rose-50 transition-all group"
        >
          <Share2 size={16} className="group-hover:rotate-12 transition-transform" />
          生成周报
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Activity, label: '平均周期', value: `${stats.avgCycle}d`, color: 'bg-rose-500' },
          { icon: Clock, label: '平均经期', value: `${stats.avgDuration}d`, color: 'bg-purple-500' },
          { icon: CalendarCheck, label: '规律性', value: stats.regularityStatus, sub: stats.variationDisplay, color: 'bg-indigo-500' }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center justify-center rounded-[2.5rem] bg-white p-5 shadow-sm border border-gray-50 text-center hover:shadow-md transition-shadow">
            <div className={`mb-3 rounded-2xl ${item.color} p-2.5 text-white shadow-lg shadow-${item.color.split('-')[1]}-100`}><item.icon size={18} /></div>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter mb-1">{item.label}</span>
            <span className={`text-sm font-black text-gray-800`}>{item.value}</span>
            {item.sub && <span className="text-[9px] font-bold text-gray-400 mt-0.5">{item.sub}</span>}
          </div>
        ))}
      </div>

      <div className="rounded-[3rem] bg-white p-6 shadow-sm border border-gray-50 overflow-hidden relative">
        <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
            <Sparkles size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">AI 分析中</span>
        </div>

        <h3 className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
            <span className="h-1 w-6 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
            周期稳定性分布
        </h3>

        <div className="h-64 w-full -ml-4">
          <ResponsiveContainer width="105%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCycle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.03}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
              
              {/* Reference Area for normal cycle (25-35 days) */}
              <ReferenceArea y1={25} y2={35} fill="url(#colorNormal)" />
              
              <XAxis 
                dataKey="displayDate" 
                tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']} 
                tick={{fontSize: 9, fontWeight: 700, fill: '#cbd5e1'}} 
                axisLine={false} 
                tickLine={false}
                dx={-10}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              <ReferenceLine y={28} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'right', value: '28d', fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              
              <Area 
                type="monotone" 
                dataKey="cycleLength" 
                stroke="#f43f5e" 
                strokeWidth={4} 
                fill="url(#colorCycle)" 
                activeDot={{ r: 8, fill: '#f43f5e', stroke: '#fff', strokeWidth: 3, shadow: '0 0 10px rgba(0,0,0,0.1)' }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
             <div className="rounded-[2rem] bg-rose-50/50 p-5 border border-rose-50 flex flex-col gap-2">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-rose-100 rounded-lg text-rose-500"><Info size={14} /></div>
                    <span className="text-[11px] font-black text-rose-700 uppercase tracking-widest">关怀贴士</span>
                 </div>
                 <p className="text-[11px] leading-relaxed text-rose-600/80 font-bold">{stats.regularityAdvice}</p>
             </div>
             
             <div className="rounded-[2rem] bg-indigo-50/50 p-5 border border-indigo-50 flex flex-col gap-2">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-500"><TrendingUp size={14} /></div>
                    <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">规律详情</span>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className={`text-lg font-black ${stats.statusColor}`}>{stats.regularityStatus}</span>
                    <span className="text-[10px] font-bold text-indigo-400">{stats.variationDisplay}</span>
                 </div>
                 <p className="text-[9px] text-indigo-300 font-bold">基于最近 {chartData.length + 1} 次记录</p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default StatsChart;