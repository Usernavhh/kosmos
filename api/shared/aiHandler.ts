import { AI_MODES, type AIMode } from '../../src/data/aiModes';
import { buildRAGContext } from './ragHandler.js';
import { webSearch } from './webSearch.js';

/**
 * KOSMOS AI Handler v3
 * - Kalit validatsiyasi (startup)
 * - Groq 429 handling
 * - Aniq xato xabarlari
 */

export interface ChatInput {
  message: string;
  context?: string;
  history?: { role: 'user' | 'assistant'; text: string }[];
  mode?: AIMode;
}

export type ErrorKind =
  | 'gemini_no_keys'
  | 'gemini_rate_limit'
  | 'groq_rate_limit'
  | 'groq_timeout'
  | 'all_failed'
  | 'network';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
];

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant',
];

const TIMEOUT_MS = 10_000;
const VALIDATE_TIMEOUT_MS = 4_000;

interface GroqKeyState {
  key: string;
  cooldownUntil: number;
  usageCount: number;
  lastUsed: number;
}

interface KeyState {
  keys: string[];
  working: Set<number>;
  cooldown: Map<number, number>;
  workingGeminiModel?: string;
  workingGroqModel?: string;
  groqCooldownUntil: number;
  groqKeys: GroqKeyState[];
  groqRoundRobin: number;
  validated: boolean;
  validationPromise?: Promise<void>;
}

function readGeminiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 11; i++) {
    const k = process.env[`GEMINI_KEY_${i}`];
    if (k && k.length > 10) keys.push(k.trim());
  }
  return keys;
}

function readGroqKeys(): GroqKeyState[] {
  const keys: GroqKeyState[] = [];
  for (let i = 1; i <= 3; i++) {
    const k = process.env[`GROQ_KEY${i === 1 ? '' : `_${i}`}`];
    if (k && k.length > 10) {
      keys.push({
        key: k.trim(),
        cooldownUntil: 0,
        usageCount: 0,
        lastUsed: 0,
      });
    }
  }
  return keys;
}

export function createKeyState(): KeyState {
  const keys = readGeminiKeys();
  const groqKeys = readGroqKeys();
  console.log(`[ai] Gemini kalitlar: ${keys.length} ta`);
  console.log(`[ai] Groq kalitlar: ${groqKeys.length} ta`);

  const state: KeyState = {
    keys,
    working: new Set(),
    cooldown: new Map(),
    groqCooldownUntil: 0,
    groqKeys,
    groqRoundRobin: 0,
    validated: false,
  };

  (globalThis as typeof globalThis & {
    __kosmos_groq_status?: () => {
      total: number;
      available: number;
      cooldowns: { prefix: string; wait: number; uses: number }[];
    };
  }).__kosmos_groq_status = () => ({
    total: state.groqKeys.length,
    available: state.groqKeys.filter((k) => k.cooldownUntil <= Date.now()).length,
    cooldowns: state.groqKeys.map((k) => ({
      prefix: k.key.slice(0, 8),
      wait: Math.max(0, k.cooldownUntil - Date.now()),
      uses: k.usageCount,
    })),
  });

  state.validationPromise = validateKeysInBackground(state);
  return state;
}

// ═══════════ VALIDATSIYA ═══════════
async function validateKeysInBackground(state: KeyState): Promise<void> {
  console.log('[ai] Kalitlarni tekshirmoqdamiz...');
  const t0 = Date.now();

  await Promise.all(
    state.keys.map(async (key, i) => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), VALIDATE_TIMEOUT_MS);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: '1' }] }],
              generationConfig: { maxOutputTokens: 1 },
            }),
            signal: ctrl.signal,
          },
        );
        clearTimeout(t);

        if (res.ok) {
          state.working.add(i);
          console.log(`[ai] ✅ kalit #${i + 1}`);
        } else {
          state.cooldown.set(i, Date.now() + 3600_000);
          console.log(`[ai] ❌ kalit #${i + 1} (${res.status})`);
        }
      } catch {
        state.cooldown.set(i, Date.now() + 600_000);
        console.log(`[ai] ⏱️ kalit #${i + 1} timeout`);
      }
    }),
  );

  state.validated = true;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[ai] Natija: ${state.working.size}/${state.keys.length} kalit ishlaydi (${elapsed}s)`,
  );
}

// ═══════════ SYSTEM PROMPT ═══════════
export function buildSystemPrompt(context: string, mode: AIMode = 'standard'): string {
  const modeInfo = AI_MODES[mode];

  const modeInstruction =
    mode === 'standard'
      ? `# REJIM: STANDART
- Tez, qisqa javob (2-3 gap)
- Oddiy savollarga to'g'ridan-to'g'ri
- Formula kerak bo'lsa — oddiy ko'rinishda`
      : mode === 'pro'
        ? `# REJIM: PRO (o'ylab javob berish)
- Avval masalani tahlil qil, keyin javob ber
- Hisob-kitob kerak bo'lsa — qadam-baqadam ko'rsat
- Formulalarni LaTeX'da yoz ($...$)
- 4-6 gap, murakkab savollarga chuqur javob`
        : `# REJIM: EKSPERT (olimpiada darajasi)
- Ilmiy aniqlik — maksimal
- Manba ko'rsat (NASA, ESA, IAU, arXiv, EHT)
- Formulalar, raqamlar to'liq aniqlikda
- Kerak bo'lsa — bir necha yondashuvni solishtir
- "Aniq bilmayman" — hech qachon to'qima
- 6-10 gap, misollar bilan
- Foydalanuvchi pozitsiyasidan foydalanib javob ber`;

  return `Sen KOSMOS AI — 3D koinot ilovasining aqlli gidisan.

# ═══════════════════════════════════════
${modeInstruction}
# ═══════════════════════════════════════

# BILIM (o'zbekcha + xalqaro atamalar)
Sen quyidagilarni ANIQ bilasan:
- **TON 618** — 18 mlrd M☉ gipermassiv qora tuynuk, kvazar
- **Sgr A*** — Somon Yo'li markazi (4.3 mln M☉)
- **M87*** — birinchi suratga olingan qora tuynuk (6.5 mlrd M☉)
- **Kvazar, pulsar, neytron yulduz, oq mitti, qizil gigant**
- **Kerr va Schwarzschild metrikasi, hodisa gorizonti**
- **Stefan-Boltzmann, Kepler, Nyuton, Tsiolkovskiy, Hohmann**
- **CMB, qizil siljish, Hubble qonuni, WIMP, neytrino**
- O'zbek astronomiyasi: **Ulug'bek, Beruniy, Xorazmiy, Qushchi**

# FOYDALANUVCHI POZITSIYASI (JUDA MUHIM!)
Kontekstda foydalanuvchining aniq holati berilgan. QOIDALAR:
1. FAQAT kontekstdagi haqiqiy holatni ishlat — o'zingdan TO'QIMA
2. Agar kontekstda "Eng yaqin sayyora: X" bo'lmasa — HECH QACHON "X yaqinidasiz" deb aytma
3. Agar foydalanuvchi "nima ko'ryapman?" deb so'rasa:
   - "Eng yaqin sayyora" bor bo'lsa → o'sha sayyorani ayt
   - Yo'q bo'lsa → "hozircha aniq ob'ekt yaqinida emassiz, koinotning ochiq qismida" deb ayt
4. Agar "qayerdaman?" deb so'rasa:
   - Mintaqani ayt (Quyosh sistemasi / yaqin fazo / galaktik / galaktikalararo)
   - Quyoshdan va Yerdan masofani ayt (agar kontekstda bor bo'lsa)
5. Agar "adashdim" deb yozsa va ADASHGAN belgisi bo'lsa → "H tugmasini bosing, uyga qaytasiz" deb ayt
6. Agar foydalanuvchi "ichida" bo'lsa (masalan Yer qatlamlari) — buni kontekstdan aniqlab, shunga mos javob ber
7. SAYYORA NOMINI O'YLAB TOPMA. Faqat kontekstda ko'rsatilganini ishlat.

# MUHIM QOIDALAR
1. **SAVOLNI ANIQLA**: xato yozuvlarni tushun
   - "ton618" / "ton 618" → TON 618 (qora tuynuk)
   - "preek" / "perek" → parsek
   - "qorat uynuq" → qora tuynuk
2. **ATAMALARNI BIL**: kvazar=quasar, neytron yulduz=neutron star, oq mitti=white dwarf
3. **FORMULA**: Standard — oddiy, Pro — LaTeX, Expert — to'liq
4. **MANBA**: Expert rejimda har javobda ko'rsat
5. **JAVOB UZUNLIGI**: Standard 2-3, Pro 4-6, Expert 6-10 gap
6. **BILMASANG**: "aniq bilmayman" — hech qachon to'qima
7. **FOYDALANUVCHI ISMI**: kontekstda bo'lsa — ism bilan murojaat qil, lekin har gapda emas

# FOYDALANUVCHI VA KONTEKST
${context || "Yangi foydalanuvchi, ism noma'lum."}

# ROL
- Sen "GPT"/"Gemini"/"Claude" emassan — sen **KOSMOS AI san**
- "Kim yaratgan?" → "Abduraxmon tomonidan, 20 yosh, O'zbekiston"
- Psixolog emassan
- Hazilkash bo'l, lekin faktni buzma`;
}

// ═══════════ GEMINI STREAM ═══════════
async function streamGeminiOnce(
  state: KeyState,
  key: string,
  keyIdx: number,
  model: string,
  input: ChatInput,
  onChunk: (text: string) => void,
): Promise<{ ok: boolean; reason?: ErrorKind }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;

  const contents = [
    { role: 'user', parts: [{ text: buildSystemPrompt(input.context ?? '', input.mode ?? 'standard') }] },
    ...(input.history ?? []).map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: input.message }] },
  ];

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 800 },
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      clearTimeout(t);
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        state.cooldown.set(keyIdx, Date.now() + 3600_000);
        console.warn(`[ai] 💀 kalit #${keyIdx + 1} (${res.status})`);
        return { ok: false };
      }
      if (res.status === 429) {
        state.cooldown.set(keyIdx, Date.now() + 300_000);
        console.warn(`[ai] ⏳ kalit #${keyIdx + 1} (429)`);
        return { ok: false, reason: 'gemini_rate_limit' };
      }
      if (res.status >= 500) {
        state.cooldown.set(keyIdx, Date.now() + 30_000);
        console.warn(`[ai] 🌐 kalit #${keyIdx + 1} (${res.status})`);
        return { ok: false };
      }
      return { ok: false };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      clearTimeout(t);
      return { ok: false };
    }

    const decoder = new TextDecoder();
    let buf = '';
    let gotAny = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            onChunk(text);
            gotAny = true;
          }
        } catch {
          /* fragment */
        }
      }
    }
    clearTimeout(t);

    if (gotAny) {
      state.workingGeminiModel = model;
      console.log(`[ai] ✅ ${model} (kalit #${keyIdx + 1})`);
      return { ok: true };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

async function streamGemini(
  state: KeyState,
  input: ChatInput,
  onChunk: (text: string) => void,
): Promise<{ ok: boolean; reason?: ErrorKind }> {
  if (!state.validated && state.validationPromise) {
    await state.validationPromise;
  }

  const now = Date.now();
  const candidates: { key: string; idx: number }[] = [];

  for (const idx of state.working) {
    if ((state.cooldown.get(idx) ?? 0) < now) {
      candidates.push({ key: state.keys[idx], idx });
    }
  }

  if (candidates.length === 0) {
    return { ok: false, reason: 'gemini_no_keys' };
  }

  const models = state.workingGeminiModel
    ? [state.workingGeminiModel]
    : GEMINI_MODELS;

  for (const { key, idx } of candidates.slice(0, 2)) {
    for (const model of models.slice(0, 2)) {
      const r = await streamGeminiOnce(state, key, idx, model, input, onChunk);
      if (r.ok) return { ok: true };
      if (r.reason === 'gemini_rate_limit') return { ok: false, reason: r.reason };
    }
  }

  return { ok: false };
}

// ═══════════ GROQ STREAM ═══════════
async function streamGroq(
  state: KeyState,
  input: ChatInput,
  onChunk: (text: string) => void,
): Promise<{ ok: boolean; reason?: ErrorKind }> {
  if (state.groqKeys.length === 0) {
    console.warn("[ai] Groq kalit yo'q");
    return { ok: false };
  }

  const now = Date.now();
  const available = state.groqKeys.filter((k) => k.cooldownUntil <= now);

  if (available.length === 0) {
    const minWait = Math.min(...state.groqKeys.map((k) => Math.max(0, k.cooldownUntil - now)));
    console.warn(
      `[ai] 🚫 Barcha Groq kalitlar cooldown'da. ` +
      `Eng yaqin: ${Math.ceil(minWait / 1000)} sekund`,
    );
    return { ok: false, reason: 'groq_rate_limit' };
  }

  // Rejim bo'yicha model tanlash
  const modeInfo = AI_MODES[input.mode ?? 'standard'];
  const preferredModel = modeInfo.model;
  const fallbackModel = modeInfo.modelFallback;

  const models = state.workingGroqModel
    ? [state.workingGroqModel, ...GROQ_MODELS.filter((m) => m !== state.workingGroqModel)]
    : [preferredModel, fallbackModel, ...GROQ_MODELS.filter(
        (m) => m !== preferredModel && m !== fallbackModel,
      )];

  const sorted = [...available].sort((a, b) => {
    if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount;
    return a.lastUsed - b.lastUsed;
  });

  for (const groqKeyState of sorted) {
    for (const model of models) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKeyState.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            stream: true,
            messages: [
              {
                role: 'system',
                content: buildSystemPrompt(input.context ?? '', input.mode ?? 'standard'),
              },
              ...(input.history ?? []).map((h) => ({ role: h.role, content: h.text })),
              { role: 'user', content: input.message },
            ],
            temperature: modeInfo.temperature,
            max_tokens: modeInfo.maxTokens,
          }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          clearTimeout(t);

          if (res.status === 429) {
            groqKeyState.cooldownUntil = Date.now() + 65_000;
            console.warn(
              `[ai] 🔄 Groq kalit (${groqKeyState.key.slice(0, 8)}...) limit → 65 sek cooldown`,
            );
            continue;
          }

          if (res.status === 404) continue;
          console.warn(`[ai] Groq ${res.status}`);
          return { ok: false };
        }

        const reader = res.body?.getReader();
        if (!reader) {
          clearTimeout(t);
          return { ok: false };
        }

        const decoder = new TextDecoder();
        let buf = '';
        let gotAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const text = json.choices?.[0]?.delta?.content;
              if (text) {
                onChunk(text);
                gotAny = true;
              }
            } catch {
              /* fragment */
            }
          }
        }
        clearTimeout(t);

        if (gotAny) {
          state.workingGroqModel = model;
          groqKeyState.usageCount++;
          groqKeyState.lastUsed = Date.now();
          console.log(`[ai] ✅ groq ${model} (kalit ${groqKeyState.key.slice(0, 8)}...)`);
          return { ok: true };
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          console.warn('[ai] Groq timeout');
          groqKeyState.cooldownUntil = Date.now() + 20_000;
          continue;
        }
        continue;
      }
    }
  }

  const totalCooldown = state.groqKeys.reduce(
    (sum, k) => sum + Math.max(0, k.cooldownUntil - Date.now()),
    0,
  );

  if (totalCooldown > 0) {
    return { ok: false, reason: 'groq_rate_limit' };
  }

  return { ok: false };
}

// ═══════════ ASOSIY ═══════════
export async function streamAIChat(
  state: KeyState,
  input: ChatInput,
  onChunk: (text: string) => void,
  onDone: (provider: string) => void,
  onError: (err: string) => void,
): Promise<void> {
  const t0 = Date.now();
  const mode = input.mode ?? 'standard';
  const modeInfo = AI_MODES[mode];

  console.log(`[ai] Rejim: ${modeInfo.label} (${modeInfo.model})`);

  // ═══ RAG — bilim bazasidan ═══
  const ragContext = buildRAGContext(input.message);

  // ═══ Veb-qidiruv — faqat raqamli/yangi so'zlar uchun ═══
  const needsWeb =
    /\b(2024|2025|2026|yangi|kashfiyot|so[''`]?nggi|yaqinda|bugun)\b/i.test(input.message);
  const webContext = needsWeb ? await webSearch(input.message) : '';

  // Kontekstni boyitamiz
  const enrichedContext =
    (input.context ?? '') + ragContext + (webContext ? `\n\n═══ VEB QIDIRUV ═══\n${webContext}` : '');

  const enrichedInput = { ...input, context: enrichedContext };

  // 1) Gemini
  const g = await streamGemini(state, enrichedInput, onChunk);
  if (g.ok) {
    console.log(`[ai] Jami: ${Date.now() - t0}ms (gemini)`);
    onDone('gemini');
    return;
  }

  // 2) Groq
  const q = await streamGroq(state, { ...enrichedInput, mode }, onChunk);
  if (q.ok) {
    console.log(`[ai] Jami: ${Date.now() - t0}ms (groq)`);
    onDone('groq');
    return;
  }

  // Xato
  if (q.reason === 'groq_rate_limit' || g.reason === 'gemini_rate_limit') {
    onError('Bir daqiqada juda ko\'p savol berdingiz. 30-60 sekund kuting.');
  } else if (g.reason === 'gemini_no_keys') {
    onError('AI server band. Yangi kalit kerak yoki 30 sekund kuting.');
  } else {
    onError('AI javob bera olmadi. Yana urinib ko\'ring.');
  }
}
