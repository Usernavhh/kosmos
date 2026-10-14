export interface StoredMessage {
  role: 'user' | 'assistant';
  text: string;
  time: number;
}

export interface StoredChat {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

const KEY_CHATS = 'kosmos_chats_v1';
const KEY_CURRENT = 'kosmos_current_chat_v1';

const MAX_CHATS = 50;
const MAX_MESSAGES_PER_CHAT = 200;
const MAX_PINS = 3;
const DEFAULT_TITLE = 'Yangi suhbat';

export class ChatStore {
  private chats: StoredChat[] = [];
  private currentId: string | null = null;

  constructor() {
    this.load();
  }

  private load() {
    try {
      this.chats = JSON.parse(localStorage.getItem(KEY_CHATS) ?? '[]');
    } catch {
      this.chats = [];
    }
    this.currentId = localStorage.getItem(KEY_CURRENT);

    // Agar current id yo'q yoki o'chirilgan bo'lsa — eng oxirgi chat
    if (!this.currentId || !this.chats.find((c) => c.id === this.currentId)) {
      const latest = this.chats
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      this.currentId = latest?.id ?? null;
    }

    // Hech bo'lmasa — yangi chat yaratamiz
    if (!this.currentId) {
      const c = this.createChatInternal();
      this.currentId = c.id;
    }
  }

  private save() {
    localStorage.setItem(KEY_CHATS, JSON.stringify(this.chats));
    if (this.currentId) {
      localStorage.setItem(KEY_CURRENT, this.currentId);
    }
  }

  private createChatInternal(): StoredChat {
    const c: StoredChat = {
      id: crypto.randomUUID(),
      title: DEFAULT_TITLE,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };
    this.chats.push(c);
    this.save();
    return c;
  }

  /** Chats sorted: pinned first, then by updatedAt desc */
  getAll(): StoredChat[] {
    return this.chats
      .slice()
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }

  getCurrent(): StoredChat | null {
    if (!this.currentId) return null;
    return this.chats.find((c) => c.id === this.currentId) ?? null;
  }

  /**
   * Yangi chat. Agar joriy chat bo'sh bo'lsa — o'shani qaytaradi
   * (dublikat yaratmaslik uchun).
   */
  createNew(): StoredChat {
    const current = this.getCurrent();
    if (current && current.messages.length === 0) {
      // Bo'sh chat allaqachon bor — uni qaytaramiz
      return current;
    }

    // Eski bo'sh chat(lar)ni tozalaymiz
    this.chats = this.chats.filter(
      (c) => c.messages.length > 0 || c.pinned,
    );

    // Yangi yaratamiz
    const c = this.createChatInternal();
    this.currentId = c.id;
    this.save();

    // Limit
    if (this.chats.length > MAX_CHATS) {
      const unpinned = this.chats
        .filter((c) => !c.pinned)
        .sort((a, b) => a.updatedAt - b.updatedAt);
      const toRemove = this.chats.length - MAX_CHATS;
      for (let i = 0; i < toRemove && i < unpinned.length; i++) {
        this.chats = this.chats.filter((c) => c.id !== unpinned[i].id);
      }
      this.save();
    }

    return c;
  }

  select(id: string) {
    if (this.chats.find((c) => c.id === id)) {
      this.currentId = id;
      this.save();
    }
  }

  delete(id: string) {
    this.chats = this.chats.filter((c) => c.id !== id);

    // Agar joriy chat o'chirilsa — keyingisiga o'tamiz yoki yangi yaratamiz
    if (this.currentId === id) {
      const next = this.chats[0];
      if (next) {
        this.currentId = next.id;
      } else {
        const c = this.createChatInternal();
        this.currentId = c.id;
      }
    }
    this.save();
  }

  togglePin(id: string): { ok: boolean; reason?: string } {
    const c = this.chats.find((x) => x.id === id);
    if (!c) return { ok: false, reason: 'Chat topilmadi' };

    if (!c.pinned) {
      const pinsCount = this.chats.filter((x) => x.pinned).length;
      if (pinsCount >= MAX_PINS) {
        return { ok: false, reason: `Maksimal ${MAX_PINS} ta pin` };
      }
    }
    c.pinned = !c.pinned;
    this.save();
    return { ok: true };
  }

  addMessage(chatId: string, role: 'user' | 'assistant', text: string) {
    const c = this.chats.find((x) => x.id === chatId);
    if (!c) return;
    c.messages.push({ role, text, time: Date.now() });
    c.updatedAt = Date.now();
    if (c.messages.length > MAX_MESSAGES_PER_CHAT) {
      c.messages = c.messages.slice(-MAX_MESSAGES_PER_CHAT);
    }
    this.save();
  }

  updateTitle(chatId: string, title: string) {
    const c = this.chats.find((x) => x.id === chatId);
    if (!c) return;
    c.title = title.slice(0, 40);
    this.save();
  }

  /** Joriy chat oxirgi N xabarini qaytaradi (AI context uchun) */
  getRecentForContext(chatId: string, limit = 6) {
    const c = this.chats.find((x) => x.id === chatId);
    if (!c) return [];
    return c.messages.slice(-limit).map((m) => ({
      role: m.role,
      text: m.text,
    }));
  }
}