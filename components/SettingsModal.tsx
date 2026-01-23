
import React, { useState } from 'react';
// Added ChevronRight to the lucide-react imports
import { X, Bell, CalendarHeart, Trash2, Bot, Heart, Stethoscope, Laugh, Key, ChevronRight } from 'lucide-react';
import { AppSettings, AiPersona } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onClearData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  const [enabled, setEnabled] = useState(settings.notificationsEnabled);
  const [offset, setOffset] = useState<0 | 1>(settings.reminderOffset);
  const [persona, setPersona] = useState<AiPersona>(settings.aiPersona || 'guardian');
  const [apiKey, setApiKey] = useState(settings.customApiKey || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSave = () => {
    onSave({
      ...settings,
      notificationsEnabled: enabled,
      reminderOffset: offset,
      aiPersona: persona,
      customApiKey: apiKey.trim() || undefined
    });
    onClose();
  };

  const aiOptions: { id: AiPersona; name: string; icon: any; desc: string; color: string }[] = [
    { id: 'guardian', name: '温情守护', icon: Heart, desc: '极致体贴，主打情感支持', color: 'text-rose-500 bg-rose-50' },
    { id: 'expert', name: '医疗专家', icon: Stethoscope, desc: '科学严谨，侧重医学建议', color: 'text-blue-500 bg-blue-50' },
    { id: 'wit', name: '幽默伴侣', icon: Laugh, desc: '风趣幽默，缓解经期焦虑', color: 'text-orange-500 bg-orange-50' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col border border-rose-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">实验室设置</h2>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">Custom AI & Labs</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-10 overflow-y-auto scrollbar-hide">
          
          {/* AI Persona Selection */}
          <div className="space-y-5">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Bot size={18} className="text-rose-500" />
              AI 智能体选择
            </h3>
            <div className="grid gap-3">
              {aiOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPersona(opt.id)}
                  className={`flex items-center gap-4 p-4 rounded-[1.8rem] border-2 transition-all text-left ${
                    persona === opt.id 
                      ? 'border-rose-500 bg-rose-50/50 shadow-md' 
                      : 'border-gray-50 bg-white hover:border-rose-100'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${opt.color}`}>
                    <opt.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-800">{opt.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Config */}
          <div className="space-y-4">
            <button 
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center justify-between w-full text-left"
            >
                <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                    <Key size={18} className="text-gray-400" />
                    自定义 API 接口
                </h3>
                <ChevronRight size={16} className={`text-gray-300 transition-transform ${showKeyInput ? 'rotate-90' : ''}`} />
            </button>
            
            {showKeyInput && (
                <div className="space-y-3 animate-fade-in">
                    <p className="text-[10px] text-gray-400 font-bold">填入你的 Gemini API Key 以获得更强大的云端推理能力。不填则使用公共接口。</p>
                    <input 
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="在此填入 API Key..."
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-100 outline-none"
                    />
                </div>
            )}
          </div>

          {/* Reminder Settings (Original) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Bell size={18} className="text-rose-500" />
              基础提醒设置
            </h3>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">开启经期预测提醒</span>
                <button 
                  onClick={() => setEnabled(!enabled)}
                  className={`w-14 h-7 rounded-full transition-all relative ${enabled ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${enabled ? 'translate-x-7' : ''}`} />
                </button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <button 
               onClick={onClearData}
               className="w-full py-4 border-2 border-dashed border-red-100 text-red-400 bg-red-50/30 rounded-[1.8rem] font-black text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-2"
             >
               <Trash2 size={16} />
               清除本地所有数据
             </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex-shrink-0">
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-[2rem] font-black text-md shadow-xl shadow-rose-200 active:scale-[0.98] transition-all"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
