import React, { useState, useEffect } from 'react';
import { PeriodLog, CustomSymptom } from '../types';
import { getCustomSymptoms, addCustomSymptom, deleteCustomSymptom } from '../services/storage';
import { Plus, X, Save, Zap, Activity, Brain, CircleDot, Thermometer, Moon, Utensils, BatteryLow, Calendar, Trash2, Check } from 'lucide-react';

interface LogFormProps {
  onSave: (log: PeriodLog) => void;
  onCancel: () => void;
  initialData?: PeriodLog;
}

// Custom SVG Icon for "Needs Hugs"
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
  const [mood, setMood] = useState<string>(initialData?.mood || 'Calm');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // Handling symptoms
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set(initialData?.symptoms || []));
  const [customSymptomsList, setCustomSymptomsList] = useState<CustomSymptom[]>([]);
  
  // Add Custom Symptom UI State
  const [isAddingSymptom, setIsAddingSymptom] = useState(false);
  const [newSymName, setNewSymName] = useState('');
  const [newSymEmoji, setNewSymEmoji] = useState('✨');

  useEffect(() => {
    setCustomSymptomsList(getCustomSymptoms());
  }, []);

  const defaultSymptoms = ['痛经', '腰酸', '头痛', '长痘', '乳房胀痛', '失眠', '食欲大增', '疲劳'];
  
  // Initial config for default icons
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

  // Helper for consistent emoji styling
  const EmojiIcon = ({ symbol }: { symbol: string }) => (
    <span className="text-2xl mb-1.5 filter drop-shadow-sm">{symbol}</span>
  );

  const moodOptions = [
    { value: 'Happy', label: '开心', icon: <EmojiIcon symbol="😊" />, className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
    { value: 'Calm', label: '平静', icon: <EmojiIcon symbol="🍃" />, className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
    { value: 'Energetic', label: '活力', icon: <EmojiIcon symbol="✨" />, className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
    { value: 'Tired', label: '疲惫', icon: <EmojiIcon symbol="😴" />, className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
    { value: 'Down', label: '低落', icon: <EmojiIcon symbol="🌧️" />, className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
    { value: 'Teary', label: '想哭', icon: <EmojiIcon symbol="😢" />, className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { value: 'Irritated', label: '烦躁', icon: <EmojiIcon symbol="😤" />, className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
    { value: 'Craving', label: '嘴馋', icon: <EmojiIcon symbol="🍰" />, className: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' },
    { value: 'In Pain', label: '痛痛', icon: <EmojiIcon symbol="😣" />, className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' },
    { value: 'Needs Hugs', label: '求抱抱', icon: <HugIcon className="w-8 h-8 mb-1" />, className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
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
    
    // Auto select the new symptom
    const newSymptoms = new Set(symptoms);
    newSymptoms.add(newSymptom.name);
    setSymptoms(newSymptoms);

    // Reset UI
    setNewSymName('');
    setNewSymEmoji('✨');
    setIsAddingSymptom(false);
  };

  const handleDeleteCustomSymptom = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除自定义症状 "${name}" 吗？`)) {
        const updatedList = deleteCustomSymptom(name);
        setCustomSymptomsList(updatedList);
        
        // Remove from selected if present
        const newSymptoms = new Set(symptoms);
        if (newSymptoms.has(name)) {
            newSymptoms.delete(name);
            setSymptoms(newSymptoms);
        }
    }
  };

  const getSymptomDisplay = (name: string) => {
    // Check if it's a default symptom
    if (defaultSymptomConfig[name]) {
        return defaultSymptomConfig[name];
    }
    // Check if it's a custom symptom
    const custom = customSymptomsList.find(c => c.name === name);
    if (custom) {
        return { icon: <span className="text-[14px] leading-none">{custom.emoji}</span>, color: 'text-gray-700' };
    }
    // Fallback
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

  // Merge lists for display
  const allAvailableSymptoms = [...defaultSymptoms, ...customSymptomsList.map(c => c.name)];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-pink-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {initialData?.id ? '编辑记录' : '记录新周期'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-pink-100 rounded-full text-gray-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          {/* Enhanced Dates Section */}
          <div className="bg-gray-50/60 p-5 rounded-2xl border border-pink-50/80 shadow-sm">
            <div className="grid grid-cols-2 gap-5">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                    开始日期 <span className="text-pink-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-pink-500 group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm font-bold focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-pink-50/10 outline-none transition-all shadow-sm hover:border-pink-300 hover:shadow-md cursor-pointer"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pr-1">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">结束日期</label>
                   {endDate && (
                       <button type="button" onClick={() => setEndDate('')} className="text-[10px] text-gray-400 hover:text-red-500 font-medium transition-colors bg-white px-2 py-0.5 rounded-md shadow-sm border border-gray-100 hover:border-red-200">
                           清除
                       </button>
                   )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar size={18} className={`transition-transform duration-200 group-hover:scale-110 ${endDate ? 'text-pink-500' : 'text-gray-300'}`} />
                  </div>
                  <input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`block w-full pl-11 pr-3 py-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all shadow-sm cursor-pointer ${
                      endDate 
                        ? 'bg-white border border-gray-200 text-gray-800 hover:border-pink-300 hover:shadow-md' 
                        : 'bg-white/50 border border-dashed border-gray-300 text-gray-400 hover:bg-white hover:border-pink-300 hover:text-gray-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Flow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">流量强度</label>
            <div className="flex gap-2">
              {['Light', 'Medium', 'Heavy'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFlow(f as any)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    flow === f 
                      ? 'bg-pink-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'Light' ? '少量' : f === 'Medium' ? '中等' : '大量'}
                </button>
              ))}
            </div>
          </div>

          {/* Mood - Visual Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">心情状态</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
                    mood === option.value
                      ? `${option.className.split(' ')[0]} ${option.className.split(' ')[1]} ring-2 ring-offset-1 ring-pink-200 shadow-md transform scale-105 border-transparent`
                      : `bg-white border-gray-100 text-gray-500 hover:bg-gray-50`
                  } ${mood === option.value ? '' : 'hover:scale-[1.02]'}`}
                >
                  {/* Icon Render */}
                  {option.icon}
                  <span className="text-xs font-bold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms - Updated with Add Custom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">身体感受</label>
            
            {/* Selected Tags */}
            <div className="min-h-[40px] p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3 flex flex-wrap gap-2 transition-all">
              {symptoms.size === 0 && (
                <span className="text-xs text-gray-400 self-center">点击下方标签添加症状...</span>
              )}
              {Array.from(symptoms).map((s) => {
                const config = getSymptomDisplay(s);
                return (
                    <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200 hover:bg-purple-200 hover:border-purple-300 transition-all group shadow-sm"
                    >
                    <span className={config.color}>{config.icon}</span>
                    {s}
                    <div className="bg-purple-200 rounded-full p-0.5 group-hover:bg-purple-300">
                        <X size={10} />
                    </div>
                    </button>
                );
              })}
            </div>

            {/* Available Options */}
            <div className="flex flex-wrap gap-2 mb-3">
              {allAvailableSymptoms.filter(s => !symptoms.has(s)).map((s) => {
                 const config = getSymptomDisplay(s);
                 const isCustom = customSymptomsList.some(c => c.name === s);
                 return (
                    <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-white hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-all group relative pr-3"
                    >
                    <span className={config.color}>
                        {config.icon}
                    </span>
                    {s}
                    {isCustom && (
                        <div 
                            onClick={(e) => handleDeleteCustomSymptom(e, s)}
                            className="ml-1 text-gray-300 hover:text-red-400 p-0.5 rounded-full hover:bg-red-50"
                        >
                            <Trash2 size={10} />
                        </div>
                    )}
                    </button>
                 );
              })}
              
              <button
                type="button"
                onClick={() => setIsAddingSymptom(!isAddingSymptom)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all ${isAddingSymptom ? 'border-pink-400 text-pink-500 bg-pink-50' : 'border-gray-300 text-gray-400 hover:border-pink-300 hover:text-pink-500'}`}
              >
                <Plus size={12} />
                自定义
              </button>
            </div>

            {/* Add Custom Symptom Area */}
            {isAddingSymptom && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 animate-fade-in mt-2">
                    <div className="flex gap-2 mb-3">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-2 flex items-center text-lg pointer-events-none">{newSymEmoji}</span>
                            <input 
                                type="text"
                                value={newSymName}
                                onChange={(e) => setNewSymName(e.target.value)}
                                placeholder="输入症状名称..."
                                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-pink-300 outline-none"
                                maxLength={8}
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={handleAddCustomSymptom}
                            disabled={!newSymName.trim()}
                            className="bg-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600"
                        >
                            添加
                        </button>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">选择图标</p>
                        <div className="flex flex-wrap gap-2">
                            {emojiOptions.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setNewSymEmoji(emoji)}
                                    className={`text-xl p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${newSymEmoji === emoji ? 'bg-white shadow-sm ring-1 ring-pink-300' : ''}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="有什么特别想记录的吗..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            保存记录
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogForm;