export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number; // option index
  explanation: string;
  level: 'oson' | "o'rta" | 'qiyin' | 'olimpiada';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: "Quyosh sistemasidagi eng katta sayyora qaysi?",
    options: ['Saturn', 'Yupiter', 'Uran', 'Neptun'],
    correct: 1,
    explanation: "Yupiterning massasi Quyosh sistemasining 2/3 qismiga teng. Radiusi Yerdan 11.2× katta.",
    level: 'oson',
  },
  {
    q: "Qaysi sayyora Quyosh atrofida teskari yo'nalishda aylanadi?",
    options: ['Mars', 'Venera', 'Merkuriy', 'Yupiter'],
    correct: 1,
    explanation: "Venera boshqa sayyoralarga qaraganda teskari (retrograd) yo'nalishda aylanadi.",
    level: "o'rta",
  },
  {
    q: "1 parseka qancha yorug'lik yiliga teng?",
    options: ['2.26 ly', '3.26 ly', '4.26 ly', '5.26 ly'],
    correct: 1,
    explanation: "1 pc = 3.26 ly = 206,265 AU = 3.086×10¹³ km.",
    level: "o'rta",
  },
  {
    q: "Somon Yo'lining markazida qanday ob'ekt joylashgan?",
    options: ['Neytron yulduz', 'Qora tuynuk', 'Oq mitti', "Qizil gigant"],
    correct: 1,
    explanation: "Sagittarius A* — massasi 4.3 mln quyosh massasi bo'lgan supermassiv qora tuynuk.",
    level: "o'rta",
  },
  {
    q: "Quyoshning yadro harorati taxminan qancha?",
    options: ['5,800 K', '1 mln K', '15.7 mln K', '100 mln K'],
    correct: 2,
    explanation: "Yadro harorati 15.7 million Kelvin. Yuzasi esa ~5,800 K.",
    level: 'qiyin',
  },
  {
    q: "Qaysi formula Schwarzschild radiusini hisoblaydi?",
    options: ['Rs = GM/c', 'Rs = 2GM/c²', 'Rs = GM/c²', 'Rs = 4GM/c²'],
    correct: 1,
    explanation: "Rs = 2GM/c² — qora tuynukning hodisa gorizonti radiusi.",
    level: 'olimpiada',
  },
  {
    q: "1 AU qancha kilometrga teng?",
    options: ['93 million km', '149.6 million km', '200 million km', '1 milliard km'],
    correct: 1,
    explanation: "1 AU = 149,597,870.7 km ≈ 149.6 mln km. Yer va Quyosh orasidagi o'rtacha masofa.",
    level: 'oson',
  },
  {
    q: "Ulug'bek 'Zij-i Guragoniy' katalogida nechta yulduz bor?",
    options: ['500', '1018', '5000', '10000'],
    correct: 1,
    explanation: "Zij-i Guragoniy (1437) — 1018 yulduz pozitsiyasi. O'sha davrda eng aniq katalog.",
    level: 'qiyin',
  },
  {
    q: "Qaysi sayyoraning o'qi 98° egilgan (yonboshlab aylanadi)?",
    options: ['Saturn', 'Uran', 'Neptun', 'Yupiter'],
    correct: 1,
    explanation: "Uran o'qi 98° egilgan — Yer o'qiga nisbatan. Shuning uchun yonboshlab aylanadi.",
    level: "o'rta",
  },
  {
    q: "Eng yorqin yulduz (kechki osmonda) qaysi?",
    options: ['Polaris', 'Vega', 'Sirius', 'Betelgeuse'],
    correct: 2,
    explanation: "Sirius (Shi'ro) — mag -1.46. Masofa 8.6 ly, A1V spektral sinf.",
    level: 'oson',
  },
  {
    q: "Katta portlash taxminan qachon sodir bo'lgan?",
    options: ['1 mlrd yil avval', '5 mlrd yil avval', '13.8 mlrd yil avval', '100 mlrd yil avval'],
    correct: 2,
    explanation: "Koinot yoshi 13.8 milliard yil. Planck missiyasi (2018) aniq o'lchagan.",
    level: "o'rta",
  },
  {
    q: "XKS orbitada Yer atrofini necha daqiqada aylanib chiqadi?",
    options: ['45 daqiqa', '92 daqiqa', '180 daqiqa', '24 soat'],
    correct: 1,
    explanation: "XKS (ISS) davri 92.9 daqiqa. Tezligi 7.66 km/s, balandligi ~420 km.",
    level: "o'rta",
  },
];