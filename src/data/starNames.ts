export interface NamedStar {
  x: number;
  y: number;
  z: number;
  dist: number;
  mag: number;
  name: string;
  nameUz: string;
  con: string;
}

export interface Constellation {
  name: string;
  nameUz: string;
  lines: [string, string][];
}

export interface ConstellationFile {
  constellations: Constellation[];
}

export async function loadStarNames(
  url = '/data/star_names.json',
): Promise<NamedStar[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`star_names.json yuklanmadi: ${res.status}`);
  return (await res.json()) as NamedStar[];
}

export async function loadConstellations(
  url = '/data/constellations.json',
): Promise<Constellation[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`constellations.json yuklanmadi: ${res.status}`);
  const data = (await res.json()) as ConstellationFile;
  return data.constellations;
}