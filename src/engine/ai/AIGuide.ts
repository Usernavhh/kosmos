import { type AIMode, loadAIMode, saveAIMode } from '../../data/aiModes';
import { AIMemory } from './AIMemory';
import { ChatStore } from './ChatStore';
import { MemoryStore } from './MemoryStore';
import type { AIVoice } from './AIVoice';

export interface SceneContext {
  distanceFromCenter?: number;
  currentTime?: string;
  currentPlanet?: string;
  currentStar?: string;
  currentSatellite?: string;
  sceneInfo?: () => import('../scene/Scene').SceneInfo;
}

export class AIGuide {
  readonly memory: AIMemory;
  readonly chats: ChatStore;
  readonly facts: MemoryStore;
  mode: AIMode = loadAIMode();
  private context: SceneContext = {};
  private busy = false;

  constructor(private voice?: AIVoice) {
    this.memory = new AIMemory();
    this.chats = new ChatStore();
    this.facts = new MemoryStore();
  }

  setContext(ctx: SceneContext) {
    this.context = ctx;
  }

  setMode(mode: AIMode) {
    this.mode = mode;
    saveAIMode(mode);
    console.log(`[ai] Rejim o'zgartirildi: ${mode}`);
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

  isUserSignedIn(): boolean {
    return (this.chats as unknown as { userId: string | null }).userId !== null;
  }

  async ask(message: string, onChunk: (text: string) => void): Promise<string> {
    if (!this.isUserSignedIn()) {
      throw new Error('SIGN_IN_REQUIRED');
    }
    if (this.busy) throw new Error('Oldingi savolga javob kelyapti');

    this.busy = true;
    try {
      const chat = this.chats.getCurrent();
      if (!chat) throw new Error('Chat topilmadi');

      // Ism yangilash
      this.tryExtractName(message);

      // Faktlarni avtomatik ajratish
      this.facts.autoExtract(message);

      const ctxStr = this.buildSceneContext();
      const isNewChat = chat.messages.length === 0;
      const userContext = this.memory.buildContext(ctxStr, isNewChat);
      const factsContext = this.facts.buildContext(message);

      const fullContext = [userContext, factsContext].filter(Boolean).join('\n\n');
      const history = this.chats.getRecentForContext(chat.id, 6);

      await this.chats.addMessage(chat.id, 'user', message);

      if (chat.messages.length === 1 || chat.title === 'Yangi suhbat') {
        await this.chats.updateTitle(chat.id, message);
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: fullContext,
          history,
          mode: this.mode,
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

      await this.chats.addMessage(chat.id, 'assistant', fullText);
      this.voice?.flushPending();

      return fullText;
    } finally {
      this.busy = false;
    }
  }

  private tryExtractName(message: string) {
    const patterns = [
      /mening\s+ismim\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})/i,
      /ismim\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})/i,
      /meni\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})\s+deb\s+chaqir/i,
    ];
    const blacklist = ['men', 'sen', 'u', 'biz', 'siz', 'ular'];
    for (const p of patterns) {
      const m = message.match(p);
      if (m && m[1]) {
        const name = m[1].trim();
        if (!blacklist.includes(name.toLowerCase()) && name.length >= 2 && name.length <= 20) {
          if (this.memory.getName() !== name) {
            this.memory.setName(name);
            console.log(`[ai] Ism: ${name}`);

            const authSync = (window as unknown as {
              __kosmos_auth_sync_name?: (name: string) => void;
            }).__kosmos_auth_sync_name;
            if (authSync) authSync(name);
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
    } catch { /* jim */ }
  }

  private buildSceneContext(): string {
    const c = this.context;
    const parts: string[] = [];

    if (c.sceneInfo) {
      const info = c.sceneInfo();
      const regionNames = {
        'solar-system': 'Quyosh sistemasi ichida',
        'near-space': 'Yaqin fazoda (Quyosh sistemasi tashqarisida)',
        'galactic': "Somon Yo'li ichida (galaktik fazo)",
        'intergalactic': 'Galaktikalararo fazoda (juda uzoq)',
      } as const;

      parts.push('═══ FOYDALANUVCHI HOZIRGI HOLATI ═══');
      parts.push(`📍 Mintaqa: ${regionNames[info.region]}`);
      parts.push(`☀️ Quyoshdan masofa: ${info.distanceFromSunAU.toFixed(2)} AU`);

      if (info.distanceFromEarthAU !== null) {
        parts.push(`🌍 Yerdan masofa: ${info.distanceFromEarthAU.toFixed(2)} AU`);
      }
      if (info.distanceFromSgrALy !== null) {
        parts.push(`🌌 Sgr A* dan masofa: ${info.distanceFromSgrALy.toFixed(2)} ly`);
      }
      if (info.nearestPlanet) {
        parts.push(`🪐 Eng yaqin sayyora: ${info.nearestPlanet.name} (${info.nearestPlanet.distanceAU.toFixed(2)} AU)`);
      } else {
        parts.push('🪐 Eng yaqin ob\'ekt: hozircha aniq sayyora yaqinida emassiz');
      }
      if (info.isLost) {
        parts.push('⚠️ Foydalanuvchi adashib ketgan: "H" tugmasini bosing, uyga qaytib keting.');
      }
      parts.push(`📐 Kamera yo'nalishi: ${info.cameraForward.x.toFixed(2)}, ${info.cameraForward.y.toFixed(2)}, ${info.cameraForward.z.toFixed(2)}`);
    }

    if (c.currentPlanet) {
      parts.push(
        `⚠️ DIQQAT: Foydalanuvchi hozir "${c.currentPlanet}" yaqinida. ` +
        `Agar "bu nima?" yoki "nima ko'ryapman?" deb so'rasa — ` +
        `"${c.currentPlanet}" haqida gapir, boshqa narsa haqida emas.`,
      );
    } else {
      parts.push(
        `Foydalanuvchi koinotning ochiq joyida. ` +
        `Agar "nima ko'ryapman?" deb so'rasa — "hozircha aniq ob'ekt yo'q, ` +
        `lekin yulduzlar va galaktika ko'rinadi" deb ayt.`,
      );
    }

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