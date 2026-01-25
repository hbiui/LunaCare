
import React, { useState } from 'react';
import { X, Bell, CalendarHeart, Trash2, Bot, Heart, Stethoscope, Laugh, Key, ChevronRight, Cpu, Globe, CheckCircle2, AlertCircle, Loader2, Layers } from 'lucide-react';
import { AppSettings, AiPersona, AiProvider } from '../types';
import { testAiConnection } from '../services/gemini';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onClearData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose, onClearData }) => {
  const [enabled, setEnabled] = useState(settings.notificationsEnabled);
  const [persona, setPersona] = useState<AiPersona>(settings.aiPersona || 'guardian');
  const [provider, setProvider] = useState<AiProvider>(settings.aiProvider || 'gemini');
  const [apiKey, setApiKey] = useState(settings.customApiKey || '');
  const [apiBase, setApiBase] = useState(settings.customApiBase || '');
  const [modelName, setModelName] = useState(settings.customModelName || '');
  const [showAiConfig, setShowAiConfig] = useState(false);
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSave = () => {
    onSave({
      ...settings,
      notificationsEnabled: enabled,
      aiPersona: persona,
      aiProvider: provider,
      customApiKey: apiKey.trim() || undefined,
      customApiBase: apiBase.trim() || undefined,
      customModelName: modelName.trim() || undefined
    });
    onClose();
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
        setTestStatus('error');
        setTestMessage('请先输入 API Key');
        return;
    }
    
    setTestStatus('testing');
    setTestMessage('正在测试连接...');
    
    const result = await testAiConnection(provider, apiKey.trim(), apiBase.trim(), modelName.trim());
    
    if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message);
    } else {
        setTestStatus('error');
        setTestMessage(result.message);
    }
    
    setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
    }, 5000);
  };

  const aiOptions: { id: AiPersona; name: string; icon: any; desc: string; color: string }[] = [
    { id: 'guardian', name: '温情守护', icon: Heart, desc: '极致体贴，主打情感支持', color: 'text-rose-500 bg-rose-50' },
    { id: 'expert', name: '医疗专家', icon: Stethoscope, desc: '科学严谨，侧重医学建议', color: 'text-blue-500 bg-blue-50' },
    { id: 'wit', name: '幽默伴侣', icon: Laugh, desc: '风趣幽默，缓解经期焦虑', color: 'text-orange-500 bg-orange-50' },
  ];

  const providerNames: Record<AiProvider, string> = {
    gemini: 'Gemini',
    deepseek: 'DeepSeek',
    zhipu: '智谱 GLM',
    custom: '自定义'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col border border-rose-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">实验室设置</h2>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">AI Engine & Connectivity</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-10 overflow-y-auto scrollbar-hide">
          <div className="space-y-5">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Bot size={18} className="text-rose-500" />
              AI 智能体人格
            </h3>
            <div className="grid gap-3">
              {aiOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPersona(opt.id)}
                  className={`flex items-center gap-4 p-4 rounded-[1.8rem] border-2 transition-all text-left ${
                    persona === opt.id ? 'border-rose-500 bg-rose-50/50 shadow-md' : 'border-gray-50 bg-white hover:border-rose-100'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${opt.color}`}><opt.icon size={22} /></div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-800">{opt.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <button onClick={() => setShowAiConfig(!showAiConfig)} className="flex items-center justify-between w-full text-left">
                <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                    <Cpu size={18} className="text-gray-400" />
                    AI 接口与服务商
                </h3>
                <ChevronRight size={16} className={`text-gray-300 transition-transform ${showAiConfig ? 'rotate-90' : ''}`} />
            </button>
            
            {showAiConfig && (
                <div className="space-y-6 animate-fade-in pl-1">
                    <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-2xl">
                        {(['gemini', 'deepseek', 'zhipu', 'custom'] as AiProvider[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => { setProvider(p); setTestStatus('idle'); setTestMessage(''); }}
                                className={`flex-1 min-w-[60px] py-2 text-[10px] font-black rounded-xl transition-all ${provider === p ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'}`}
                            >
                                {providerNames[p]}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-2"><Key size={12}/> API KEY</label>
                            <input 
                                type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                                placeholder={`输入 ${providerNames[provider]} 密钥...`}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-200"
                            />
                        </div>

                        {(provider !== 'gemini') && (
                            <div className="space-y-4 animate-slide-up">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-2"><Globe size={12}/> API BASE URL</label>
                                    <input 
                                        type="text" value={apiBase} onChange={(e) => setApiBase(e.target.value)}
                                        placeholder={provider === 'zhipu' ? "https://open.bigmodel.cn/api/paas/v4" : provider === 'deepseek' ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-2"><Layers size={12}/> MODEL NAME</label>
                                    <input 
                                        type="text" value={modelName} onChange={(e) => setModelName(e.target.value)}
                                        placeholder={provider === 'zhipu' ? "glm-4-flash" : provider === 'deepseek' ? "deepseek-chat" : "gpt-3.5-turbo"}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-200"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="button" onClick={handleTestConnection} disabled={testStatus === 'testing'}
                                className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                    testStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    testStatus === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {testStatus === 'testing' ? <Loader2 size={16} className="animate-spin" /> : 
                                 testStatus === 'success' ? <CheckCircle2 size={16} /> : 
                                 testStatus === 'error' ? <AlertCircle size={16} /> : null}
                                {testStatus === 'idle' ? '测试 API 连接' : testMessage}
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><Bell size={18} className="text-rose-500" /> 基础提醒设置</h3>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">开启经期预测提醒</span>
                <button onClick={() => setEnabled(!enabled)} className={`w-14 h-7 rounded-full transition-all relative ${enabled ? 'bg-rose-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${enabled ? 'translate-x-7' : ''}`} />
                </button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <button onClick={onClearData} className="w-full py-4 border-2 border-dashed border-red-100 text-red-400 bg-red-50/30 rounded-[1.8rem] font-black text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-2">
               <Trash2 size={16} /> 清除本地所有数据
             </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex-shrink-0">
          <button onClick={handleSave} className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-[2rem] font-black text-md shadow-xl shadow-rose-200 active:scale-[0.98] transition-all">
            保存配置并退出
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
