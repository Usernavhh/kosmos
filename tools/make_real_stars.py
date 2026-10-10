"""
KOSMOS — Data Factory
Haqiqiy HYG katalogini binar formatga o'giradi.
Chiqish: public/data/stars.bin

Format: KOSMOS01 + uint32 (soni) + N x [f32 x, y, z, f32 mag, f32 color, f32 dist]
"""

import numpy as np
import pandas as pd
from pathlib import Path
import sys

BASE = Path(__file__).parent
CSV_PATH = BASE / "data" / "hyg.csv"
OUT_PATH = BASE.parent / "public" / "data" / "stars.bin"
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

MAG_LIMIT = 8.0

if not CSV_PATH.exists():
    print(f"XATO: {CSV_PATH} topilmadi")
    sys.exit(1)

print(f"CSV o'qilmoqda: {CSV_PATH}")
df = pd.read_csv(CSV_PATH, low_memory=False)
print(f"Jami qatorlar: {len(df)}")

required = ["ra", "dec", "mag"]
for col in required:
    if col not in df.columns:
        print(f"XATO: '{col}' ustuni yo'q")
        sys.exit(1)

df = df.dropna(subset=required)
print(f"ra/dec/mag to'liq: {len(df)}")

df = df[df["mag"] <= MAG_LIMIT].copy()
print(f"mag <= {MAG_LIMIT}: {len(df)}")

df = df[df["mag"] > -10].copy()
print(f"Quyosh olib tashlangandan keyin: {len(df)}")

# RA/Dec -> x, y, z
ra_rad = np.deg2rad(df["ra"].values.astype(np.float64) * 15.0)
dec_rad = np.deg2rad(df["dec"].values.astype(np.float64))

x = (np.cos(dec_rad) * np.cos(ra_rad)).astype(np.float32)
y = (np.cos(dec_rad) * np.sin(ra_rad)).astype(np.float32)
z = (np.sin(dec_rad)).astype(np.float32)

mag = df["mag"].values.astype(np.float32)

# Rang indeksi (B-V) -> 0..1
if "ci" in df.columns:
    ci = df["ci"].values.astype(np.float64)
    ci = np.where(np.isnan(ci), 0.5, ci)
    ci_norm = np.clip((ci + 0.4) / 2.4, 0.0, 1.0).astype(np.float32)
else:
    ci_norm = np.full(len(df), 0.5, dtype=np.float32)

# Masofa (parsek)
if "dist" in df.columns:
    dist_pc = df["dist"].values.astype(np.float64)
    dist_pc = np.where(np.isfinite(dist_pc) & (dist_pc > 0), dist_pc, 1000.0)
    dist_pc = dist_pc.astype(np.float32)
else:
    dist_pc = np.full(len(df), 100.0, dtype=np.float32)

# ============ MUHIM: NaN/Inf tekshiruvi ============
valid = (
    np.isfinite(x)
    & np.isfinite(y)
    & np.isfinite(z)
    & np.isfinite(mag)
    & np.isfinite(ci_norm)
    & np.isfinite(dist_pc)
)
n_bad = int((~valid).sum())
if n_bad > 0:
    print(f"Ogohlantirish: {n_bad} yulduzda NaN/Inf topildi, olib tashlandi")
    x = x[valid]
    y = y[valid]
    z = z[valid]
    mag = mag[valid]
    ci_norm = ci_norm[valid]
    dist_pc = dist_pc[valid]
# ===================================================

print(f"Yakuniy yulduzlar: {len(x)}")

# Birlashtirish: (N, 6)
data = np.column_stack([x, y, z, mag, ci_norm, dist_pc]).astype(np.float32)

# Binar fayl
MAGIC = b"KOSMOS01"
with OUT_PATH.open("wb") as f:
    f.write(MAGIC)
    f.write(np.uint32(len(data)).tobytes())
    f.write(data.tobytes())

size = OUT_PATH.stat().st_size
print()
print(f"TAYYOR: {OUT_PATH}")
print(f"Yulduzlar: {len(data)}")
print(f"Har yulduz: {data.dtype.itemsize * data.shape[1]} bayt")
print(f"Fayl: {size} bayt ({size / 1024:.1f} KB, {size / 1024 / 1024:.2f} MB)")
print()
print("Birinchi 5 yulduz:")
for i in range(min(5, len(data))):
    xx, yy, zz, mm, cc, dd = data[i]
    print(
        f"  #{i}: pos=({xx:+.3f}, {yy:+.3f}, {zz:+.3f}) "
        f"mag={mm:+.2f} col={cc:.2f} dist={dd:.2f} pc"
    )