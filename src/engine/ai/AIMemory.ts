export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  time: number;
}

const KEY_NAME = 'kosmos_user_name';
const KEY_HISTORY = 'kosmos_chat_history';
const KEY_FACTS = 'kosmos_user_facts';
const KEY_VOICE = 'kosmos_voice_name';

const MAX_STORED = 100;
const MAX_CONTEXT_MESSAGES = 6;

export class AIMemory {
  private name = '';
  private history: ChatMessage[] = [];
  private facts: string[] = [];

  constructor() {
    this.name = localStorage.getItem(KEY_NAME) ?? '';
    try {
      this.history = JSON.parse(localStorage.getItem(KEY_HISTORY) ?? '[]');
    } catch {
      this.history = [];
    }
    try {
      this.facts = JSON.parse(localStorage.getItem(KEY_FACTS) ?? '[]');
    } catch {
      this.facts = [];
    }
    console.log(
      `[memory] ism="${this.name}", ${this.history.length} xabar`,
    );
  }

  getName(): string {
    return this.name;
  }

  /** Ismni YANGILASH (agar eski bo'lsa ham) */
  setName(name: string) {
    const clean = name.trim().slice(0, 40);
    if (!clean) return;
    this.name = clean;
    localStorage.setItem(KEY_NAME, clean);
    console.log(`[memory] Ism saqlandi: ${clean}`);
  }

  forgetName() {
    this.name = '';
    localStorage.removeItem(KEY_NAME);
    console.log('[memory] Ism o\'chirildi');
  }

  /** Tanlangan ovoz nomini saqlash */
  getVoiceName(): string {
    return localStorage.getItem(KEY_VOICE) ?? '';
  }

  setVoiceName(name: string) {
    if (name) localStorage.setItem(KEY_VOICE, name);
    else localStorage.removeItem(KEY_VOICE);
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  getRecentForContext(): { role: 'user' | 'assistant'; text: string }[] {
    return this.history
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((m) => ({ role: m.role, text: m.text }));
  }

  addMessage(role: 'user' | 'assistant', text: string) {
    this.history.push({ role, text, time: Date.now() });
    if (this.history.length > MAX_STORED) {
      this.history = this.history.slice(-MAX_STORED);
    }
    localStorage.setItem(KEY_HISTORY, JSON.stringify(this.history));
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem(KEY_HISTORY);
  }

  clearAll() {
    this.history = [];
    this.facts = [];
    this.name = '';
    localStorage.removeItem(KEY_HISTORY);
    localStorage.removeItem(KEY_FACTS);
    localStorage.removeItem(KEY_NAME);
  }

  buildContext(sceneContext: string, isNewChat = false): string {
    const parts: string[] = [];

    if (this.name) {
      parts.push(`FOYDALANUVCHI ISMI: **${this.name}**`);
      parts.push(
        `Doim shu ism bilan murojaat qil. Boshqa ism aytma, "abduraxmon" deb yozma agar foydalanuvchi boshqa ism aytgan bo'lsa.`,
      );
      if (isNewChat) {
        parts.push(
          `BU YANGI SUHBAT. Salomlash: "Salom, ${this.name}!"`,
        );
      }
    } else {
      if (isNewChat) {
        parts.push(
          `BU YANGI SUHBAT. Xushmuomala salomlash va ismini so'ra: "Salom! Men KOSMOS AI. Ismingizni bilsam bo'ladimi?"`,
        );
      } else {
        parts.push(`Foydalanuvchi ismi hali noma'lum.`);
      }
    }

    if (this.facts.length > 0) {
      parts.push(`Foydalanuvchi haqida:\n- ${this.facts.join('\n- ')}`);
    }

    if (sceneContext) parts.push(sceneContext);

    return parts.join('\n\n');
  }
}