/**
 * Keyword-based vector memory.
 * Embedding yo'q, lekin faktlar samarali eslab qolinadi.
 */

export interface MemoryFact {
  id: string;
  text: string;
  keywords: string[];
  category: string;
  weight: number;   // muhimlik darajasi (1-5)
  createdAt: number;
  lastUsedAt: number;
}

const KEY_FACTS = 'kosmos_memory_facts_v1';
const MAX_FACTS = 100;

// O'zbek + rus + ingliz to'xtash so'zlari
const STOP_WORDS = new Set([
  'va', 'u', 'bu', 'shu', 'bir', 'men', 'sen', 'biz', 'siz', 'ular',
  'ha', 'yoq', "yo'q", 'lekin', 'ammo', 'yoki', 'agar', 'bilan', 'uchun',
  'haqida', 'kerak', 'mumkin', 'edi', 'ekan', 'boladi', "bo'ladi",
  'man', 'san', 'miz', 'siz', 'lar', 'ler', 'da', 'dan', 'ga', 'ni',
  'and', 'or', 'the', 'a', 'is', 'are', 'of', 'to', 'in', 'on', 'for',
  'и', 'в', 'на', 'с', 'по', 'из', 'к', 'от', 'не', 'это',
]);

function extractKeywords(text: string): string[] {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\u0400-\u04FF\u0600-\u06FF\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return [...new Set(clean)];
}

export class MemoryStore {
  private facts: MemoryFact[] = [];

  constructor() {
    try {
      this.facts = JSON.parse(localStorage.getItem(KEY_FACTS) ?? '[]');
    } catch {
      this.facts = [];
    }
    console.log(`[memory] ${this.facts.length} fakt`);
  }

  private save() {
    localStorage.setItem(KEY_FACTS, JSON.stringify(this.facts));
  }

  /**
   * Yangi fakt qo'shish yoki mavjudini yangilash.
   */
  addFact(
    text: string,
    category: string,
    weight = 3,
  ): void {
    const trimmed = text.trim().slice(0, 200);
    if (!trimmed || trimmed.length < 5) return;

    const keywords = extractKeywords(trimmed);

    // Bir xil faktni tekshirish (keyword overlap > 70%)
    const existing = this.facts.find((f) => {
      const overlap = f.keywords.filter((k) => keywords.includes(k)).length;
      const ratio = overlap / Math.max(f.keywords.length, keywords.length);
      return ratio > 0.7;
    });

    if (existing) {
      existing.lastUsedAt = Date.now();
      existing.weight = Math.max(existing.weight, weight);
      this.save();
      return;
    }

    const fact: MemoryFact = {
      id: crypto.randomUUID(),
      text: trimmed,
      keywords,
      category,
      weight,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    this.facts.push(fact);

    // Limit — eng eski, kam ishlatilganlarini o'chirish
    if (this.facts.length > MAX_FACTS) {
      this.facts.sort((a, b) => {
        const scoreA = a.weight * 1000 - (Date.now() - a.lastUsedAt) / 86400_000;
        const scoreB = b.weight * 1000 - (Date.now() - b.lastUsedAt) / 86400_000;
        return scoreB - scoreA;
      });
      this.facts = this.facts.slice(0, MAX_FACTS);
    }

    this.save();
    console.log(`[memory] Fakt qo'shildi: ${trimmed.slice(0, 50)}...`);
  }

  /**
   * Savolga eng mos faktlarni topish.
   */
  search(query: string, limit = 5): MemoryFact[] {
    const qKeywords = extractKeywords(query);
    if (qKeywords.length === 0) return [];

    const scored = this.facts.map((f) => {
      const overlap = f.keywords.filter((k) =>
        qKeywords.some((qk) => qk.includes(k) || k.includes(qk)),
      ).length;

      const score =
        overlap * 10 +
        f.weight * 2 +
        Math.max(0, 5 - (Date.now() - f.lastUsedAt) / 86400_000 / 10);

      return { fact: f, score };
    });

    return scored
      .filter((s) => s.score > 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => {
        s.fact.lastUsedAt = Date.now();
        return s.fact;
      });
  }

  /**
   * Faktni olib tashlash.
   */
  removeFact(id: string) {
    this.facts = this.facts.filter((f) => f.id !== id);
    this.save();
  }

  clear() {
    this.facts = [];
    this.save();
  }

  getAll(): MemoryFact[] {
    return [...this.facts];
  }

  /**
   * AI prompt uchun kontekst.
   */
  buildContext(query: string): string {
    const relevant = this.search(query, 5);
    if (relevant.length === 0) return '';

    const lines = relevant.map(
      (f) => `- [${f.category}] ${f.text}`,
    );
    return `Foydalanuvchi haqida ma'lum faktlar (eslab qol):\n${lines.join('\n')}`;
  }

  /**
   * Chat matnidan avtomatik fakt ajratib olish.
   * "Men X man" / "Menga Y yoqadi" / "Men Z bilan shug'ullanaman"
   */
  autoExtract(message: string): void {
    const lower = message.toLowerCase();

    // Shaxsiy faktlar
    const patterns: { regex: RegExp; category: string; weight: number }[] = [
      { regex: /men\s+(\d{1,2})\s*(yosh|da)\b/i, category: 'yosh', weight: 5 },
      { regex: /men\s+(talaba|o[''`]?quvchi|maktab|o[''`]?qituvchi|olim|dasturchi|injener|shifokor)/i, category: 'kasb', weight: 5 },
      { regex: /men\s+([a-z\u0400-\u04FF\u0600-\u06FF\s]{3,30})(?:da|shahrida)?\s+(yashayman|turaman)/i, category: 'joylashuv', weight: 4 },
      { regex: /menga\s+([a-z\u0400-\u04FF\u0600-\u06FF\s]{3,30})\s+yoqadi/i, category: 'qiziqish', weight: 4 },
      { regex: /men\s+(astronomiya|fizika|matematika|kosmos|koinot|yulduz)/i, category: 'qiziqish', weight: 4 },
      { regex: /mening\s+ismim\s+([A-Za-z\u0400-\u04FF\u0600-\u06FF']{2,20})/i, category: 'ism', weight: 5 },
    ];

    for (const p of patterns) {
      const m = message.match(p.regex);
      if (m) {
        this.addFact(m[0].trim(), p.category, p.weight);
      }
    }
  }
}