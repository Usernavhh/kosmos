export interface TTSVoice {
  name: string;
  lang: string;
  gender: string;
  label: string;
}

export const EDGE_VOICES: TTSVoice[] = [
  { name: 'uz-UZ-SardorNeural', lang: 'uz', gender: 'Male', label: 'Sardor (erkak) ⭐' },
  { name: 'uz-UZ-MadinaNeural', lang: 'uz', gender: 'Female', label: 'Madina (ayol) ⭐' },
  { name: 'tr-TR-AhmetNeural', lang: 'tr', gender: 'Male', label: 'Ahmet (turk)' },
  { name: 'tr-TR-EmelNeural', lang: 'tr', gender: 'Female', label: 'Emel (turk)' },
  { name: 'ru-RU-DmitryNeural', lang: 'ru', gender: 'Male', label: 'Dmitriy (rus)' },
  { name: 'ru-RU-SvetlanaNeural', lang: 'ru', gender: 'Female', label: 'Svetlana (rus)' },
  { name: 'en-US-GuyNeural', lang: 'en', gender: 'Male', label: 'Guy (ingliz)' },
  { name: 'en-US-JennyNeural', lang: 'en', gender: 'Female', label: 'Jenny (ingliz)' },
];

const KEY_VOICE = 'kosmos_tts_voice';

export class AIVoice {
  private ttsEnabled = false;
  private currentVoice = 'uz-UZ-SardorNeural';
  private browserVoiceMode = false;
  private audioQueue: HTMLAudioElement[] = [];
  private stopFlag = false;

  // ═══════ YAGONA navbat ═══════
  private speakingQueue: Promise<void> = Promise.resolve();
  private streamBuffer = '';

  // STT
  private recognition: SpeechRecognition | null = null;
  private listening = false;

  constructor() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(KEY_VOICE);
    if (saved === 'browser') {
      this.browserVoiceMode = true;
      this.currentVoice = 'uz-UZ-SardorNeural';
    } else if (saved) {
      this.currentVoice = saved;
    }
    console.log(`[voice] Ovoz: ${this.getCurrentVoiceName()}`);
  }

  getAllVoices(): TTSVoice[] {
    return EDGE_VOICES;
  }

  getCurrentVoiceName(): string {
    return this.browserVoiceMode ? 'browser' : this.currentVoice;
  }

  setVoice(name: string) {
    if (name === 'browser') {
      this.browserVoiceMode = true;
      this.currentVoice = 'uz-UZ-SardorNeural';
      localStorage.setItem(KEY_VOICE, 'browser');
      console.log('[voice] Ovoz: browser fallback');
      return;
    }

    const found = EDGE_VOICES.find((v) => v.name === name);
    if (found) {
      this.browserVoiceMode = false;
      this.currentVoice = name;
      localStorage.setItem(KEY_VOICE, name);
      console.log(`[voice] Ovoz: ${found.label}`);
    }
  }

  isTTSEnabled(): boolean {
    return this.ttsEnabled;
  }

  setTTSEnabled(on: boolean) {
    this.ttsEnabled = on;
    if (!on) this.stopSpeaking();
  }

  // ═══════════════════════════════════════════
  // STREAMING: AI javob kelganda gaplar bo'yicha
  // ═══════════════════════════════════════════
  feedChunk(text: string) {
    if (!this.ttsEnabled) return;
    this.streamBuffer += text;

    // Gap tugashini kutamiz: . ! ? … \n
    // Va gap kamida 20 belgi bo'lishi kerak (qisqa bo'laklar chalkash bo'ladi)
    while (true) {
      const m = this.streamBuffer.match(/^([\s\S]*?[.!?…])(?:\s+|$)/);
      if (!m) break;
      const sentence = m[1].trim();
      this.streamBuffer = this.streamBuffer.slice(m[0].length);

      // Juda qisqa bo'laklarni birlashtirish uchun buffer'da qoldiramiz
      if (sentence.length >= 15) {
        this.enqueue(sentence);
      } else {
        this.streamBuffer = sentence + ' ' + this.streamBuffer;
        break;
      }
    }
  }

  flushPending() {
    if (!this.ttsEnabled) return;
    const rest = this.streamBuffer.trim();
    this.streamBuffer = '';
    if (rest) this.enqueue(rest);
  }

  /**
   * Yagona navbatga qo'shish — ketma-ket bajariladi.
   */
  private enqueue(text: string) {
    const clean = this.clean(text);
    if (!clean) return;

    this.speakingQueue = this.speakingQueue
      .then(() => this.speakOne(clean))
      .catch((e) => console.warn('[voice] navbat xato:', e));
  }

  private async speakOne(text: string): Promise<void> {
    if (this.stopFlag) return;
    const blob = await this.fetchAudio(text);

    if (blob && !this.stopFlag) {
      // Cloud TTS ishladi
      await this.playBlob(blob);
    } else if (!this.stopFlag) {
      // Cloud ishlamadi — brauzer TTS
      await this.speakBrowser(text);
    }
  }

  /**
   * To'g'ridan-to'g'ri o'qish — butun matn.
   * Faqat "test" uchun ishlatiladi (voice tanlash).
   */
  async speak(text: string) {
    if (!this.ttsEnabled) return;

    // Avvalgisini to'xtatish
    this.stopSpeaking();
    this.stopFlag = false;
    this.streamBuffer = '';
    this.speakingQueue = Promise.resolve();

    const clean = this.clean(text);
    if (!clean) return;

    // Gaplarga bo'lish
    const sentences = this.splitLongText(clean);
    for (const s of sentences) {
      if (this.stopFlag) break;
      this.enqueue(s);
    }

    // Navbat tugashini kutish
    await this.speakingQueue;
  }

  /**
   * Uzun matnni 150 belgidan bo'laklarga bo'lish.
   */
  private splitLongText(text: string): string[] {
    const sentences = text.split(/(?<=[.!?…])\s+/);
    const chunks: string[] = [];
    let cur = '';
    for (const s of sentences) {
      if ((cur + ' ' + s).length > 150 && cur) {
        chunks.push(cur);
        cur = s;
      } else {
        cur = cur ? cur + ' ' + s : s;
      }
    }
    if (cur) chunks.push(cur);
    return chunks.filter((s) => s.trim().length > 0);
  }

  // ═══════════════════════════════════════════
  // MATN TOZALASH — TTS uchun
  // ═══════════════════════════════════════════
  private clean(text: string): string {
    let s = text;

    // Markdown
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
    s = s.replace(/\*([^*]+)\*/g, '$1');
    s = s.replace(/__([^_]+)__/g, '$1');
    s = s.replace(/_([^_]+)_/g, '$1');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/```[\s\S]*?```/g, ' ');
    s = s.replace(/#{1,6}\s+/g, '');

    // LaTeX formulalar
    s = s.replace(/\$\$[^$]*\$\$/g, ' ');
    s = s.replace(/\$[^$]*\$/g, ' ');

    // Emoji
    s = s.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    s = s.replace(/[\u{2600}-\u{27BF}]/gu, '');

    // Maxsus belgilar
    s = s.replace(/[→←↑↓⇒⇐⇔]/g, ' ');
    s = s.replace(/[•·●○◆■□▪▫]/g, ' ');
    s = s.replace(/[│┃┆┇┊┋]/g, ' ');
    s = s.replace(/[=+<>~^|\\]/g, ' ');
    s = s.replace(/[[\]{}()]/g, ' ');
    s = s.replace(/[#@&%$]/g, ' ');
    s = s.replace(/[""'']/g, '');

    // Raqamlarni o'qish
    s = s.replace(/(\d)[.,](\d)/g, '$1 vergul $2');
    s = s.replace(/(\d)\s*km\b/g, '$1 kilometr');
    s = s.replace(/(\d)\s*kg\b/g, '$1 kilogramm');
    s = s.replace(/(\d)\s*mln\b/gi, '$1 million');
    s = s.replace(/(\d)\s*mlrd\b/gi, '$1 milliard');
    s = s.replace(/(\d)\s*AU\b/g, '$1 astronomik birlik');

    // Ko'p bo'sh joy
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  }

  // ═══════════════════════════════════════════
  // AUDIO
  // ═══════════════════════════════════════════
  private async fetchAudio(text: string): Promise<Blob | null> {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: this.currentVoice }),
      });
      if (res.status === 204) {
        console.log("[voice] Cloud TTS yo'q — brauzer fallback");
        return null;
      }
      if (!res.ok) {
        console.warn(`[voice] TTS ${res.status}`);
        return null;
      }
      return await res.blob();
    } catch (e) {
      console.warn('[voice] fetch xato:', e);
      return null;
    }
  }

  // ═══════════════════════════════════════
  // BRAUZER TTS — fallback
  // ═══════════════════════════════════════
  private speakBrowser(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);

      // Ovoz tanlash: uz → tr → ru → en
      const voices = window.speechSynthesis.getVoices();
      const lang = this.currentVoice.split('-')[0].toLowerCase();

      // To'g'ridan-to'g'ri mos ovoz
      let voice = voices.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(lang),
      );

      // O'zbek bo'lmasa — turk, keyin rus
      if (!voice && lang === 'uz') {
        voice =
          voices.find((v) => v.lang.toLowerCase().startsWith('tr')) ??
          voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ??
          voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      }

      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
        console.log(`[voice] Brauzer: ${voice.lang} (${voice.name})`);
      }

      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      utter.onend = () => resolve();
      utter.onerror = () => resolve();

      window.speechSynthesis.speak(utter);
    });
  }

  private playBlob(blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.audioQueue.push(audio);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this.audioQueue = this.audioQueue.filter((a) => a !== audio);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.play().catch(() => resolve());
    });
  }

  stopSpeaking() {
    this.stopFlag = true;
    this.streamBuffer = '';
    this.speakingQueue = Promise.resolve();
    for (const a of this.audioQueue) {
      a.pause();
      a.src = '';
    }
    this.audioQueue = [];
  }

  isSpeaking(): boolean {
    return this.audioQueue.length > 0;
  }

  // ═══════════════════════════════════════════
  // STT
  // ═══════════════════════════════════════════
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  isListening(): boolean {
    return this.listening;
  }

  startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (err: string) => void,
  ) {
    if (!this.isSupported()) {
      onError("Brauzer ovozni tanishni qo'llab-quvvatlamaydi");
      return;
    }
    if (this.listening) return;

    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SR) {
      onError('SpeechRecognition topilmadi');
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'uz-UZ';

    this.recognition.onresult = (e: SpeechRecognitionEvent) => {
      const last = e.results[e.results.length - 1];
      onResult(last[0].transcript, last.isFinal);
    };
    this.recognition.onend = () => {
      this.listening = false;
      onEnd();
    };
    this.recognition.onerror = (e: Event) => {
      const err = (e as SpeechRecognitionErrorEvent).error;
      this.listening = false;
      onError(err);
    };

    try {
      this.recognition.start();
      this.listening = true;
    } catch (e) {
      onError(String(e));
    }
  }

  stopListening() {
    if (this.recognition && this.listening) {
      this.recognition.stop();
      this.listening = false;
    }
  }
}