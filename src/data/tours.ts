export interface TourKeyframe {
  pos: [number, number, number];
  look: [number, number, number];
  duration: number;
  text: string;
  title?: string;
}

export interface Tour {
  id: string;
  title: string;
  titleUz: string;
  keyframes: TourKeyframe[];
}

export const TOURS: Tour[] = [
  {
    id: 'solar-system',
    title: 'From Sun to Neptune in 3 minutes',
    titleUz: 'Quyoshdan Neptungacha 3 daqiqada',
    keyframes: [
      { pos: [0, 2000, 8000], look: [0, 0, 0], duration: 4, text: "Boshlaymiz Quyoshdan — sistemamiz markazidan.", title: 'Quyosh' },
      { pos: [0, 500, 3000], look: [0, 0, 0], duration: 5, text: "Merkuriy — eng kichik va eng tez sayyora.", title: 'Merkuriy' },
      { pos: [5500, 300, 2500], look: [5000, 0, 0], duration: 5, text: "Venera — qalin bulutli, eng issiq sayyora.", title: 'Venera' },
      { pos: [10000, 400, 4000], look: [5000, 0, 0], duration: 5, text: "Yer — bizning uyimiz.", title: 'Yer' },
      { pos: [15000, 500, 6000], look: [7600, 0, 0], duration: 5, text: "Mars — Qizil sayyora.", title: 'Mars' },
      { pos: [40000, 2000, 20000], look: [26000, 0, 0], duration: 6, text: "Yupiter — eng katta sayyora.", title: 'Yupiter' },
      { pos: [60000, 2000, 30000], look: [47900, 0, 0], duration: 6, text: "Saturn — halqalari bilan.", title: 'Saturn' },
      { pos: [120000, 3000, 60000], look: [96000, 0, 0], duration: 6, text: "Uran — yonboshlab aylanadi.", title: 'Uran' },
      { pos: [200000, 3000, 100000], look: [150250, 0, 0], duration: 6, text: "Neptun — eng uzoq sayyora.", title: 'Neptun' },
    ],
  },
  {
    id: 'black-hole',
    title: 'Journey to a Black Hole',
    titleUz: "Qora tuynukka sayohat",
    keyframes: [
      { pos: [0, 20000, 60000], look: [0, 0, 0], duration: 5, text: "Quyosh sistemasidan chiqamiz.", title: 'Koinot' },
      { pos: [1e9, 1e8, 1e9], look: [4.1e9, 0, 0], duration: 8, text: "Somon Yo'li bo'ylab harakat.", title: "Somon Yo'li" },
      { pos: [3.9e9, 2e7, 4e8], look: [4.1e9, 0, 0], duration: 8, text: "Galaktika markaziga yaqinlashamiz.", title: "Markaz" },
      { pos: [4.05e9, 1e7, 5e7], look: [4.1e9, 0, 0], duration: 6, text: "Sagittarius A* — 4 million quyosh massali qora tuynuk.", title: 'Sgr A*' },
    ],
  },
  {
    id: 'ulugbek',
    title: "Ulug'bek Sky",
    titleUz: "Ulug'bek osmoni",
    keyframes: [
      { pos: [0, 2000, 8000], look: [0, 0, 0], duration: 4, text: "Samarqanddan osmonni kuzatamiz.", title: 'Boshlanish' },
      { pos: [640000, 200000, 300000], look: [640000, 200000, 300000], duration: 5, text: "Proksima Sentavr — eng yaqin yulduz.", title: 'Proksima' },
      { pos: [1.5e6, 500000, 8e6], look: [1.5e6, 500000, 8e6], duration: 5, text: "TRAPPIST-1 — 7 ta Yer-o'lchamli sayyora.", title: 'TRAPPIST-1' },
      { pos: [50000, 50000, 50000], look: [0, 0, 0], duration: 4, text: "Ulug'bek merosi — Zij-i Guragoniy.", title: "Ulug'bek" },
    ],
  },
];