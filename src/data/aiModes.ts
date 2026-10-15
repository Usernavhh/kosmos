export type AIMode = 'standard' | 'pro' | 'expert';

export interface AIModeInfo {
  id: AIMode;
  name: string;
  label: string;
  description: string;
  icon: string;
  maxTokens: number;
  temperature: number;
  model: string;
  modelFallback: string;
  thinking: boolean;
}

export const AI_MODES: Record<AIMode, AIModeInfo> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    label: 'Standart',
    description: 'Tez javob, oddiy savollar uchun',
    icon: '💬',
    maxTokens: 800,
    temperature: 0.85,
    model: 'openai/gpt-oss-120b',
    modelFallback: 'llama-3.1-8b-instant',
    thinking: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    label: 'Pro',
    description: "Chuqur o'ylash, murakkab savollar",
    icon: '🧠',
    maxTokens: 2000,
    temperature: 0.7,
    model: 'llama-3.3-70b-versatile',
    modelFallback: 'openai/gpt-oss-120b',
    thinking: true,
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    label: 'Ekspert',
    description: "Ilmiy aniqlik, olimpiada darajasi",
    icon: '🎓',
    maxTokens: 4000,
    temperature: 0.5,
    model: 'llama-3.3-70b-versatile',
    modelFallback: 'openai/gpt-oss-120b',
    thinking: true,
  },
};

const KEY_MODE = 'kosmos_ai_mode';

export function loadAIMode(): AIMode {
  const saved = localStorage.getItem(KEY_MODE) as AIMode | null;
  if (saved && AI_MODES[saved]) return saved;
  return 'standard';
}

export function saveAIMode(mode: AIMode): void {
  localStorage.setItem(KEY_MODE, mode);
}