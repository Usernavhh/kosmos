export interface CityLocation {
  name: string;
  nameUz: string;
  lat: number;
  lon: number;
  timezone: number; // UTC offset (soatlarda)
}

export const TASHKENT: CityLocation = {
  name: 'Tashkent',
  nameUz: 'Toshkent',
  lat: 41.2995,
  lon: 69.2401,
  timezone: 5,
};

export const CITIES: CityLocation[] = [
  TASHKENT,
  { name: 'Samarkand', nameUz: 'Samarqand', lat: 39.6542, lon: 66.9597, timezone: 5 },
  { name: 'Bukhara', nameUz: 'Buxoro', lat: 39.7747, lon: 64.4286, timezone: 5 },
  { name: 'Khiva', nameUz: 'Xiva', lat: 41.3783, lon: 60.3639, timezone: 5 },
  { name: 'Nukus', nameUz: 'Nukus', lat: 42.4531, lon: 59.6103, timezone: 5 },
  { name: 'Andijan', nameUz: 'Andijon', lat: 40.7821, lon: 72.3442, timezone: 5 },
  { name: 'Fergana', nameUz: "Farg'ona", lat: 40.3864, lon: 71.7864, timezone: 5 },
  { name: 'Namangan', nameUz: 'Namangan', lat: 40.9983, lon: 71.6726, timezone: 5 },
  { name: 'Termez', nameUz: 'Termiz', lat: 37.2242, lon: 67.2783, timezone: 5 },
  { name: 'Navoiy', nameUz: 'Navoiy', lat: 40.0844, lon: 65.3792, timezone: 5 },
];