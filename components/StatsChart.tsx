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
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import { Activity, Clock, CalendarCheck, TrendingUp, Info } from 'lucide-react';

interface StatsChartProps {
  logs: PeriodLog[];
}

const StatsChart: React.FC<StatsChartProps> = ({ logs }) => {
  // Process Data
  const { chartData, stats } = useMemo(() => {
    if (logs.length < 2) return { chartData: [], stats: null };

    // Sort logs ascending
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
      
      const cycleLength = Math.round(
        (new Date(current.startDate).getTime() - new Date(previous.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      let duration = 0;
      if (current.endDate) {
        duration = Math.round(
            (new Date(current.endDate).getTime() - new Date(current.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1; // inclusive
        totalDuration += duration;
        durationCount++;
      }

      totalCycle += cycleLength;
      cycleLengths.push(cycleLength);
      cycleCount++;

      data.push({
        date: current.startDate,
        cycleLength,
        duration: duration > 0 ? duration : null,
        flow: current.flow 
      });
    }

    const avgCycle = cycleCount > 0 ? Math.round(totalCycle / cycleCount) : 28;
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 5;

    // Calculate regularity (Standard Deviation)
    let regularityStatus = "计算中";
    let regularityColor = "text-gray-500";
    let variationDisplay = "";
    let regularityAdvice = "";
    
    if (cycleCount > 1) {
        const mean = totalCycle / cycleCount;
        const variance = cycleLengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / cycleCount;
        const stdDev = Math.sqrt(variance);
        
        // Show approximate variation
        variationDisplay = `±${Math.round(stdDev)}天`;

        if (stdDev < 2) {
            regularityStatus = "非常规律";
            regularityColor = "text-green-500";
            regularityAdvice = "她的周期非常稳定，这通常意味着身体很健康！继续保持良好的生活习惯。";
        } else if (stdDev < 5) {
            regularityStatus = "比较规律";
            regularityColor = "text-blue-500";
            regularityAdvice = "周期有小幅波动（一周以内）是正常的，可能受情绪或压力影响，无需过度担心。";
        } else {
            regularityStatus = "不够规律";
            regularityColor = "text-orange-500";
            regularityAdvice = "周期波动超过了一周，建议留意是否有长期熬夜、压力大或内分泌因素，必要时可咨询医生。";
        }
    }

    return { 
        chartData: data, 
        stats: { avgCycle, avgDuration, regularityStatus, regularityColor, variationDisplay, regularityAdvice } 
    };
  }, [logs]);

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-pink-100 backdrop-blur-sm bg-white/90">
          <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-medium">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-bold text-gray-800">{entry.value} 天</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!chartData.length || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-3xl border border-dashed border-pink-200 text-center">
        <div className="bg-pink-50 p-4 rounded-full mb-4">
            <TrendingUp size={32} className="text-pink-300" />
        </div>
        <h3 className="text-gray-800 font-bold mb-2">暂无趋势分析</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          我们需要至少 <span className="text-pink-500 font-bold">2 次</span> 完整的经期记录才能为您生成周期分析图表。请继续记录吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-pink-50 flex flex-col items-center justify-center text-center">
           <div className="bg-pink-100 p-1.5 rounded-full mb-2 text-pink-500">
             <Activity size={16} />
           </div>
           <span className="text-xs text-gray-400 font-medium mb-0.5">平均周期</span>
           <span className="text-lg font-extrabold text-gray-800">{stats.avgCycle}<span className="text-xs font-normal text-gray-500 ml-0.5">天</span></span>
        </div>
        
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-purple-50 flex flex-col items-center justify-center text-center">
           <div className="bg-purple-100 p-1.5 rounded-full mb-2 text-purple-500">
             <Clock size={16} />
           </div>
           <span className="text-xs text-gray-400 font-medium mb-0.5">平均经期</span>
           <span className="text-lg font-extrabold text-gray-800">{stats.avgDuration}<span className="text-xs font-normal text-gray-500 ml-0.5">天</span></span>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center">
           <div className="bg-blue-100 p-1.5 rounded-full mb-2 text-blue-500">
             <CalendarCheck size={16} />
           </div>
           <span className="text-xs text-gray-400 font-medium mb-0.5">规律性</span>
           <span className={`text-sm font-bold ${stats.regularityColor}`}>{stats.regularityStatus}</span>
           {stats.variationDisplay && <span className="text-[10px] text-gray-400 mt-0.5">波动 {stats.variationDisplay}</span>}
        </div>
      </div>

      {/* Regularity Advice Block */}
      {stats.regularityAdvice && (
        <div className={`p-3 rounded-xl border flex gap-3 items-start animate-fade-in ${
            stats.regularityStatus === "非常规律" ? "bg-green-50 border-green-100" :
            stats.regularityStatus === "比较规律" ? "bg-blue-50 border-blue-100" :
            "bg-orange-50 border-orange-100"
        }`}>
            <Info size={16} className={`mt-0.5 flex-shrink-0 ${
                 stats.regularityStatus === "非常规律" ? "text-green-500" :
                 stats.regularityStatus === "比较规律" ? "text-blue-500" :
                 "text-orange-500"
            }`} />
            <div className="text-xs text-gray-600 leading-relaxed">
                <span className="font-bold block mb-0.5 text-gray-700">规律性分析:</span>
                {stats.regularityAdvice}
            </div>
        </div>
      )}

      {/* Chart 1: Cycle Length */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                    周期长度变化
                </h3>
                <p className="text-xs text-gray-400 mt-1 pl-3">相邻两次经期开始日的间隔天数</p>
            </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCycle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10, fill: '#9ca3af'}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.substring(5)} 
                dy={10}
              />
              <YAxis 
                domain={['dataMin - 3', 'dataMax + 3']} 
                tick={{fontSize: 10, fill: '#9ca3af'}}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={stats.avgCycle} stroke="#fda4af" strokeDasharray="3 3" label={{ position: 'right', value: '平均', fontSize: 10, fill: '#fda4af' }} />
              <Area 
                type="monotone" 
                dataKey="cycleLength" 
                name="周期" 
                stroke="#ec4899" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCycle)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Period Duration */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-purple-50">
        <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    经期持续天数
                </h3>
                <p className="text-xs text-gray-400 mt-1 pl-3">每次经期实际持续的时间</p>
             </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.filter(d => d.duration)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3e8ff" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10, fill: '#9ca3af'}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.substring(5)} 
                dy={10}
              />
              <YAxis 
                tick={{fontSize: 10, fill: '#9ca3af'}}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax + 2']}
              />
              <Tooltip cursor={{fill: '#faf5ff'}} content={<CustomTooltip />} />
              <Bar 
                dataKey="duration" 
                name="天数" 
                radius={[6, 6, 6, 6]} 
                barSize={20}
              >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.duration && entry.duration > 7 ? '#f87171' : '#a855f7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-2 items-start bg-gray-50 p-3 rounded-xl">
             <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
             <p className="text-xs text-gray-500 leading-relaxed">
                正常经期通常为 3-7 天。如果柱状图出现红色，表示该次经期超过了 7 天，建议多加留意。
             </p>
        </div>
      </div>
    </div>
  );
};

export default StatsChart;