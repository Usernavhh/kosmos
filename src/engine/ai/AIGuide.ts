import { AIMemory } from './AIMemory';
import { ChatStore } from './ChatStore';
import type { AIVoice } from './AIVoice';

export interface SceneContext {
  distanceFromCenter?: number;
  currentTime?: string;
  currentPlanet?: string;
  currentStar?: string;
  currentSatellite?: string;
}

export class AIGuide {
  readonly memory: AIMemory;
  readonly chats: ChatStore;
  private context: SceneContext = {};
  private busy = false;

  constructor(private voice?: AIVoice) {
    this.memory = new AIMemory();
    this.chats = new ChatStore();
  }

  setContext(ctx: SceneContext) {
    this.context = ctx;
  }

  setName(name: string) {
    this.memory.setName(name);
  }

  forgetName() {
    this.memory.forgetName();
  }

  getName(): string {
    return this.memory.getName();
  }

  async ask(message: string, onChunk: (text: string) => void): Promise<string> {
    if (this.busy) throw new Error('Oldingi savolga javob kelyapti');

    this.busy = true;
    try {
      const chat = this.chats.getCurrent();
      if (!chat) throw new Error('Chat topilmadi');

      // MUHIM: ismni DARROV yangilash (agar aytilgan bo'lsa)
      this.tryExtractName(message);

      const ctxStr = this.buildSceneContext();
      const isNewChat = chat.messages.length === 0;
      const fullContext = this.memory.buildContext(ctxStr, isNewChat);
      const history = this.chats.getRecentForContext(chat.id, 6);

      this.chats.addMessage(chat.id, 'user', message);

      if (chat.messages.length === 1 || chat.title === 'Yangi suhbat') {
        this.chats.updateTitle(chat.id, message);
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: fullContext,
          history,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`AI server javob bermadi (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullText = '';
      let errorMsg: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const blocks = buf.split('\n\n');
        buf = blocks.pop() ?? '';
        for (const block of blocks) {
          if (!block.startsWith('data: ')) continue;
          const payload = block.slice(6).trim();
          if (!payload) continue;
          try {
            const json = JSON.parse(payload);
            if (json.text) {
              fullText += json.text;
              onChunk(json.text);
              this.voice?.feedChunk(json.text);
            }
            if (json.error) errorMsg = json.error;
          } catch {
            /* fragment */
          }
        }
      }

      if (errorMsg && !fullText) throw new Error(errorMsg);

      this.chats.addMessage(chat.id, 'assistant', fullText);

      this.voice?.flushPending();

      return fullText;
    } finally {
      this.busy = false;
    }
  }

  /**
   * Matndan ism ajratib olish. DOIM ishlaydi — agar foydalanuvchi
   * yangi ism aytsa, eskisini almashtiradi.
   */
  private tryExtractName(message: string) {
    // Kuchliroq pattern'lar
    const patterns = [
      /mening\s+ismim\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})/i,
      /ismim\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})/i,
      /meni\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})\s+deb\s+chaqir/i,
      /(?:^|\s)([A-Z][a-z\u0400-\u04FF\u0600-\u06FF']{2,19})(?:\s+man|man$)/,
      /(?:i'm|i am|my name is)\s+([A-Za-z]{2,20})/i,
    ];

    const blacklist = [
      'men', 'sen', 'u', 'biz', 'siz', 'ular',
      'yaxshi', 'salom', 'rahmat', 'nima', 'qanday',
      'yulduz', 'sayyora', 'koinot', 'quyosh', 'oy',
    ];

    for (const p of patterns) {
      const m = message.match(p);
      if (m && m[1]) {
        const name = m[1].trim();
        if (
          !blacklist.includes(name.toLowerCase()) &&
          name.length >= 2 &&
          name.length <= 20
        ) {
          // Faqat joriy ismdan farq qilsa yangilaymiz
          if (this.memory.getName() !== name) {
            this.memory.setName(name);
            console.log(`[ai] Ism yangilandi: ${name}`);
          }
          return;
        }
      }
    }
  }

  async warmup(): Promise<void> {
    try {
      await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping', context: 'warmup', history: [] }),
      });
      console.log('[ai] Warmup tugadi');
    } catch {
      /* jim */
    }
  }

  private buildSceneContext(): string {
    const c = this.context;
    const parts: string[] = [];

    if (c.currentPlanet) parts.push(`Tanlangan sayyora: ${c.currentPlanet}`);
    if (c.currentStar) parts.push(`Tanlangan yulduz: ${c.currentStar}`);
    if (c.currentSatellite) parts.push(`Tanlangan yo'ldosh: ${c.currentSatellite}`);

    if (c.distanceFromCenter !== undefined) {
      const d = c.distanceFromCenter;
      if (d < 1000) parts.push('Hozir Quyosh sistemasi ichida');
      else if (d < 1e6) parts.push('Hozir yaqin fazoda');
      else if (d < 1e9) parts.push('Hozir galaktik fazoda');
      else parts.push('Hozir galaktikalar orasida');
    }

    if (c.currentTime) parts.push(`Simulyatsiya vaqti: ${c.currentTime}`);

    return parts.join('\n');
  }
}