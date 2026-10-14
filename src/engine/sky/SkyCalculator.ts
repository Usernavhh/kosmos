/**
 * Yulduz/sayyora balandligi va azimuti — Greenwich sideral vaqti orqali.
 */

export interface HorizonCoord {
  azimuth: number;    // 0-360° (shimoldan)
  elevation: number;  // -90° (ostida) .. +90° (zenit)
  visible: boolean;   // ufqdan yuqorida
}

/** Joriy Julian Date */
function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** J2000 dan kunlar */
function daysSinceJ2000(date: Date): number {
  return julianDate(date) - 2451545.0;
}

/** Greenwich Mean Sidereal Time (soatlarda) */
function gmst(date: Date): number {
  const d = daysSinceJ2000(date);
  const gmstHours = 18.697374558 + 24.06570982441908 * d;
  return ((gmstHours % 24) + 24) % 24;
}

/** Mahalliy sideral vaqt (soatlarda) */
function lst(date: Date, lonDeg: number): number {
  return (gmst(date) + lonDeg / 15) % 24;
}

/**
 * RA (soat), Dec (daraja) → Azimuth/Balandlik
 */
export function radecToHorizontal(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date,
): HorizonCoord {
  const lstH = lst(date, lonDeg);
  const haH = lstH - raHours; // Hour angle (soatlarda)
  const ha = haH * 15 * (Math.PI / 180); // radian
  const dec = decDeg * (Math.PI / 180);
  const lat = latDeg * (Math.PI / 180);

  // Altitude
  const sinAlt =
    Math.sin(dec) * Math.sin(lat) +
    Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(sinAlt);

  // Azimuth
  const y = -Math.cos(dec) * Math.sin(ha);
  const x =
    Math.sin(dec) * Math.cos(lat) -
    Math.cos(dec) * Math.sin(lat) * Math.cos(ha);
  let azimuth = Math.atan2(y, x) * (180 / Math.PI);
  azimuth = (azimuth + 360) % 360;

  const elevationDeg = altitude * (180 / Math.PI);

  return {
    azimuth,
    elevation: elevationDeg,
    visible: elevationDeg > 0,
  };
}

/** Azimutni kompasga aylantirish */
export function azimuthToCompass(az: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(((az % 360) + 360) % 360 / 45) % 8;
  return dirs[idx];
}

/** Yulduzlar pozitsiyasini yangilash — joriy vaqtda ufqdan yuqoridagilarni qaytaradi */
export function filterVisibleStars(
  stars: { x: number; y: number; z: number; mag: number; color: number; dist: number }[],
  city: { lat: number; lon: number },
  date: Date,
): (typeof stars[number] & { azimuth: number; elevation: number })[] {
  const result: (typeof stars[number] & { azimuth: number; elevation: number })[] = [];

  // Debug: bir necha yulduzni tekshirish
  for (const s of stars) {
    // x, y, z birlik sfera — RA/Dec ga qaytarish
    // x = cos(dec) * cos(ra), y = cos(dec) * sin(ra), z = sin(dec)
    const dec = Math.asin(s.z);
    const ra = Math.atan2(s.y, s.x);
    const raHours = ((ra * (180 / Math.PI) / 15) + 24) % 24;
    const decDeg = dec * (180 / Math.PI);

    const h = radecToHorizontal(raHours, decDeg, city.lat, city.lon, date);

    if (h.visible && s.mag <= 6.0) {
      result.push({ ...s, azimuth: h.azimuth, elevation: h.elevation });
    }
  }

  return result;
}