import type { AIGuide } from '../engine/ai/AIGuide';
import type { AIVoice } from '../engine/ai/AIVoice';
import type { StoredChat } from '../engine/ai/ChatStore';

export class AIChat {
  private el: HTMLDivElement;
  private messagesEl: HTMLDivElement;
  private inputEl: HTMLInputElement;
  private sidebarEl!: HTMLDivElement;
  private headerTitleEl!: HTMLSpanElement;
  private micBtn!: HTMLButtonElement;
  private ttsBtn!: HTMLButtonElement;
  private voiceBtn!: HTMLButtonElement;
  private open = false;
  private sidebarOpen = false;
  private voicePickerOpen = false;
  private onToggle?: (open: boolean) => void;

  constructor(
    private guide: AIGuide,
    private voice: AIVoice,
    onToggle?: (open: boolean) => void,
  ) {
    this.onToggle = onToggle;

    this.el = document.createElement('div');
    this.el.className = 'ai-chat';
    this.el.style.display = 'none';
    this.el.innerHTML = `
      <div class="ai-header">
        <button class="ai-hdr-btn ai-hamburger" title="Chatlar">☰</button>
        <span class="ai-title">KOSMOS AI</span>
        <div class="ai-header-actions">
          <button class="ai-hdr-btn ai-voice-btn" title="Ovoz tanlash">🎙</button>
          <button class="ai-hdr-btn ai-tts" title="Ovozli o'qish">🔇</button>
          <button class="ai-hdr-btn ai-close" aria-label="Yopish">✕</button>
        </div>
      </div>
      <div class="ai-body">
        <div class="ai-sidebar">
          <button class="ai-new-chat">+ Yangi suhbat</button>
          <button class="ai-forget-name">Ismni o'chirish</button>
          <div class="ai-chat-list"></div>
        </div>
        <div class="ai-messages"></div>
      </div>
      <div class="ai-input-row">
        <button class="ai-mic" title="Ovoz bilan yozish">🎤</button>
        <input class="ai-input" type="text" placeholder="Koinot haqida so'rang..." />
        <button class="ai-send">➤</button>
      </div>
    `;
    document.body.appendChild(this.el);

    this.messagesEl = this.el.querySelector('.ai-messages') as HTMLDivElement;
    this.inputEl = this.el.querySelector('.ai-input') as HTMLInputElement;
    this.sidebarEl = this.el.querySelector('.ai-sidebar') as HTMLDivElement;
    this.headerTitleEl = this.el.querySelector('.ai-title') as HTMLSpanElement;
    this.micBtn = this.el.querySelector('.ai-mic') as HTMLButtonElement;
    this.ttsBtn = this.el.querySelector('.ai-tts') as HTMLButtonElement;
    this.voiceBtn = this.el.querySelector('.ai-voice-btn') as HTMLButtonElement;

    (this.el.querySelector('.ai-close') as HTMLButtonElement).addEventListener(
      'click',
      () => this.toggle(),
    );
    (this.el.querySelector('.ai-send') as HTMLButtonElement).addEventListener(
      'click',
      () => this.send(),
    );
    (this.el.querySelector('.ai-hamburger') as HTMLButtonElement).addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      },
    );
    (this.el.querySelector('.ai-new-chat') as HTMLButtonElement).addEventListener(
      'click',
      () => this.newChat(),
    );
    (this.el.querySelector('.ai-forget-name') as HTMLButtonElement).addEventListener(
      'click',
      () => {
        if (confirm("AI ismingizni eslab qolganini o'chirilsinmi?")) {
          this.guide.forgetName();
          this.updateHeader();
          alert("Ism o'chirildi. Keyingi safar AI yana so'raydi.");
        }
      },
    );
    this.ttsBtn.addEventListener('click', () => this.toggleTTS());
    this.micBtn.addEventListener('click', () => this.toggleMic());
    this.voiceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVoicePicker();
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
      e.stopPropagation();
    });

    this.updateTTSBtn();
    this.updateHeader();
    this.loadCurrentChat();

    // Document click — sidebar/voice picker tashqariga bosganda yopiladi
    document.addEventListener('click', this.onDocumentClick);

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (e.code === 'KeyG' && !e.ctrlKey && !e.metaKey && !e.repeat && !isInput) {
        this.toggle();
      }
      if (e.code === 'Escape') {
        if (this.sidebarOpen) this.toggleSidebar();
        if (this.voicePickerOpen) this.toggleVoicePicker();
      }
    });
  }

  /** Tashqariga bosilganda sidebar va picker yopiladi */
  private onDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Sidebar ochiq va tashqariga bosilsa
    if (this.sidebarOpen) {
      if (
        !this.sidebarEl.contains(target) &&
        !target.closest('.ai-hamburger')
      ) {
        this.toggleSidebar();
      }
    }

    // Voice picker ochiq va tashqariga bosilsa
    if (this.voicePickerOpen) {
      if (
        !target.closest('.ai-voice-picker') &&
        !target.closest('.ai-voice-btn')
      ) {
        this.toggleVoicePicker();
      }
    }
  };

  isOpen(): boolean {
    return this.open;
  }

  private updateHeader() {
    const name = this.guide.getName();
    this.headerTitleEl.textContent = name ? `KOSMOS AI · ${name}` : 'KOSMOS AI';
  }

  private updateTTSBtn() {
    const on = this.voice.isTTSEnabled();
    this.ttsBtn.classList.toggle('cp-active', on);
    this.ttsBtn.textContent = on ? '🔊' : '🔇';
  }

  private toggleTTS() {
    this.voice.setTTSEnabled(!this.voice.isTTSEnabled());
    this.updateTTSBtn();
  }

  private toggleVoicePicker() {
    if (this.voicePickerOpen) {
      document.querySelector('.ai-voice-picker')?.remove();
      this.voicePickerOpen = false;
      return;
    }

    this.voicePickerOpen = true;
    const picker = document.createElement('div');
    picker.className = 'ai-voice-picker';

    const voices = [
      ...this.voice.getAllVoices(),
      { name: 'browser', lang: 'uz', gender: 'Female', label: '🖥 Brauzer ovozi (fallback)' },
    ];
    const current = this.voice.getCurrentVoiceName();

    // Brauzer variantini ajratish
    const browserVoice = voices.find((v) => v.name === 'browser');
    const otherVoices = voices.filter((v) => v.name !== 'browser');

    const groups: Record<string, typeof otherVoices> = {};
    for (const v of otherVoices) {
      const key = v.lang.split('-')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }

    const langLabels: Record<string, string> = {
      uz: '🇺🇿 O‘zbek',
      tr: '🇹🇷 Turk',
      ru: '🇷🇺 Rus',
      en: '🇬🇧 Ingliz',
    };

    const html = Object.keys(groups)
      .map((lang) => {
        const items = groups[lang]
          .map(
            (v) => `
        <div class="ai-voice-item ${current === v.name ? 'active' : ''}" data-name="${v.name}">
          <span class="ai-voice-item-lang">${v.gender === 'Female' ? '♀' : '♂'}</span>
          <span class="ai-voice-item-name">${v.label}</span>
        </div>
      `,
          )
          .join('');
        return `
      <div class="ai-voice-group">
        <div class="ai-voice-group-title">${langLabels[lang] ?? lang}</div>
        ${items}
      </div>
    `;
      })
      .join('');

    const browserHtml = browserVoice ? `
      <div class="ai-voice-group">
        <div class="ai-voice-group-title">🖥 Brauzer</div>
        <div class="ai-voice-item ${current === browserVoice.name ? 'active' : ''}" data-name="${browserVoice.name}">
          <span class="ai-voice-item-lang">♬</span>
          <span class="ai-voice-item-name">${browserVoice.label}</span>
        </div>
      </div>
    ` : '';

    picker.innerHTML = `
      OVOZ TANLASH

      ${html}
      ${browserHtml}

      <div class="ai-voice-picker-hint">
        ⭐ = Microsoft Neural (sifatli). Brauzer ovozi — fallback.
      </div>
    `;

    this.el.appendChild(picker);

    picker.querySelectorAll('.ai-voice-item').forEach((item) => {
      item.addEventListener('click', async () => {
        const name = (item as HTMLElement).dataset.name ?? '';
        this.voice.setVoice(name);
        this.toggleVoicePicker();

        const wasOn = this.voice.isTTSEnabled();
        if (!wasOn) this.voice.setTTSEnabled(true);
        await this.voice.speak('Salom! Men KOSMOS AI.');
        if (!wasOn) this.voice.setTTSEnabled(false);
      });
    });
  }

  private toggleMic() {
    if (this.voice.isListening()) {
      this.voice.stopListening();
      this.micBtn.classList.remove('cp-active');
      return;
    }
    if (!this.voice.isSupported()) {
      this.renderMessage(
        'assistant',
        "Brauzeringiz ovozni tanishni qo'llab-quvvatlamaydi.",
      );
      return;
    }
    this.micBtn.classList.add('cp-active');
    let finalText = '';
    this.voice.startListening(
      (text, isFinal) => {
        this.inputEl.value = text;
        if (isFinal) finalText = text;
      },
      () => {
        this.micBtn.classList.remove('cp-active');
        if (finalText.trim()) setTimeout(() => this.send(), 200);
      },
      (err) => {
        this.micBtn.classList.remove('cp-active');
        console.warn('[voice] STT xato:', err);
      },
    );
  }

  private toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarEl.classList.toggle('open', this.sidebarOpen);
    if (this.sidebarOpen) this.renderSidebar();
  }

  private renderSidebar() {
    const list = this.sidebarEl.querySelector('.ai-chat-list') as HTMLDivElement;
    const chats = this.guide.chats.getAll();
    const current = this.guide.chats.getCurrent();

    list.innerHTML = '';

    for (const c of chats) {
      const item = document.createElement('div');
      item.className = 'ai-chat-item';
      if (current && c.id === current.id) item.classList.add('active');
      if (c.pinned) item.classList.add('pinned');

      const title = document.createElement('span');
      title.className = 'ai-chat-item-title';
      title.textContent = c.pinned ? '📌 ' + c.title : c.title;
      item.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'ai-chat-item-actions';

      const pinBtn = document.createElement('button');
      pinBtn.className = 'ai-chat-item-btn';
      pinBtn.textContent = c.pinned ? '📌' : '📍';
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = this.guide.chats.togglePin(c.id);
        if (!r.ok && r.reason) alert(r.reason);
        this.renderSidebar();
      });
      actions.appendChild(pinBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'ai-chat-item-btn';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`"${c.title}" o'chirilsinmi?`)) {
          this.guide.chats.delete(c.id);
          this.loadCurrentChat();
          this.renderSidebar();
        }
      });
      actions.appendChild(delBtn);

      item.appendChild(actions);
      item.addEventListener('click', () => {
        this.guide.chats.select(c.id);
        this.loadCurrentChat();
        this.toggleSidebar();
      });

      list.appendChild(item);
    }
  }

  private newChat() {
    const before = this.guide.chats.getCurrent();
    const c = this.guide.chats.createNew();
    if (before && c.id === before.id) {
      this.toggleSidebar();
      return;
    }
    this.loadCurrentChat();
    this.renderSidebar();
    this.toggleSidebar();
  }

  private loadCurrentChat() {
    const chat = this.guide.chats.getCurrent();
    if (!chat) return;
    this.messagesEl.innerHTML = '';

    if (chat.messages.length === 0) {
      const name = this.guide.getName();
      const greeting = name
        ? `Salom, ${name}! Yana nima bilan yordam beray?`
        : 'Salom! Men KOSMOS AI. Ismingizni bilsam bo\'ladimi?';
      this.renderMessage('assistant', greeting);
    } else {
      for (const m of chat.messages) {
        this.renderMessage(m.role, m.text, true);
      }
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.updateHeader();
  }

  toggle() {
    this.open = !this.open;
    this.el.style.display = this.open ? 'flex' : 'none';
    if (this.open) {
      setTimeout(() => this.inputEl.focus(), 60);
      this.loadCurrentChat();
    } else {
      this.sidebarOpen = false;
      this.sidebarEl.classList.remove('open');
      if (this.voicePickerOpen) this.toggleVoicePicker();
    }
    this.onToggle?.(this.open);
  }

  private renderMessage(
    role: 'user' | 'assistant',
    text: string,
    fromHistory = false,
  ): HTMLDivElement {
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role}`;
    div.textContent = text;
    if (fromHistory) div.classList.add('ai-msg-old');
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return div;
  }

  private async send() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.inputEl.value = '';
    this.renderMessage('user', text);

    const replyEl = this.renderMessage('assistant', '');
    replyEl.classList.add('ai-msg-streaming');

    let accumulated = '';

    try {
      await this.guide.ask(text, (chunk) => {
        accumulated += chunk;
        replyEl.textContent = accumulated;
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      });
      replyEl.classList.remove('ai-msg-streaming');
      if (this.sidebarOpen) this.renderSidebar();
      this.updateHeader();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      replyEl.textContent = msg;
      replyEl.classList.remove('ai-msg-streaming');
      if (/limit|kuting|band/i.test(msg)) {
        replyEl.classList.add('ai-msg-warn');
      } else {
        replyEl.classList.add('ai-msg-error');
      }
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
}