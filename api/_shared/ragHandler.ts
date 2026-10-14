import { KNOWLEDGE, type KnowledgeEntry } from './knowledge';

const STOP_WORDS = new Set([
  'va', 'u', 'bu', 'bir', 'men', 'sen', 'ha', 'yoq', 'lekin', 'yoki',
  'haqida', 'kerak', 'mumkin', 'edi', 'ekan', 'nima', 'qanday', 'nima uchun',
  'and', 'or', 'the', 'a', 'is', 'of', 'to', 'in', 'on', 'for', 'what', 'how',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\u0400-\u04FF\u0600-\u06FF\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

export function retrieveKnowledge(query: string, limit = 3): KnowledgeEntry[] {
  const qWords = tokenize(query);
  if (qWords.length === 0) return [];

  const scored = KNOWLEDGE.map((entry) => {
    const entryText = (entry.q + ' ' + entry.a + ' ' + entry.tags.join(' ')).toLowerCase();
    const entryWords = new Set([...tokenize(entryText), ...entry.tags.map((t) => t.toLowerCase())]);

    let overlap = 0;
    for (const qw of qWords) {
      for (const ew of entryWords) {
        if (ew.includes(qw) || qw.includes(ew)) {
          overlap++;
          break;
        }
      }
    }

    const score = overlap * 10 / Math.max(qWords.length, 1);
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

export function buildRAGContext(query: string): string {
  const relevant = retrieveKnowledge(query, 3);
  if (relevant.length === 0) return '';

  const parts = relevant.map(
    (e) => `📌 ${e.q}: ${e.a}${e.source ? ` [Manba: ${e.source}]` : ''}`,
  );

  return `\n\n═══ ISHONCHLI MA'LUMOTLAR (ishlatish shart!) ═══\n${parts.join('\n\n')}\n\nQOIDA: Yuqoridagi ma'lumotlardan foydalan. Agar savolga javob bu ma'lumotlarda bo'lmasa — boshqa manbaga ishonma, "aniq bilmayman" deb ayt.`;
}