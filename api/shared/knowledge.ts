export interface KnowledgeEntry {
  q: string;         // kalit savol / mavzu
  a: string;         // javob (AI context uchun)
  tags: string[];    // qidiruv uchun
  source?: string;   // manba
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  // ═══ QUYOSH SISTEMASI ═══
  { q: 'Quyosh', a: "Quyosh — G2V spektral sinf yulduzi, massasi 1.989×10³⁰ kg, radiusi 696,340 km. Yoshi 4.6 mlrd yil. Yadro harorati 15.7 mln °C. Har sekundda 600 mln tonna vodorod geliyga aylanadi.", tags: ['quyosh', 'sun', 'yulduz'], source: 'NASA' },
  { q: 'Merkuriy', a: "Merkuriy — Quyoshga eng yaqin sayyora (0.39 AU). Radiusi 2,439 km. Bir yil 88 kun, bir kun 59 Yer kuni. Harorat -173°C dan +427°C gacha. Atmosferasi deyarli yo'q.", tags: ['merkuriy', 'sayyora'], source: 'NASA' },
  { q: 'Venera', a: "Venera — 2-sayyora (0.72 AU). Radiusi 6,052 km. Atmosferasi 96% CO₂, bosimi 92 atm. Harorat +464°C — eng issiq sayyora. Teskari yo'nalishda aylanadi.", tags: ['venera', 'sayyora'], source: 'NASA' },
  { q: 'Yer', a: "Yer — 3-sayyora (1 AU). Radiusi 6,371 km, massasi 5.972×10²⁴ kg. Atmosfera 78% N₂, 21% O₂. 1 ta tabiiy yo'ldosh — Oy. Yashash uchun ma'lum yagona sayyora.", tags: ['yer', 'earth', 'sayyora'], source: 'NASA' },
  { q: 'Mars', a: "Mars — 4-sayyora (1.52 AU). Radiusi 3,390 km. Qizil rang — temir oksidi. Atmosfera 95% CO₂. Olympus Mons — eng baland vulqon (21.9 km). 2 ta yo'ldosh: Fobos, Deymos.", tags: ['mars', 'sayyora', 'qizil'], source: 'NASA' },
  { q: 'Yupiter', a: "Yupiter — eng katta sayyora (5.2 AU). Radiusi 69,911 km (Yerning 11.2×). Massasi Quyosh sistemasining 2/3 qismi. Buyuk Qizil Dog' — 350+ yillik bo'ron. 95+ yo'ldosh.", tags: ['yupiter', 'jupiter', 'sayyora'], source: 'NASA' },
  { q: 'Saturn', a: "Saturn — 6-sayyora (9.58 AU). Radiusi 58,232 km. Halqalari muz va toshdan, qalinligi 10-100 m. Zichligi suvdan kam. 146+ yo'ldosh. Titan — eng katta yo'ldosh.", tags: ['saturn', 'sayyora', 'halqa'], source: 'NASA' },
  { q: 'Uran', a: "Uran — 7-sayyora (19.2 AU). Radiusi 25,362 km. O'q 98° egilgan — yonboshlab aylanadi. Atmosfera metan tufayli ko'k-yashil. 27 ta yo'ldosh.", tags: ['uran', 'sayyora'], source: 'NASA' },
  { q: 'Neptun', a: "Neptun — 8-sayyora (30.05 AU). Radiusi 24,622 km. Eng kuchli shamollar (2100 km/s). Yashil-ko'k. 14 ta yo'ldosh. 1846 yilda matematik hisob bilan topilgan.", tags: ['neptun', 'sayyora'], source: 'NASA' },

  // ═══ OY VA YO'LDOSHLAR ═══
  { q: 'Oy', a: "Oy — Yerning yagona tabiiy yo'ldoshi. Radiusi 1,737 km. Masofa 384,400 km. Bir xil tomon bilan qaraydi (tidal lock). 1969-yilda Apollo 11 birinchi odam qadam qo'ydi.", tags: ['oy', 'moon', 'yo\'ldosh'], source: 'NASA' },
  { q: 'Titan', a: "Titan — Saturnning eng katta yo'ldoshi. Radiusi 2,575 km. Qalin azot atmosferasi. Yuzasida suyuq metan ko'llari. 1655 yilda Gyuygens topgan.", tags: ['titan', 'saturn', 'yo\'ldosh'], source: 'NASA' },
  { q: 'Yevropa', a: "Yevropa — Yupiterning yo'ldoshi. Radiusi 1,560 km. Muz qatlami ostida suyuq okean. Astrobiologiya uchun eng qiziqarli joy. NASA Europa Clipper (2024).", tags: ['yevropa', 'europa', 'yupiter'], source: 'NASA' },
  { q: 'Enselad', a: "Enselad — Saturn yo'ldoshi. Radiusi 252 km. Janubiy qutbida suv geyzerlari. Muz ostida okean. Cassini missiyasi o'rgangan.", tags: ['enselad', 'enceladus', 'saturn'], source: 'NASA' },

  // ═══ YULDUZLAR ═══
  { q: 'Yulduz nima', a: "Yulduz — gravitatsiyaviy kollaps bilan shakllangan, yadro sintezi orqali energiya chiqaruvchi plazma shari. Asosiy ketma-ketlik yulduzlari H-R diagrammasida diagonal joylashadi.", tags: ['yulduz', 'star'], source: 'IAU' },
  { q: 'Quyosh massasi', a: "Quyosh massasi = 1.989×10³⁰ kg (1 M☉). Astronomiyada yulduz massalari shu birlikda o'lchanadi.", tags: ['quyosh', 'massa', 'mass'], source: 'IAU' },
  { q: 'Sirius', a: "Sirius (Shi'ro) — eng yorqin yulduz (mag -1.46). Masofa 8.6 ly. Spektral sinf A1V. Ikki yulduzli tizim (Sirius A + Sirius B oq mitti).", tags: ['sirius', 'shi\'ro', 'yulduz'], source: 'IAU' },
  { q: 'Vega', a: "Vega (Nasr Voqi) — Lira turkumida. Masofa 25 ly. Mag 0.03. A0V spektral sinf. Qadimgi yunonlar standart yorqinlik yulduzi deb bilgan.", tags: ['vega', 'nasr voqi', 'lira'], source: 'IAU' },
  { q: 'Betelgeuse', a: "Betelgeuse (Ibt al-Javzo) — Orion yelkasidagi qizil supergigant. Radiusi Quyoshdan 700× katta. 100,000 yil ichida supernova bo'ladi.", tags: ['betelgeuse', 'orion', 'supergigant'], source: 'IAU' },
  { q: 'Polaris', a: "Polaris (Al-Jadiy) — Shimoliy Qutb yulduzi. Kichik Ayiq turkumida. F7Ib supergigant. Dengizchilar uchun asosiy mo'ljal. Balandligi shimoliy kenglikka teng.", tags: ['polaris', 'qutb', 'shimol'], source: 'IAU' },
  { q: 'Proksima', a: "Proksima Sentavr — Quyoshga eng yaqin yulduz. Masofa 4.24 ly. Qizil mitti (M5.5Ve). 2 ta ekzosayyora: Proksima b (yashash zonasi), Proksima c.", tags: ['proksima', 'centauri', 'yaqin'], source: 'ESA' },
  { q: 'Yulduz turlari', a: "Spektral sinflar: O (ko'k, 30,000+ K), B (ko'k-oq), A (oq, 7500-10000 K), F (sariq-oq), G (sariq, Quyosh), K (to'q sariq), M (qizil, 3000 K). Ko'proq massiv = qisqaroq umr.", tags: ['spektral', 'yulduz turi', 'sinf'], source: 'IAU' },

  // ═══ QORA TUYNUQ ═══
  { q: 'Qora tuynuk', a: "Qora tuynuk — gravitatsiyasi shunchalik kuchli, hatto yorug'lik ham qochib chiqa olmaydi. Schwarzschild radiusi: Rs = 2GM/c². 3 xil: yulduz massali, o'rta, supermassiv.", tags: ['qora tuynuk', 'black hole'], source: 'NASA' },
  { q: 'Sgr A', a: "Sagittarius A* — Somon Yo'lining markazida joylashgan supermassiv qora tuynuk. Massasi 4.3 mln quyosh massasi. 2022 yilda EHT tasvirini oldi. Yerdan 26,000 ly.", tags: ['sgr a', 'sagittarius', 'markaz'], source: 'EHT' },
  { q: 'M87', a: "M87* — Andromeda... yo'q, Virgo klasteridagi Messier 87 galaktikasi markazidagi supermassiv qora tuynuk. Massasi 6.5 mlrd quyosh massasi. 2019 yilda birinchi EHT tasviri.", tags: ['m87', 'qora tuynuk', 'eht'], source: 'EHT' },
  { q: 'Doppler effekt', a: "Akkretsion diskda Doppler effekti — bir tomon ko'k siljigan (yaqinlashuvchi), boshqa tomon qizil siljigan (uzoqlashuvchi). Yorqinlik assimetriyasi shundan.", tags: ['doppler', 'akkretsion'], source: 'NASA' },

  // ═══ GALAKTIKALAR ═══
  { q: 'Somon Yo\'li', a: "Somon Yo'li — bizning galaktikamiz. Tipi: SBbc spiral. Diametri ~100,000 ly. 200-400 mlrd yulduz. Massasi 1.5 trillion quyosh massasi. Quyosh markazdan 26,000 ly.", tags: ['somon yo\'li', 'galaktika', 'milky way'], source: 'ESA' },
  { q: 'Andromeda', a: "Andromeda (M31) — Somon Yo'lidan 2.54 mln ly uzoqda. Eng yaqin katta spiral galaktika. Diametri 220,000 ly. 4.5 mlrd yil ichida Somon Yo'li bilan to'qnashadi.", tags: ['andromeda', 'm31', 'galaktika'], source: 'NASA' },
  { q: 'Galaktika turlari', a: "3 asosiy turi: Spiral (S), Elliptik (E), Noto'g'ri (Irr). Hubble tasnifi. Somon Yo'li — SBbc (barred spiral).", tags: ['galaktika turi', 'hubble'], source: 'IAU' },
  { q: 'Virgo klaster', a: "Virgo klasteri — eng yaqin yirik galaktikalar to'dasi. 1,300+ galaktika. Markazi 54 mln ly uzoqda. Diametri 15 mln ly. Mahalliy guruh shu klasterga tortiladi.", tags: ['virgo', 'klaster'], source: 'NASA' },

  // ═══ KOSMOLOGIYA ═══
  { q: 'Katta portlash', a: "Katta portlash — Koinotning boshlanishi. 13.8 mlrd yil avval. Dastlab o'ta zich va issiq nuqta. CMB nurlanishi (2.725 K) shundan qolgan.", tags: ['katta portlash', 'big bang', 'boshlanish'], source: 'NASA' },
  { q: 'CMB', a: "Kosmik mikroto'lqinli fon (CMB) — Katta portlashdan 380,000 yil keyin chiqqan nurlanish. Harorat 2.725 K. Koinotning eng qadimgi 'surati'.", tags: ['cmb', 'fon', 'mikroto\'lqin'], source: 'NASA' },
  { q: 'Qizil siljish', a: "Qizil siljish — uzoqdagi ob'ektlarning spektri qizil tomonga siljishi. Koinotning kengayishidan. Hubble qonuni: v = H₀ × d. H₀ ≈ 70 km/s/Mpc.", tags: ['qizil siljish', 'redshift', 'hubble'], source: 'NASA' },
  { q: 'Koinot yoshi', a: "Koinot yoshi = 13.8 mlrd yil. Planck missiyasi (2018) aniq o'lchagan. Kengayish tezligi tezlashmoqda (qorong'u energiya).", tags: ['koinot', 'yosh', 'planck'], source: 'ESA' },
  { q: 'Qorong\'u materiya', a: "Qorong'u materiya — ko'rinmaydigan massa (Koinotning 27%). Gravitatsion ta'siri bilan aniqlangan. Hali to'g'ridan-to'g'ri aniqlanmagan.", tags: ['qorong\'u materiya', 'dark matter'], source: 'ESA' },
  { q: 'Qorong\'u energiya', a: "Qorong'u energiya — Koinotning 68%. Kengayishni tezlashtiradi. Tabiati noma'lum. 1998 yilda kashf etilgan (Nobel 2011).", tags: ['qorong\'u energiya', 'dark energy'], source: 'NASA' },

  // ═══ MASOFA BIRLIKLARI ═══
  { q: 'Parseka', a: "Parseka (pc) = 3.26 yorug'lik yili = 206,265 AU = 3.086×10¹³ km. Yulduzlar masofasi uchun. 1 kpc = 1000 pc, 1 Mpc = 1 mln pc.", tags: ['parsek', 'masofa', 'birlik'], source: 'IAU' },
  { q: 'AU', a: "Astronomik birlik (AU) = Yer va Quyosh orasidagi o'rtacha masofa = 149,597,870.7 km. Sayyoralar masofasi uchun asosiy birlik.", tags: ['au', 'astronomik birlik'], source: 'IAU' },
  { q: 'Yorug\'lik yili', a: "Yorug'lik yili (ly) = yorug'likning bir yilda bosib o'tgan masofasi = 9,460,730,472,580.8 km = 63,241 AU. Galaktikalar masofasi uchun.", tags: ['yorug\'lik yili', 'ly'], source: 'IAU' },
  { q: 'Yorug\'lik tezligi', a: "Yorug'lik tezligi c = 299,792.458 km/s. Koinotdagi maksimal tezlik. Einsteinning maxsus nisbiylik nazariyasi (1905).", tags: ['yorug\'lik tezligi', 'c', 'einstein'], source: 'BIPM' },

  // ═══ O'ZBEK ASTRONOMIYASI ═══
  { q: 'Ulug\'bek', a: "Mirzo Ulug'bek (1394-1449) — Samarqand hukmdori va astronom. Samarqand rasadxonasi (1420). 'Zij-i Guragoniy' katalogi — 1018 yulduz pozitsiyasi. Yulduz yilini 365 kun 6 soat 10 daqiqa 8 sekund deb hisoblagan (haqiqiy: 365d 6h 9m 10s).", tags: ['ulug\'bek', 'samarqand', 'zij'], source: 'O\'zbekiston FA' },
  { q: 'Beruniy', a: "Abu Rayhon Beruniy (973-1048) — Xorazmlik olim. 'Qonuni Mas'udiy' — astronomiya ensiklopediyasi. Yer radiusini aniq o'lchagan (6339.6 km, haqiqiy 6371 km).", tags: ['beruniy', 'xorazm'], source: 'O\'zbekiston FA' },
  { q: 'Xorazmiy', a: "Muhammad al-Xorazmiy (783-850) — algebra asoschisi. Astronomik jadvallar. 'Algoritm' so'zi uning nomidan. Bag'dod 'Bayt al-Hikma'da ishlagan.", tags: ['xorazmiy', 'algebra'], source: 'O\'zbekiston FA' },
  { q: 'Ali Qushchi', a: "Ali Qushchi (1403-1474) — Ulug'bek shogirdi. Samarqanddan Istanbulga ko'chgan. Astronomiya va matematika asarlari. 'Risola dar ilm-i hay'a'.", tags: ['qushchi', 'ulug\'bek'], source: 'O\'zbekiston FA' },
  { q: 'Zij-i Guragoniy', a: "Zij-i Guragoniy — Ulug'bekning yulduzlar katalogi (1437). 1018 yulduz. O'sha davrda eng aniq. 200+ yil davomida Yevropada ham ishlatilgan.", tags: ['zij', 'ulug\'bek', 'katalog'], source: 'O\'zbekiston FA' },

  // ═══ KOSMIK MISSYALAR ═══
  { q: 'XKS', a: "Xalqaro Kosmik Stansiya (XKS / ISS) — orbitada 1998 yildan. Balandligi ~420 km, tezligi 7.66 km/s, davri 92.9 daqiqa. Doimiy ekipaj. 2000 yildan buyon uzluksiz odam bor.", tags: ['xks', 'iss', 'stansiya'], source: 'NASA' },
  { q: 'Hubble', a: "Hubble kosmik teleskopi — 1990 yilda uchirilgan. Diametri 2.4 m. Balandlik 540 km. 1.5 mln+ kuzatuv. Koinot yoshi, galaktikalar evolyutsiyasi uchun asosiy.", tags: ['hubble', 'teleskop'], source: 'NASA' },
  { q: 'James Webb', a: "James Webb (JWST) — 2021 yilda uchirilgan. Diametri 6.5 m (oltin qoplama). L2 nuqtasida (1.5 mln km). Infraqizil diapazon. Eng qimmat kosmik teleskop ($10 mlrd).", tags: ['jwst', 'james webb', 'teleskop'], source: 'NASA' },
  { q: 'Voyager 1', a: "Voyager 1 — 1977 yilda uchirilgan. 2012 yilda yulduzlararo fazoga chiqqan (birinchi). Hozir 24+ mlrd km. Har sekundda 17 km/s. Aloqa 22 soatda yetadi.", tags: ['voyager', 'yulduzlararo'], source: 'NASA' },

  // ═══ ASTEROIDLAR VA KOMETALAR ═══
  { q: 'Asteroid belbog\'i', a: "Asteroid belbog'i — Mars va Yupiter orasida (2.1-3.3 AU). 1 mln+ asteroid. Eng kattasi: Ceres (940 km, mitti sayyora). Vesta, Pallas, Hygiea.", tags: ['asteroid', 'belbog', 'ceres'], source: 'NASA' },
  { q: 'Ceres', a: "Ceres — eng katta asteroid va mitti sayyora. Radiusi 473 km. Diametri 940 km. Massasi belbog'ning 1/3 qismi. Dawn missiyasi o'rgangan (2015-2018).", tags: ['ceres', 'asteroid', 'mitti'], source: 'NASA' },
  { q: 'Galley kometasi', a: "Galley kometasi — eng mashhur kometa. Davri 75-76 yil. Oxirgi marta 1986 yilda, keyingisi 2061 yilda. Uzunligi 15 km. Quyosh atrofida elliptik orbita.", tags: ['galley', 'kometa', 'halley'], source: 'NASA' },
  { q: 'Kuiper belbog\'i', a: "Kuiper belbog'i — Neptun orbitasidan tashqarida (30-50 AU). Pluton, Eris, Makemake — bu yerdan. Qisqa davrli kometalar manbai.", tags: ['kuiper', 'pluton'], source: 'NASA' },

  // ═══ XALQARO MISSYALAR ═══
  { q: 'Apollo 11', a: "Apollo 11 — birinchi odamni Oyga qo'ygan missiya (1969-yil 20-iyul). Neil Armstrong va Buzz Aldrin. 21.5 soat Oy yuzasida. 21.5 kg namuna olib qaytgan.", tags: ['apollo', 'oy', 'armstrong'], source: 'NASA' },
  { q: 'Artemis', a: "Artemis — NASA ning Oyga qaytish dasturi. Artemis I (2022) — orbitada sinov. Artemis II (2024-2025) — ekipaj. Artemis III — Oyga qaytish. Maqsad: doimiy baza.", tags: ['artemis', 'oy', 'nasa'], source: 'NASA' },
  { q: 'Perseverance', a: "Perseverance — NASA ning Mars roveri (2021). Jezero kraterida. Maqsad: qadimgi hayot izlarini topish. Ingenuity dron bilan birga. Namunalar qaytariladi.", tags: ['perseverance', 'mars', 'rover'], source: 'NASA' },
];