import { supabase } from '../auth/SupabaseClient';

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
  private userId: string | null = null;

  constructor() {
    this.load();
  }

  async setUser(userId: string | null): Promise<void> {
    this.userId = userId;
    if (userId) {
      await this.loadFromCloud();
    }
  }

  private load() {
    try {
      this.chats = JSON.parse(localStorage.getItem(KEY_CHATS) ?? '[]');
    } catch {
      this.chats = [];
    }
    this.currentId = localStorage.getItem(KEY_CURRENT);

    if (!this.currentId || !this.chats.find((c) => c.id === this.currentId)) {
      this.currentId = this.chats[0]?.id ?? null;
    }
  }

  private save() {
    localStorage.setItem(KEY_CHATS, JSON.stringify(this.chats));
    if (this.currentId) localStorage.setItem(KEY_CURRENT, this.currentId);
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

  /** Chat mavjudligini Supabase'da tekshirish/yaratish */
  private async ensureChatInCloud(chat: StoredChat): Promise<void> {
    if (!this.userId) return;
    try {
      const { data: existing } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chat.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('chats').insert({
          id: chat.id,
          user_id: this.userId,
          title: chat.title,
          pinned: chat.pinned,
        });
        console.log(`[chat] Chat bulutga yozildi: ${chat.id.slice(0, 8)}`);
      }
    } catch (e) {
      console.warn('[chat] ensureChat xato:', e);
    }
  }

  getAll(): StoredChat[] {
    return this.chats.slice().sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }

  getCurrent(): StoredChat | null {
    if (!this.currentId) return null;
    return this.chats.find((c) => c.id === this.currentId) ?? null;
  }

  async createNew(): Promise<StoredChat> {
    const current = this.getCurrent();
    if (current && current.messages.length === 0) {
      return current;
    }

    this.chats = this.chats.filter((c) => c.messages.length > 0 || c.pinned);
    const c = this.createChatInternal();
    this.currentId = c.id;
    this.save();

    if (this.userId) {
      await this.ensureChatInCloud(c);
    }

    if (this.chats.length > MAX_CHATS) {
      const unpinned = this.chats
        .filter((c) => !c.pinned)
        .sort((a, b) => a.updatedAt - b.updatedAt);
      const toRemove = this.chats.length - MAX_CHATS;
      for (let i = 0; i < toRemove && i < unpinned.length; i++) {
        this.chats = this.chats.filter((x) => x.id !== unpinned[i].id);
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

  async delete(id: string) {
    this.chats = this.chats.filter((c) => c.id !== id);
    if (this.currentId === id) {
      const next = this.chats[0];
      if (next) this.currentId = next.id;
      else {
        const c = this.createChatInternal();
        this.currentId = c.id;
      }
    }
    this.save();

    if (this.userId) {
      try {
        await supabase.from('chats').delete().eq('id', id);
      } catch (e) {
        console.warn('[chat] delete xato:', e);
      }
    }
  }

  async togglePin(id: string): Promise<{ ok: boolean; reason?: string }> {
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

    if (this.userId) {
      try {
        await supabase.from('chats').update({ pinned: c.pinned }).eq('id', id);
      } catch (e) {
        console.warn('[chat] pin xato:', e);
      }
    }
    return { ok: true };
  }

  async addMessage(chatId: string, role: 'user' | 'assistant', text: string) {
    const c = this.chats.find((x) => x.id === chatId);
    if (!c) return;

    c.messages.push({ role, text, time: Date.now() });
    c.updatedAt = Date.now();
    if (c.messages.length > MAX_MESSAGES_PER_CHAT) {
      c.messages = c.messages.slice(-MAX_MESSAGES_PER_CHAT);
    }
    this.save();

    if (this.userId) {
      try {
        // Chat mavjud emasligini tekshirish
        await this.ensureChatInCloud(c);

        // Xabarni yozish
        await supabase.from('messages').insert({
          chat_id: chatId,
          role,
          text,
        });

        // Update timestamp
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId);
      } catch (e) {
        console.warn('[chat] addMessage xato:', e);
      }
    }
  }

  async updateTitle(chatId: string, title: string) {
    const c = this.chats.find((x) => x.id === chatId);
    if (!c) return;
    c.title = title.slice(0, 40);
    this.save();

    if (this.userId) {
      try {
        await this.ensureChatInCloud(c);
        await supabase.from('chats').update({ title: c.title }).eq('id', chatId);
      } catch (e) {
        console.warn('[chat] title xato:', e);
      }
    }
  }

  getRecentForContext(chatId: string, limit = 6) {
    const c = this.chats.find((x) => x.id === chatId);
    if (!c) return [];
    return c.messages.slice(-limit).map((m) => ({ role: m.role, text: m.text }));
  }

  private async loadFromCloud(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Bulut BO'SH — yangi chat yaratib, bulutga ham yozamiz
      if ((chatsData ?? []).length === 0) {
        this.chats = [];
        const c = this.createChatInternal();
        this.currentId = c.id;
        this.save();
        await this.ensureChatInCloud(c);
        console.log('[chat] Yangi chat yaratildi (bulut bo\'sh edi)');
        return;
      }

      // Bulutdan yuklash
      const cloudChats: StoredChat[] = [];
      for (const c of chatsData ?? []) {
        const { data: msgsData } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', c.id)
          .order('created_at', { ascending: true });

        cloudChats.push({
          id: c.id,
          title: c.title,
          pinned: c.pinned,
          messages: (msgsData ?? []).map((m) => ({
            role: m.role,
            text: m.text,
            time: new Date(m.created_at).getTime(),
          })),
          createdAt: new Date(c.created_at).getTime(),
          updatedAt: new Date(c.updated_at).getTime(),
        });
      }

      this.chats = cloudChats;
      this.currentId = cloudChats[0].id;
      this.save();
      console.log(`[chat] ${cloudChats.length} chat bulutdan yuklandi`);
    } catch (e) {
      console.warn('[chat] loadFromCloud xato:', e);
    }
  }
}