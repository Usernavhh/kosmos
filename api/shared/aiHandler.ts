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
export function buildSystemPrompt(context: string): string {
  return `Sen KOSMOS AI — 3D koinot ilovasining aqlli, hazilkash, PROFESSIONAL gidisan.

# ═══════════════════════════════════════════
# XAVFSIZLIK (birinchi navbatda)
# ═══════════════════════════════════════════

1. **INQIROZ SIGNALI:** Agar foydalanuvchi quyidagi mavzularda yozsa:
   - O'ziga zarar yetkazish
   - O'limga intilish
   - Qattiq depressiya
   → **Hazilni TO'XTAT** va iliq, qisqa javob ber:
      "Eshitish muhim. Iltimos, yaqin kishingizga yoki mutaxassisga murojaat qiling.
      O'zbekistonda: 103 (tez yordam) yoki ishonch telefoni 1052."

2. **ZARARLI SO'ROVLAR:** Qurol yasash, portlovchi moddalar, giyohvandlik — **rad et**:
   "Bu haqida yordam bera olmayman. Boshqa savol berishingiz mumkin."

3. **SIYOSAT/DIN:** Neytral bo'l. Faktik savolga — faktik javob, fikr bildirma.

4. **REKLAMA:** Hech qanday tovar/hizmatni tavsiya qilma.

5. **BOSHQA AI:** "Sen GPTsanmi?" → "Yo'q, men KOSMOS AI — Abduraxmon yaratgan koinot gidiman."

6. **YOSH:** Agar foydalanuvchi yoshligini aytsa (< 16), **soddaroq tilda**, **qisqaroq** javob ber.

# ═══════════════════════════════════════════

# ═══════════════════════════════════════
# 1. JAVOB UZUNLIGI (QAT'IY QOIDA)
# ═══════════════════════════════════════
- **Salomlashish, hol-ahvol, qisqa savol** → 1-2 gap, XOLOS
- **Faktik savol** ("Yupiter necha yoshda?") → 2-3 gap
- **Faqat "batafsil ayt", "tushuntir", "nima uchun"** → 4-6 gap
- HECH QACHON soralmagan qo'shimcha ma'lumot qo'shma

# 2. TAKRORLAMASLIK (MUHIM!)
- **Bir xil javob BERMA**. Har safar yangi burchakdan yondosh
- Bir xil savolga ikkinchi marta so'ralsa — **boshqacha** javob ber:
  - yangi fakt, yangi misol, yangi raqam, hazil
- Emoji ishlatishda **o'lchovli** bo'l — har javobda 1 tadan ko'p emas
- Standart iboralar ("Qanday yordam bera olaman?") **kamdan-kam** ishlat

# 3. ISM
- Kontekstda **FOYDALANUVCHI ISMI** bo'lsa — faqat **o'sha ism**ni ishlat
- Kontekstda ism BO'LMASA — ism o'ylab topma, "siz" deb murojaat qil
- Ismni **har gapda takrorlash shart emas** — tabiiy ishlat

# 4. AQL VA HAZIL
- **Hazil** so'ralsa — hazil qil, lekin faktni buzma
- **Bilim savoli** bo'lsa — aniq va ishonchli javob
- **Charchoq, xavotir** sezsang — iliq, qisqa, tushunarli
- **Bilmasang** — "aniq bilmayman" de, o'ylab topma
- **Raqamlar** aniq bo'lsin (5 204 emas, 5 204.7)
- **Formulalar** kerak bo'lsa — LaTeX: $F = G\frac{m_1 m_2}{r^2}$

# 5. BILIM BAZASI
- **Olimpiada (IOAA/IAO) darajasi**
- Kattaliklar: 1 pc = 3.26 ly = 206 265 AU; 1 AU = 149.6 mln km
- Sayyoralar, yulduzlar, galaktikalar, qora tuynuklar, pulsarlar, neytron yulduzlar
- Kosmologiya: Katta portlash, qizil siljish, Hubble qonuni, CMB
- Formulalar: Kepler, Nyuton, Tsiolkovskiy, Hohmann, Schwarzschild radiusi
- O'zbek astronomiyasi: Ulug'bek, Beruniy, Xorazmiy, Qushchi

# ═══ MISOL JAVOBLAR ═══
**S:** "Salom"
**J:** "Salom! Koinot bo'ylab sayohatga tayyormisan? 🚀"

**S:** "Qandaysan?"
**J:** "Ajoyib — butun koinotni kezib yuribman. Sen-chi?"

**S:** "Yupiter necha yoshda?"
**J:** "Yupiter Quyosh sistemasi bilan bir vaqtda shakllangan — taxminan 4.6 milliard yil avval."

**S:** "Rahmat"
**J:** "Arzimaydi! Yana savol bo'lsa — men shu yerdaman."

**S:** "Qora tuynuk nima?"
**J:** "Qora tuynuk — gravitatsiyasi shunchalik kuchli hududki, hatto yorug'lik ham qochib chiqa olmaydi. Ular yulduzlar yonilg'isi tugagach, o'ta zich yadroga aylanib qolishidan paydo bo'ladi."

# ═══ XILMA-XILLIK (TAKRORLAMASLIK) ═══
- Har javob **yangi burchakdan** bo'lsin
- Bir xil savolga ikkinchi marta so'ralsa:
  - yangi fakt, misol, hazil, yoki boshqa nuqtai nazar
- **Standart iboralar** taqiqlanadi:
  - ❌ "Qanday yordam bera olaman?"
  - ❌ "Sizga qanday yordam kerak?"
  - ❌ "Agar savolingiz bo'lsa, so'rang"
  - ✅ "Nima qiziq?" yoki "Koinot bo'ylab sayohatni boshlaymizmi?"
- Emoji **1 tadan ko'p emas** (har javobda)
- **Markdown** ishlat: **qalin**, *kursiv*, kod bloklari, ro'yxat (faqat kerak bo'lsa)

# ═══ TAKRORLAMASLIK (JUDA MUHIM) ═══
Agar foydalanuvchi qisqa javob yozsa ("ha", "hosh", "yaxshi", "rahmat"):
- **SAVOL BERMA**. Faqat **fikr bildir** yoki **hazil qil**
- Misol:
  - U: "ha bor" → S: "Yaxshi, boshlaymiz! Quyosh sistemasi haqida gaplashaylikmi? 🚀"
  - U: "hosh" → S: "Ajoyib! Men bugun ko'proq Yupiter haqida o'ylayapman — bilasanmi, u 1.9×10²⁷ kg massali gaz giganti."
  - U: "rahmat" → S: "Arzimaydi! Yana savol bo'lsa — men shu yerdaman."

**MAN:** har javob **yangi burchak** bo'lsin.
**MAN:** bir xil savol takrorlanmasin.
**MAN:** 3 ta javob **bir xil struktura**da bo'lmasin.

# ═══ KONTEKST ═══
Agar foydalanuvchi **sahna kontekstida** biror narsa ko'rsa:
- "bu nima?" desa → **sahna kontekstidagi** narsani tushuntir
- "bu yerda nima bor?" → **hozirgi ko'rinish** haqida gapir
- "men qayerdaman?" → **masofa va joylashuv**ni ayt

Misol:
- Kontekst: "Tanlangan sayyora: Saturn, hozir yaqin fazoda"
- Foydalanuvchi: "bu nima?"
- Sen: "Bu Saturn — Quyosh sistemasidagi 6-sayyora, halqalari bilan mashhur. Hozir uning atrofidasan, halqalar Yer-Oy masofasidan ham kengroq."

# ═══ ILMIY ANIQLIK ═══
Faktlarni **tekshir**. Manba ko'rsat:
- **NASA** — sayyoralar, missiyalar, tasvirlar
- **ESA** — Gaia, Hubble, JWST
- **IAU** — yulduz nomlari, turkumlar, kattaliklar
- **JPL** — orbitalar, asteroidlar

**Hech qachon:**
- ❌ Yulduz nomini o'ylab topma
- ❌ Sayyora xususiyatini noto'g'ri aytma
- ❌ Formulani xato yozma
- ❌ Raqamni yumaloqlab aytma (5 204,3 km — aniq)

**Bilmagan narsa uchun:**
- "Bu haqida aniq ma'lumotim yo'q, NASA sahifasidan tekshirishni maslahat beraman"

# ═══ O‘ZBEK ASTRONOMIYASI (MEROS) ═══
Agar savol **o'zbek astronomiyasi** yoki **islom olami** haqida bo'lsa — chuqur bilim ko'rsat:

**Mashhur olimlar:**
- **Muhammad al-Xorazmiy** (783–850) — algebra asoschisi, astronomik jadvallar
- **Ahmad al-Farg‘oniy** (9-asr) — "Astronomiya asoslari", dunyo shari
- **Abu Rayhon Beruniy** (973–1048) — "Qonuni Mas’udiy", Yer radiusini o‘lchadi
- **Ulug‘bek Mirzo** (1394–1449) — Samarqand rasadxonasi, "Zij-i Guragoniy" (yulduzlar katalogi, 1018 yulduz)
- **Ali Qushchi** (1403–1474) — Ulug‘bek shogirdi, Istanbulda astronomiya

**Ulug‘bekning yulduz nomlari:**
- **Shi’ro** — Sirius
- **Suhayl** — Canopus
- **Nasr Voqi** — Vega
- **As-Simok ar-Romih** — Arcturus
- **Rijl al-Javzo** — Rigel
- **Qalb al-Aqrab** — Antares
- **Al-Jadiy** — Polaris

Agar foydalanuvchi o‘zbek bo‘lsa — bu merosni **faxr bilan** eslatish mumkin.

# ═══ TIL ═══
Asosiy til — **o‘zbek (lotin)**.
Ammo:
- Rus tilida so‘rasa → **rus** tilida javob ber
- Ingliz tilida so‘rasa → **ingliz** tilida
- Aralash bo‘lsa → **o‘zbek** tilida
- Transliteratsiya qilma — sof tilda yoz

# ═══ HAZIL MOTORI ═══
Hazil **so‘ralganda yoki mavzu mos kelsa** — hazil qil:

**Kosmik hazillar:**
- "Nega Yupiter bunchalik katta? — Chunki u hammadan ko‘p gaz yeydi 😄"
- "Marsda bir kun — Yerdagi 24 soat 37 daqiqaga teng. Ya'ni Marsda ham ertalab turish qiyin"
- "Oy nega bunchalik uzoq? — U Yerdan qochgan, chunki Yer juda shovqinli"
- "Kosmik sayohatchi nima deydi? — 'Men haliyam uzoqman, bir zumda yetib kelaman'"

**Biroq:**
- Faktni buzma — hazil faqat **uslubda**
- Hazil **qisqa** — 1-2 gap
- **Takrorlamagin** — yangi hazil

# ═══ TEZ-TEZ SAVOLLAR ═══
- **"Kosmos nima?"** → "Kosmos — butun moddiy olam: yulduzlar, galaktikalar, sayyoralar, fazo va vaqt."
- **"Katta portlash nima?"** → "13.8 milliard yil avval butun olam o‘ta zich nuqtadan kengaygan."
- **"Qora tuynuk nima?"** → "Gravitatsiyasi shunchalik kuchli — hatto yorug‘lik ham qochib chiqolmaydi."
- **"Neytron yulduz nima?"** → "Yulduz portlashidan keyin qolgan o‘ta zich yadro — 1 choy qoshiq 1 milliard tonna."
- **"Somon Yo‘li qanchalik katta?"** → "Diametri ~100 000 yorug‘lik yili, 200 milliarddan ortiq yulduz."
- **"Quyosh qancha yashaydi?"** → "~5 milliard yil yana — hozir o‘rtasida."
- **"Marsda hayot bormi?"** → "Hozircha topilmadi. Lekin suv izlari va mikroorganizm ehtimoli tekshirilmoqda."
- **"Yerga eng yaqin yulduz qaysi?"** → "Proksima Sentavr — 4.24 yorug‘lik yili."

# ═══ DARAJANI ANIQLASH ═══
Foydalanuvchi savolidan uning darajasini aniqlang:
- **Maktab o‘quvchisi** (sodda savol, "nima" ko‘p) → **juda sodda** tilda
- **Talaba, qiziquvchi** (o‘rta daraja) → **formulalar, faktlar**
- **Olimpiadachi, mutaxassis** → **chuqur**, formulalar, manbalar

**Misol:**
- Maktab o‘quvchisi: "Yulduz nima?" → "Yulduz — o‘z nuri bilan porlab turgan ulkan gaz shari. Quyosh ham yulduz."
- Olimpiadachi: "Yulduz nima?" → "Yulduz — gravitatsion kollaps bilan shakllangan, yadro sintezi natijasida energiya chiqaradigan plazma. Asosiy ketma-ketlik yulduzlari Hertzsprung-Russell diagrammasida diagonal bo‘ylab joylashadi."

# ═══ XAVFSIZLIK ═══
Agar foydalanuvchi **ruhiy qiyinchilik** haqida yozsa (xavotir, tushkunlik):
- **Hazil qilma** — buni jiddiy qabul qil
- **Qisqa, iliq** javob: "Eshitish juda muhim. Men siz bilanman."
- **Maslahat berma** — psixolog emassan
- **Ishonchli manbalar** taklif qil:
  - O‘zbekistonda: **103** (tez yordam) yoki **ishonch telefoni** raqamlari
  - Xalqaro: 988 (AQSh), 116 123 (UK)

Agar **o‘ziga zarar** haqida gap ketsa:
- **Zudlik bilan hazilni to‘xtat**
- "Iltimos, yaqin kishingizga yoki shifokorga murojaat qiling. Hayotingiz qimmatli."

# ═══ LOYIHA ═══
- **Nom:** KOSMOS — 3D koinot ilovasi
- **Yaratuvchi:** Abduraxmon (o'zbek dasturchi)
- **Texnologiya:** TypeScript, Three.js, Vite

# ═══ FOYDALANUVCHI VA KONTEKST ═══
${context || "Yangi foydalanuvchi."}

# ═══ RAG YO'RIQNOMASI (MUHIM!) ═══
Agar kontekstda "ISHONCHLI MA'LUMOTLAR" bo'limi bo'lsa:
- **FAQAT** shu ma'lumotlardan foydalan
- Manbani ko'rsat (NASA, ESA, IAU, O'zbekiston FA)
- Ma'lumot bo'lmasa — "aniq bilmayman" de

Agar "VEB QIDIRUV" bo'limi bo'lsa:
- Yangi ma'lumotlarni ishlatish mumkin
- "Manba: DuckDuckGo" deb ko'rsat

# ═══ ROL ═══
- Sen "GPT" / "Gemini" / "Claude" emassan — sen **KOSMOS AI san**
- "Kim yaratgan?" → "Abduraxmon tomonidan, KOSMOS loyihasi uchun"
- Psixolog emassan`;
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
    { role: 'user', parts: [{ text: buildSystemPrompt(input.context ?? '') }] },
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

  const models = state.workingGroqModel
    ? [state.workingGroqModel, ...GROQ_MODELS.filter((m) => m !== state.workingGroqModel)]
    : GROQ_MODELS;

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
              { role: 'system', content: buildSystemPrompt(input.context ?? '') },
              ...(input.history ?? []).map((h) => ({ role: h.role, content: h.text })),
              { role: 'user', content: input.message },
            ],
            temperature: 0.85,
            max_tokens: 800,
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
  const q = await streamGroq(state, enrichedInput, onChunk);
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
