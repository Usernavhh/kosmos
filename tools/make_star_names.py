"""
Yorqin yulduzlar uchun nomlar faylini yaratadi.
Chiqish: public/data/star_names.json

Format: [
  { "x": ..., "y": ..., "z": ..., "dist": ..., "mag": ..., "name": ..., "nameUz": ..., "con": ... },
  ...
]
"""

import numpy as np
import pandas as pd
from pathlib import Path
import json
import sys

BASE = Path(__file__).parent
CSV_PATH = BASE / "data" / "hyg.csv"
OUT_PATH = BASE.parent / "public" / "data" / "star_names.json"
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

MAG_LIMIT = 2.5  # Faqat yorqin yulduzlar

# ==================== O'zbekcha nomlar ====================
# Arabcha asl nomlardan olingan. Mutaxassis tomonidan tekshirilishi kerak.
# "HYG'dagi nom": "O'zbekcha nom"
UZ_NAMES = {
    "Sirius": "Shi'ro",
    "Canopus": "Suhayl",
    "Arcturus": "As-Simok ar-Romih",
    "Vega": "Nasr Voqi",
    "Capella": "Al-Ayyuq",
    "Rigel": "Rijl al-Javzo",
    "Procyon": "G‘umaysho",
    "Betelgeuse": "Ibt al-Javzo",
    "Achernar": "Ohir an-Nahr",
    "Hadar": "Hadar",
    "Altair": "Nasr Toir",
    "Acrux": "As-Salib",
    "Aldebaran": "Dabaron",
    "Antares": "Qalb al-Aqrab",
    "Spica": "As-Simok al-A‘zal",
    "Pollux": "Ras al-Javzo",
    "Fomalhaut": "Fam al-Hut",
    "Deneb": "Zanab ad-Dajaja",
    "Regulus": "Qalb al-Asad",
    "Castor": "Ras at-Tav’amayn",
    "Bellatrix": "An-Nasr al-Mansur",
    "Alnilam": "An-Nizom",
    "Alnitak": "An-Nitaq",
    "Mintaka": "Mintaqa",
    "Polaris": "Al-Jadiy",
    "Dubhe": "Zahr ad-Dubb al-Akbar",
    "Alioth": "Al-Jaun",
    "Mizar": "Al-Miraq",
    "Alkaid": "Al-Qoid",
}
# ============================================================

if not CSV_PATH.exists():
    print(f"XATO: {CSV_PATH} topilmadi")
    sys.exit(1)

print(f"CSV o'qilmoqda: {CSV_PATH}")
df = pd.read_csv(CSV_PATH, low_memory=False)

# Yorqin YOKI proper nomi bor yulduzlar
has_name = df["proper"].notna() & (df["proper"].astype(str).str.strip() != "")
is_bright = df["mag"] <= MAG_LIMIT
selected = df[has_name | is_bright].copy()

# Nan'larni tozalash
selected = selected.dropna(subset=["ra", "dec", "mag", "dist"])
selected = selected[selected["mag"] > -10]  # Quyoshni olib tashlash

print(f"Tanlangan yulduzlar: {len(selected)}")

# Koordinatalar
ra_rad = np.deg2rad(selected["ra"].values * 15.0)
dec_rad = np.deg2rad(selected["dec"].values)

x = np.cos(dec_rad) * np.cos(ra_rad)
y = np.cos(dec_rad) * np.sin(ra_rad)
z = np.sin(dec_rad)

result = []
for i in range(len(selected)):
    row = selected.iloc[i]
    proper = row.get("proper")
    bayer = row.get("bayer")
    flam = row.get("flam")
    con = row.get("con")

    # Nom
    if pd.notna(proper) and str(proper).strip():
        name = str(proper).strip()
    elif pd.notna(bayer) and str(bayer).strip():
        name = f"{bayer} {con}"
    elif pd.notna(flam) and str(flam).strip():
        name = f"{flam} {con}"
    else:
        name = f"HD {int(row['hd'])}" if pd.notna(row.get("hd")) else "—"

    name_uz = UZ_NAMES.get(name, name)

    result.append({
        "x": float(x[i]),
        "y": float(y[i]),
        "z": float(z[i]),
        "dist": float(row["dist"]),
        "mag": float(row["mag"]),
        "name": name,
        "nameUz": name_uz,
        "con": str(con).strip() if pd.notna(con) else "",
    })

result.sort(key=lambda s: s["mag"])

with OUT_PATH.open("w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

size = OUT_PATH.stat().st_size
print(f"TAYYOR: {OUT_PATH}")
print(f"Yulduzlar: {len(result)}")
print(f"Fayl: {size} bayt ({size / 1024:.1f} KB)")
print()
print("Birinchi 5 ta:")
for s in result[:5]:
    print(f"  {s['nameUz']} ({s['name']}) mag={s['mag']:.2f} dist={s['dist']:.1f} pc con={s['con']}")