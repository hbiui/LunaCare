
import React, { useState, useEffect } from 'react';
import { PeriodLog, CustomSymptom } from '../types';
import { getCustomSymptoms, addCustomSymptom, deleteCustomSymptom } from '../services/storage';
import { Plus, X, Save, Zap, Activity, Brain, CircleDot, Thermometer, Moon, Utensils, BatteryLow, Calendar, Trash2, Check } from 'lucide-react';

interface LogFormProps {
  onSave: (log: PeriodLog) => void;
  onCancel: () => void;
  initialData?: PeriodLog;
}

const HugIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LogForm: React.FC<LogFormProps> = ({ onSave, onCancel, initialData }) => {
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [flow, setFlow] = useState<PeriodLog['flow']>(initialData?.flow || 'Medium');
  const [mood, setMood] = useState<string>(initialData?.mood || 'Happy');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set(initialData?.symptoms || []));
  const [customSymptomsList, setCustomSymptomsList] = useState<CustomSymptom[]>([]);
  
  const [isAddingSymptom, setIsAddingSymptom] = useState(false);
  const [newSymName, setNewSymName] = useState('');
  const [newSymEmoji, setNewSymEmoji] = useState('✨');

  useEffect(() => {
    setCustomSymptomsList(getCustomSymptoms());
  }, []);

  const defaultSymptoms = ['痛经', '腰酸', '头痛', '长痘', '乳房胀痛', '失眠', '食欲大增', '疲劳'];
  
  const defaultSymptomConfig: Record<string, { icon: React.ReactNode, color: string }> = {
    '痛经': { icon: <Zap size={14} />, color: 'text-red-500' },
    '腰酸': { icon: <Activity size={14} />, color: 'text-orange-500' },
    '头痛': { icon: <Brain size={14} />, color: 'text-purple-500' },
    '长痘': { icon: <CircleDot size={14} />, color: 'text-rose-400' },
    '乳房胀痛': { icon: <Thermometer size={14} />, color: 'text-pink-400' },
    '失眠': { icon: <Moon size={14} />, color: 'text-indigo-400' },
    '食欲大增': { icon: <Utensils size={14} />, color: 'text-green-500' },
    '疲劳': { icon: <BatteryLow size={14} />, color: 'text-gray-400' },
  };

  const emojiOptions = ["🤕", "🤢", "🥴", "🥶", "🥵", "🤧", "💩", "💤", "🧘‍♀️", "🍫", "🎮", "🛀", "🍦", "🍷", "😡", "😭", "🧘", "🙅‍♀️"];

  const EmojiIcon = ({ symbol }: { symbol: string }) => (
    <span className="text-3xl mb-1 filter drop-shadow-sm group-active:scale-125 transition-transform duration-200">{symbol}</span>
  );

  const moodOptions = [
    { value: 'Happy', label: '开心', icon: <EmojiIcon symbol="😊" />, colorClass: 'peer-checked:bg-yellow-50 peer-checked:border-yellow-200 peer-checked:text-yellow-700' },
    { value: 'Sensitive', label: '敏感', icon: <EmojiIcon symbol="🥺" />, colorClass: 'peer-checked:bg-purple-50 peer-checked:border-purple-200 peer-checked:text-purple-700' },
    { value: 'Irritable', label: '烦躁', icon: <EmojiIcon symbol="😤" />, colorClass: 'peer-checked:bg-red-50 peer-checked:border-red-200 peer-checked:text-red-700' },
    { value: 'Tired', label: '疲惫', icon: <EmojiIcon symbol="😴" />, colorClass: 'peer-checked:bg-slate-100 peer-checked:border-slate-300 peer-checked:text-slate-700' },
    { value: 'Energetic', label: '活力', icon: <EmojiIcon symbol="✨" />, colorClass: 'peer-checked:bg-orange-50 peer-checked:border-orange-200 peer-checked:text-orange-700' },
    { value: 'Down', label: '低落', icon: <EmojiIcon symbol="🌧️" />, colorClass: 'peer-checked:bg-indigo-50 peer-checked:border-indigo-200 peer-checked:text-indigo-700' },
    { value: 'Teary', label: '想哭', icon: <EmojiIcon symbol="😢" />, colorClass: 'peer-checked:bg-blue-50 peer-checked:border-blue-200 peer-checked:text-blue-700' },
    { value: 'Craving', label: '嘴馋', icon: <EmojiIcon symbol="🍰" />, colorClass: 'peer-checked:bg-pink-50 peer-checked:border-pink-200 peer-checked:text-pink-700' },
    { value: 'In Pain', label: '痛痛', icon: <EmojiIcon symbol="😣" />, colorClass: 'peer-checked:bg-rose-50 peer-checked:border-rose-200 peer-checked:text-rose-700' },
    { value: 'Needs Hugs', label: '抱抱', icon: <HugIcon className="w-8 h-8 mb-1" />, colorClass: 'peer-checked:bg-rose-100 peer-checked:border-rose-300 peer-checked:text-rose-800' },
  ];

  const toggleSymptom = (symptom: string) => {
    const newSymptoms = new Set(symptoms);
    if (newSymptoms.has(symptom)) {
      newSymptoms.delete(symptom);
    } else {
      newSymptoms.add(symptom);
    }
    setSymptoms(newSymptoms);
  };

  const handleAddCustomSymptom = () => {
    if (!newSymName.trim()) return;
    const newSymptom: CustomSymptom = { name: newSymName.trim(), emoji: newSymEmoji };
    const updatedList = addCustomSymptom(newSymptom);
    setCustomSymptomsList(updatedList);
    
    const newSymptoms = new Set(symptoms);
    newSymptoms.add(newSymptom.name);
    setSymptoms(newSymptoms);

    setNewSymName('');
    setNewSymEmoji('✨');
    setIsAddingSymptom(false);
  };

  const handleDeleteCustomSymptom = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除自定义症状 "${name}" 吗？`)) {
        const updatedList = deleteCustomSymptom(name);
        setCustomSymptomsList(updatedList);
        
        const newSymptoms = new Set(symptoms);
        if (newSymptoms.has(name)) {
            newSymptoms.delete(name);
            setSymptoms(newSymptoms);
        }
    }
  };

  const getSymptomDisplay = (name: string) => {
    if (defaultSymptomConfig[name]) {
        return defaultSymptomConfig[name];
    }
    const custom = customSymptomsList.find(c => c.name === name);
    if (custom) {
        return { icon: <span className="text-[14px] leading-none">{custom.emoji}</span>, color: 'text-gray-700' };
    }
    return { icon: <Plus size={12} />, color: 'text-gray-400' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      startDate,
      endDate: endDate || undefined,
      flow,
      mood,
      notes,
      symptoms: Array.from(symptoms)
    });
  };

  const allAvailableSymptoms: string[] = [...defaultSymptoms, ...customSymptomsList.map(c => c.name)];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-md transition-all duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up border border-pink-100/30 flex flex-col max-h-[92vh]">
        {/* Handle for drawer */}
        <div className="sm:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2"></div>

        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-pink-50/30 to-white">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-rose-500 rounded-[1.2rem] text-white shadow-lg shadow-rose-100 animate-pop">
                <Calendar size={22} />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">
                  {initialData?.id ? '修改经期记录' : '记录新经期'}
                </h2>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Physical Status Log</p>
             </div>
          </div>
          <button onClick={onCancel} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all active:scale-90">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10 overflow-y-auto scrollbar-hide scroll-container pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {/* Date Picker Optimization */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2.5 group">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">
                开始日期 <span className="text-rose-500">*</span>
              </label>
              <div className="relative group/input active:scale-[0.99] transition-transform">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                  <Calendar size={18} className="text-gray-400 group-focus-within/input:text-rose-500 group-focus-within/input:scale-110 transition-all" />
                </div>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-rose-50/30 border border-rose-100/50 rounded-[1.8rem] text-[16px] font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-rose-200/40 focus:border-rose-300 outline-none transition-all shadow-sm appearance-none leading-relaxed"
                  style={{ minHeight: '3.75rem' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 group">
              <div className="flex items-center justify-between pl-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">结束日期</label>
                {endDate && (
                  <button 
                    type="button" 
                    onClick={() => setEndDate('')}
                    className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full active:scale-90 transition-all"
                  >
                    重置
                  </button>
                )}
              </div>
              <div className="relative group/input active:scale-[0.99] transition-transform">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                  <Calendar size={18} className={`${endDate ? 'text-rose-500' : 'text-gray-300'} group-focus-within/input:text-rose-500 group-focus-within/input:scale-110 transition-all`} />
                </div>
                <input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-[1.8rem] text-[16px] font-bold outline-none transition-all shadow-sm appearance-none leading-relaxed focus:ring-4 focus:ring-rose-200/40 focus:border-rose-300 ${
                    endDate 
                      ? 'bg-rose-50/30 border border-rose-100/50 text-gray-800 focus:bg-white' 
                      : 'bg-white border-2 border-dashed border-rose-50 text-gray-300 placeholder-gray-200'
                  }`}
                  style={{ minHeight: '3.75rem' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">流量强度</label>
            <div className="flex gap-3 bg-gray-50 p-2 rounded-[2.2rem] border border-gray-100 shadow-inner">
              {['Light', 'Medium', 'Heavy'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFlow(f as any)}
                  className={`flex-1 py-4 rounded-[1.8rem] text-sm font-black transition-all ${
                    flow === f 
                      ? 'bg-white text-rose-600 shadow-lg ring-1 ring-rose-100 animate-pop' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f === 'Light' ? '少量' : f === 'Medium' ? '中等' : '大量'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">她的心情</label>
            <div className="grid grid-cols-5 gap-3">
              {moodOptions.map((option) => (
                <label
                  key={option.value}
                  className="group cursor-pointer active:scale-90 transition-transform"
                >
                  <input
                    type="radio"
                    name="mood"
                    value={option.value}
                    checked={mood === option.value}
                    onChange={() => setMood(option.value)}
                    className="peer hidden"
                  />
                  <div className={`flex flex-col items-center justify-center py-4 px-1 rounded-[1.8rem] transition-all border border-gray-50 bg-white hover:bg-gray-50 peer-checked:shadow-xl peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-pink-100 ${option.colorClass}`}>
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-black tracking-tighter mt-2">{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">身体不适感</label>
            
            <div className="flex flex-wrap gap-3">
              {allAvailableSymptoms.map((s: string) => {
                const config = getSymptomDisplay(s);
                const isSelected = symptoms.has(s);
                const isCustom = customSymptomsList.some(c => c.name === s);
                
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-[1.4rem] text-[12px] font-black transition-all border ${
                      isSelected 
                        ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-200 animate-pop' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-pink-200 active:bg-gray-50'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : config.color}>{config.icon}</span>
                    {s}
                    {isCustom && !isSelected && (
                      <span 
                        onClick={(e) => handleDeleteCustomSymptom(e, s)}
                        className="ml-1 p-1 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setIsAddingSymptom(!isAddingSymptom)}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-[1.4rem] text-[12px] font-black border-2 border-dashed border-gray-200 text-gray-400 hover:border-pink-300 hover:text-pink-500 active:bg-gray-50 transition-all"
              >
                <Plus size={16} />
                添加其它
              </button>
            </div>

            {isAddingSymptom && (
              <div className="bg-rose-50/30 p-6 rounded-[2.2rem] space-y-5 animate-fade-in border border-rose-100/50">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-2xl">{newSymEmoji}</span>
                    <input 
                      type="text"
                      value={newSymName}
                      onChange={(e) => setNewSymName(e.target.value)}
                      placeholder="自定义症状名称..."
                      className="w-full pl-12 pr-5 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-pink-100"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddCustomSymptom}
                    disabled={!newSymName.trim()}
                    className="px-8 bg-rose-500 text-white rounded-[1.5rem] text-sm font-black shadow-lg shadow-rose-100 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    确定
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {emojiOptions.slice(0, 10).map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewSymEmoji(emoji)}
                      className={`text-2xl p-3 rounded-[1.2rem] transition-all active:scale-125 ${newSymEmoji === emoji ? 'bg-white shadow-xl scale-110 ring-2 ring-pink-100' : 'hover:bg-white/50'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">宠爱笔记</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="记录她的小确幸、不适点或你的特别关怀..."
              className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[2.2rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-pink-100 outline-none resize-none placeholder:text-gray-300 shadow-inner"
            />
          </div>

          <button
            type="submit"
            className="w-full py-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-[2.2rem] font-black text-lg shadow-2xl shadow-rose-200/80 hover:shadow-rose-300 active:scale-[0.97] transition-all flex items-center justify-center gap-4 mt-6"
          >
            <Save size={26} strokeWidth={2.5} />
            保存记录
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogForm;
