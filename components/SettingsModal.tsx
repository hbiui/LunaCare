import React, { useState } from 'react';
import { X, Bell, CalendarHeart, Trash2 } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onClearData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  const [enabled, setEnabled] = useState(settings.notificationsEnabled);
  const [offset, setOffset] = useState<0 | 1>(settings.reminderOffset);
  
  // New states for post-period reminder
  const [postEnabled, setPostEnabled] = useState(settings.postPeriodReminder || false);
  const [postDays, setPostDays] = useState<number>(settings.postPeriodDays || 3);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("您的浏览器不支持通知功能");
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    } else if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } else {
      alert('请在浏览器设置中允许通知权限以开启此功能');
      return false;
    }
  };

  const handleToggleMain = async () => {
    if (!enabled) {
      const granted = await requestPermission();
      if (granted) setEnabled(true);
    } else {
      setEnabled(false);
    }
  };

  const handleTogglePost = async () => {
    if (!postEnabled) {
      const granted = await requestPermission();
      if (granted) setPostEnabled(true);
    } else {
      setPostEnabled(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...settings,
      notificationsEnabled: enabled,
      reminderOffset: offset,
      postPeriodReminder: postEnabled,
      postPeriodDays: postDays
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-pink-50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">应用设置</h2>
          <button onClick={onClose} className="p-2 hover:bg-pink-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* Main Period Reminder */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Bell size={18} className="text-pink-500" />
              经期预测提醒
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">开启预测提醒</span>
              <button 
                onClick={handleToggleMain}
                className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-pink-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {enabled && (
              <div className="bg-pink-50 rounded-xl p-4 space-y-3 animate-fade-in border border-pink-100">
                <p className="text-xs text-gray-500 font-medium mb-1">提醒时间</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${offset === 1 ? 'border-pink-500' : 'border-gray-400'}`}>
                      {offset === 1 && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
                    </div>
                    <input type="radio" name="offset" checked={offset === 1} onChange={() => setOffset(1)} className="hidden" />
                    <span className="text-sm text-gray-700">经期开始前 1 天</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${offset === 0 ? 'border-pink-500' : 'border-gray-400'}`}>
                      {offset === 0 && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
                    </div>
                    <input type="radio" name="offset" checked={offset === 0} onChange={() => setOffset(0)} className="hidden" />
                    <span className="text-sm text-gray-700">经期开始当天</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Post Period Reminder */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <CalendarHeart size={18} className="text-purple-500" />
              经后关怀提醒
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">开启结束提醒</span>
              <button 
                onClick={handleTogglePost}
                className={`w-12 h-6 rounded-full transition-colors relative ${postEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${postEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {postEnabled && (
              <div className="bg-purple-50 rounded-xl p-4 animate-fade-in border border-purple-100">
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">经期结束后几天提醒？</span>
                    <select 
                      value={postDays}
                      onChange={(e) => setPostDays(Number(e.target.value))}
                      className="bg-white border border-purple-200 text-purple-700 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-1.5 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 7].map(day => (
                        <option key={day} value={day}>{day} 天</option>
                      ))}
                    </select>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">
                    适合提醒带她去吃好吃的，或者开始安排出游计划。
                 </p>
              </div>
            )}
          </div>

          {/* Danger Zone - Clear Data */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
             <h3 className="font-semibold text-red-500 flex items-center gap-2">
               <Trash2 size={18} />
               数据管理
             </h3>
             <button 
               onClick={onClearData}
               className="w-full py-3 border border-red-100 text-red-500 bg-red-50 rounded-xl font-medium hover:bg-red-100 transition-colors text-sm"
             >
               清除所有数据（不可恢复）
             </button>
          </div>

        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;