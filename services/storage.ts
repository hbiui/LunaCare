
import { PeriodLog, AppSettings, CustomSymptom, CyclePhase } from '../types';

const STORAGE_KEY = 'lunacare_logs';
const SETTINGS_KEY = 'lunacare_settings';
const CUSTOM_SYMPTOMS_KEY = 'lunacare_custom_symptoms';
const TIP_CACHE_KEY = 'lunacare_tip_cache';
const QUERY_CACHE_KEY = 'lunacare_query_cache';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 字符串规范化，用于缓存键的匹配（忽略大小写、标点和冗余空格）
 */
export const normalizeQuery = (q: string): string => {
  return q.trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()？?！!，。；：“”‘’]/g, "")
    .replace(/\s{2,}/g, " ");
};

export const getLogs = (): PeriodLog[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading logs", error);
    return [];
  }
};

export const saveLogs = (logs: PeriodLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving logs", error);
  }
};

export const addLog = (log: PeriodLog): PeriodLog[] => {
  const logs = getLogs();
  const newLogs = [log, ...logs].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  saveLogs(newLogs);
  return newLogs;
};

export const deleteLog = (id: string): PeriodLog[] => {
  const logs = getLogs().filter(l => l.id !== id);
  saveLogs(logs);
  return logs;
};

export const updateLog = (updatedLog: PeriodLog): PeriodLog[] => {
  const logs = getLogs().map(l => l.id === updatedLog.id ? updatedLog : l);
  const sortedLogs = logs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  saveLogs(sortedLogs);
  return sortedLogs;
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    const defaults = { 
      notificationsEnabled: false, 
      reminderOffset: 0,
      postPeriodReminder: false,
      postPeriodDays: 3
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  } catch (error) {
    console.error("Error reading settings", error);
    return { notificationsEnabled: false, reminderOffset: 0, postPeriodReminder: false, postPeriodDays: 3 };
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings", error);
  }
};

// --- AI Tip & Query Cache ---

export interface TipCache {
  tip: string;
  phase: string;
  date: string; // YYYY-MM-DD
}

export interface QueryCacheEntry {
  content: string;
  timestamp: number;
  phase: string;
}

/**
 * 检查是否有可用的缓存建议
 */
export const getValidAdviceFromCache = (phase: CyclePhase, query?: string): string | null => {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!query) {
    // 检查每日阶段建议
    const data = localStorage.getItem(TIP_CACHE_KEY);
    if (data) {
      const cached: TipCache = JSON.parse(data);
      if (cached.date === todayStr && cached.phase === phase) {
        return cached.tip;
      }
    }
  } else {
    // 检查特定问题建议
    const cacheData = localStorage.getItem(QUERY_CACHE_KEY);
    if (cacheData) {
      const cache: Record<string, QueryCacheEntry> = JSON.parse(cacheData);
      const key = normalizeQuery(query);
      const entry = cache[key];
      if (entry && entry.phase === phase && (Date.now() - entry.timestamp < CACHE_DURATION)) {
        return entry.content;
      }
    }
  }
  return null;
};

/**
 * 保存 AI 建议到缓存
 */
export const saveAdviceToCache = (advice: string, phase: CyclePhase, query?: string) => {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!query) {
    const cache: TipCache = { tip: advice, phase, date: todayStr };
    localStorage.setItem(TIP_CACHE_KEY, JSON.stringify(cache));
  } else {
    const cacheData = localStorage.getItem(QUERY_CACHE_KEY);
    const cache: Record<string, QueryCacheEntry> = cacheData ? JSON.parse(cacheData) : {};
    const key = normalizeQuery(query);
    
    // 简单的缓存容量限制（最多50条）
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }
    
    cache[key] = {
      content: advice,
      timestamp: Date.now(),
      phase
    };
    localStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(cache));
  }
};

/**
 * 兼容旧代码的同步检查方法
 */
export const checkCacheSync = (phase: CyclePhase): string | null => {
  return getValidAdviceFromCache(phase);
};

// Custom Symptoms Storage
export const getCustomSymptoms = (): CustomSymptom[] => {
  try {
    const data = localStorage.getItem(CUSTOM_SYMPTOMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading custom symptoms", error);
    return [];
  }
};

export const saveCustomSymptoms = (symptoms: CustomSymptom[]) => {
  try {
    localStorage.setItem(CUSTOM_SYMPTOMS_KEY, JSON.stringify(symptoms));
  } catch (error) {
    console.error("Error saving custom symptoms", error);
  }
};

export const addCustomSymptom = (symptom: CustomSymptom): CustomSymptom[] => {
  const current = getCustomSymptoms();
  if (current.some(s => s.name === symptom.name)) return current;
  const updated = [...current, symptom];
  saveCustomSymptoms(updated);
  return updated;
};

export const deleteCustomSymptom = (name: string): CustomSymptom[] => {
  const current = getCustomSymptoms();
  const updated = current.filter(s => s.name !== name);
  saveCustomSymptoms(updated);
  return updated;
};

export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CUSTOM_SYMPTOMS_KEY);
    localStorage.removeItem(TIP_CACHE_KEY);
    localStorage.removeItem(QUERY_CACHE_KEY);
  } catch (error) {
    console.error("Error clearing data", error);
  }
};
