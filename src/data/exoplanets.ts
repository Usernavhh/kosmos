export interface Exoplanet {
  name: string;
  nameUz: string;
  radiusEarth: number;
  periodDays: number;
  distanceAU: number;
  color: number;
  type: string;
}

export interface ExoplanetSystem {
  starName: string;
  starNameUz: string;
  distanceLy: number;
  ra: number;
  dec: number;
  starColor: number;
  starSize: number; // ko'rinadigan
  planets: Exoplanet[];
}

export const EXOPLANET_SYSTEMS: ExoplanetSystem[] = [
  {
    starName: 'Proxima Centauri', starNameUz: "Proksima Sentavr",
    distanceLy: 4.24, ra: 217.43, dec: -62.68,
    starColor: 0xff5533, starSize: 60,
    planets: [
      { name: 'Proxima b', nameUz: 'Proksima b', radiusEarth: 1.1, periodDays: 11.2, distanceAU: 0.048, color: 0xaa8866, type: "Yer-o'lchamli" },
      { name: 'Proxima c', nameUz: 'Proksima c', radiusEarth: 7.0, periodDays: 1900, distanceAU: 1.49, color: 0x665544, type: "Super-Yer" },
    ],
  },
  {
    starName: 'TRAPPIST-1', starNameUz: 'TRAPPIST-1',
    distanceLy: 40.7, ra: 346.62, dec: -5.04,
    starColor: 0xff6644, starSize: 50,
    planets: [
      { name: 'TRAPPIST-1b', nameUz: 'TRAPPIST-1b', radiusEarth: 1.12, periodDays: 1.51, distanceAU: 0.011, color: 0xbb9977, type: "Yer-o'lchamli" },
      { name: 'TRAPPIST-1c', nameUz: 'TRAPPIST-1c', radiusEarth: 1.10, periodDays: 2.42, distanceAU: 0.016, color: 0xaa8866, type: "Yer-o'lchamli" },
      { name: 'TRAPPIST-1d', nameUz: 'TRAPPIST-1d', radiusEarth: 0.79, periodDays: 4.05, distanceAU: 0.022, color: 0x9988aa, type: "Yer-o'lchamli" },
      { name: 'TRAPPIST-1e', nameUz: 'TRAPPIST-1e', radiusEarth: 0.92, periodDays: 6.10, distanceAU: 0.029, color: 0x6688aa, type: "Yashash zonasi" },
      { name: 'TRAPPIST-1f', nameUz: 'TRAPPIST-1f', radiusEarth: 1.05, periodDays: 9.21, distanceAU: 0.038, color: 0x77aabb, type: "Yashash zonasi" },
      { name: 'TRAPPIST-1g', nameUz: 'TRAPPIST-1g', radiusEarth: 1.15, periodDays: 12.35, distanceAU: 0.047, color: 0x88bbcc, type: "Yashash zonasi" },
      { name: 'TRAPPIST-1h', nameUz: 'TRAPPIST-1h', radiusEarth: 0.77, periodDays: 18.77, distanceAU: 0.062, color: 0x99aacc, type: "Yer-o'lchamli" },
    ],
  },
  {
    starName: 'Tau Ceti', starNameUz: 'Tau Kita',
    distanceLy: 11.9, ra: 26.02, dec: -15.94,
    starColor: 0xffee88, starSize: 70,
    planets: [
      { name: 'Tau Ceti e', nameUz: 'Tau Kita e', radiusEarth: 3.9, periodDays: 162.9, distanceAU: 0.538, color: 0xbb9966, type: "Super-Yer" },
      { name: 'Tau Ceti f', nameUz: 'Tau Kita f', radiusEarth: 3.9, periodDays: 636, distanceAU: 1.35, color: 0x8877aa, type: "Super-Yer" },
    ],
  },
  {
    starName: '55 Cancri', starNameUz: '55 Rak',
    distanceLy: 40.9, ra: 133.15, dec: 28.33,
    starColor: 0xffdd77, starSize: 80,
    planets: [
      { name: '55 Cnc e', nameUz: '55 Rak e', radiusEarth: 2.0, periodDays: 0.74, distanceAU: 0.015, color: 0xff4422, type: "Lava dunyosi" },
      { name: '55 Cnc b', nameUz: '55 Rak b', radiusEarth: 12.0, periodDays: 14.65, distanceAU: 0.11, color: 0xee8833, type: "Issiq Yupiter" },
      { name: '55 Cnc c', nameUz: '55 Rak c', radiusEarth: 8.0, periodDays: 44.4, distanceAU: 0.24, color: 0xdd7733, type: "Gaz giganti" },
    ],
  },
  {
    starName: 'Kepler-442', starNameUz: 'Kepler-442',
    distanceLy: 1206, ra: 286.19, dec: 39.28,
    starColor: 0xffaa66, starSize: 60,
    planets: [
      { name: 'Kepler-442b', nameUz: 'Kepler-442b', radiusEarth: 1.34, periodDays: 112.3, distanceAU: 0.409, color: 0x99bb99, type: "Super-Yer" },
    ],
  },
];