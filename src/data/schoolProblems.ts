export interface SchoolProblem {
  id: string;
  level: 'maktab' | 'olimpiada' | 'ioaa';
  topic: string;
  question: string;
  answer: string;
  solution: string[];
  source?: string;
}

export const SCHOOL_PROBLEMS: SchoolProblem[] = [
  {
    id: 'p1',
    level: 'maktab',
    topic: 'Kepler qonunlari',
    question: "Marsning Quyosh atrofida aylanish davri Yernikidan 1.88 marta katta. Marsning katta yarim o'qi qancha (AU)?",
    answer: "1.52 AU",
    solution: [
      "Keplerning 3-qonuni: T² = a³ (T — yil, a — AU)",
      "T_Mars = 1.88 yil",
      "a³ = 1.88² = 3.5344",
      "a = 3.5344^(1/3) ≈ 1.52 AU",
    ],
    source: "NASA Planetary Fact Sheet",
  },
  {
    id: 'p2',
    level: 'olimpiada',
    topic: 'Yorug‘lik tezligi',
    question: "Yorug‘lik Quyoshdan Yerga qancha vaqtda yetib keladi?",
    answer: "~8 daqiqa 20 sekund",
    solution: [
      "Masofa: 1 AU = 149.6 × 10⁶ km",
      "Yorug‘lik tezligi: c = 299,792 km/s",
      "t = d / c = 149.6 × 10⁶ / 299,792 ≈ 499 sekund",
      "499 sekund = 8 daqiqa 19 sekund",
    ],
    source: "IAU 2012",
  },
  {
    id: 'p3',
    level: 'olimpiada',
    topic: 'Schwarzschild radiusi',
    question: "Quyosh massasiga teng (1 M☉ = 2×10³⁰ kg) qora tuynukning Schwarzschild radiusi qancha?",
    answer: "~3 km",
    solution: [
      "Rs = 2GM / c²",
      "G = 6.674×10⁻¹¹ m³/(kg·s²)",
      "M = 2×10³⁰ kg, c = 3×10⁸ m/s",
      "Rs = 2 × 6.674×10⁻¹¹ × 2×10³⁰ / (9×10¹⁶)",
      "Rs ≈ 2.95×10³ m = 2.95 km ≈ 3 km",
    ],
    source: "Schwarzschild 1916",
  },
  {
    id: 'p4',
    level: 'ioaa',
    topic: 'Nisbiylik nazariyasi',
    question: "Kosmik kema 0.8c tezlikda harakatlanmoqda. Yerdagi kuzatuvchi uchun kemadagi 1 soat qancha vaqtga cho‘ziladi?",
    answer: "1.667 soat",
    solution: [
      "Vaqt kengayishi: t = t₀ / √(1 − v²/c²)",
      "v = 0.8c → v²/c² = 0.64",
      "√(1 − 0.64) = √0.36 = 0.6",
      "t = 1 / 0.6 = 1.667 soat = 1 soat 40 daqiqa",
    ],
    source: "Einstein 1905",
  },
  {
    id: 'p5',
    level: 'olimpiada',
    topic: 'Ulug‘bek merosi',
    question: "Ulug‘bek yulduz yilini 365 kun 6 soat 10 daqiqa 8 sekund deb o‘lchagan. Haqiqiy qiymat bilan farq qancha?",
    answer: "~58 sekund farq",
    solution: [
      "Ulug‘bek: 365d 6h 10m 8s = 365d + 6×3600 + 10×60 + 8 = 365d 22208s",
      "Haqiqiy: 365d 6h 9m 10s = 365d + 6×3600 + 9×60 + 10 = 365d 22150s",
      "Farq: 22208 − 22150 = 58 sekund",
      "Bu 1437-yil uchun ajoyib aniqlik!",
    ],
    source: "Zij-i Guragoniy (1437)",
  },
  {
    id: 'p6',
    level: 'maktab',
    topic: 'Quyosh sistemasi',
    question: "Quyosh sistemasidagi eng issiq sayyora qaysi va nega?",
    answer: "Venera (+464°C)",
    solution: [
      "Merkuriy Quyoshga yaqinroq, lekin atmosferasi yo‘q",
      "Venerada qalin CO₂ atmosfera — issiqxona effekti",
      "Issiqxona effekti: issiqlik ushlanib qoladi",
      "Natija: Venera Merkuriydan issiqroq",
    ],
    source: "NASA",
  },
  {
    id: 'p7',
    level: 'ioaa',
    topic: 'Galaktikalar',
    question: "Andromeda galaktikasi 2.5 Mly uzoqda. U bizga qanday tezlikda yaqinlashmoqda?",
    answer: "~110 km/s",
    solution: [
      "Qizil siljish: blueshift (yaqinlashish)",
      "Spektral chiziqlar siljishi: Δλ/λ = v/c",
      "Andromeda: v = −110 km/s (yaqinlashish)",
      "Bu Mahalliy guruhdagi tortishish ta’siri",
      "4.5 mlrd yildan keyin to‘qnashuv",
    ],
    source: "Hubble/ESA",
  },
  {
    id: 'p8',
    level: 'maktab',
    topic: 'O‘zbek astronomiyasi',
    question: "Beruniy Yer radiusini qanday o‘lchagan?",
    answer: "Ufq burchagi orqali",
    solution: [
      "Beruniy baland tog‘dan ufq burchagini o‘lchadi",
      "Ufq pasayish burchagi orqali Yer radiusini topdi",
      "Natija: ~6339 km (haqiqiy: 6371 km)",
      "Xato: atigi 0.5%!",
    ],
    source: "Beruniy, 'Qonuni Mas‘udiy' (1030)",
  },
];

export const TOPICS = [
  'Kepler qonunlari',
  'Yorug‘lik tezligi',
  'Nisbiylik',
  'Qora tuynuk',
  'Galaktikalar',
  'O‘zbek astronomiyasi',
  'Quyosh sistemasi',
];