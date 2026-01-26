
export interface PeriodLog {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  symptoms: string[];
  flow: 'Light' | 'Medium' | 'Heavy';
  mood: string;
  notes?: string;
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodDuration: number;
  nextPeriodPrediction: string;
}

export enum CyclePhase {
  Menstrual = '月经期',
  Follicular = '卵泡期',
  Ovulation = '排卵期',
  Luteal = '黄体期',
  Unknown = '未知'
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export type AiPersona = 'guardian' | 'expert' | 'wit';
export type AiProvider = 'gemini' | 'deepseek' | 'zhipu' | 'custom';

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderOffset: 0 | 1; // 0 = same day, 1 = 1 day before
  postPeriodReminder?: boolean; 
  postPeriodDays?: number; 
  lastNotifiedDate?: string; 
  aiPersona?: AiPersona; 
  aiProvider?: AiProvider; 
  customApiKey?: string; 
  customApiBase?: string; 
  customModelName?: string; // 新增：自定义模型名称
}

export interface CustomSymptom {
  name: string;
  emoji: string;
}
