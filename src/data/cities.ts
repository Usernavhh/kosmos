export interface City {
  name: string;
  nameUz: string;
  lat: number;
  lon: number;
  population: number;
}

export const CITIES: City[] = [
  { name: 'Tashkent', nameUz: 'Toshkent', lat: 41.2995, lon: 69.2401, population: 2_900_000 },
  { name: 'Samarkand', nameUz: 'Samarqand', lat: 39.6542, lon: 66.9597, population: 550_000 },
  { name: 'Bukhara', nameUz: 'Buxoro', lat: 39.7747, lon: 64.4286, population: 280_000 },
  { name: 'Khiva', nameUz: 'Xiva', lat: 41.3783, lon: 60.3639, population: 90_000 },
  { name: 'New York', nameUz: 'Nyu-York', lat: 40.7128, lon: -74.006, population: 8_400_000 },
  { name: 'London', nameUz: 'London', lat: 51.5074, lon: -0.1278, population: 9_000_000 },
  { name: 'Paris', nameUz: 'Parij', lat: 48.8566, lon: 2.3522, population: 2_200_000 },
  { name: 'Tokyo', nameUz: 'Tokio', lat: 35.6762, lon: 139.6503, population: 14_000_000 },
  { name: 'Beijing', nameUz: 'Pekin', lat: 39.9042, lon: 116.4074, population: 21_000_000 },
  { name: 'Moscow', nameUz: 'Moskva', lat: 55.7558, lon: 37.6173, population: 12_500_000 },
  { name: 'Dubai', nameUz: 'Dubay', lat: 25.2048, lon: 55.2708, population: 3_500_000 },
  { name: 'Istanbul', nameUz: 'Istanbul', lat: 41.0082, lon: 28.9784, population: 15_500_000 },
  { name: 'Cairo', nameUz: 'Qohira', lat: 30.0444, lon: 31.2357, population: 9_500_000 },
  { name: 'Sydney', nameUz: 'Sidney', lat: -33.8688, lon: 151.2093, population: 5_300_000 },
  { name: 'Rio', nameUz: 'Rio-de-Janeyro', lat: -22.9068, lon: -43.1729, population: 6_700_000 },
  { name: 'Mexico City', nameUz: 'Mexiko', lat: 19.4326, lon: -99.1332, population: 9_200_000 },
  { name: 'Los Angeles', nameUz: 'Los-Anjeles', lat: 34.0522, lon: -118.2437, population: 4_000_000 },
  { name: 'Singapore', nameUz: 'Singapur', lat: 1.3521, lon: 103.8198, population: 5_700_000 },
  { name: 'Mumbai', nameUz: 'Mumbay', lat: 19.076, lon: 72.8777, population: 20_000_000 },
  { name: 'Berlin', nameUz: 'Berlin', lat: 52.52, lon: 13.405, population: 3_700_000 },
  { name: 'Rome', nameUz: 'Rim', lat: 41.9028, lon: 12.4964, population: 2_800_000 },
];