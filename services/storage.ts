import { PeriodLog, AppSettings, CustomSymptom } from '../types';

const STORAGE_KEY = 'lunacare_logs';
const SETTINGS_KEY = 'lunacare_settings';
const CUSTOM_SYMPTOMS_KEY = 'lunacare_custom_symptoms';

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
  // Prevent duplicates
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
  } catch (error) {
    console.error("Error clearing data", error);
  }
};