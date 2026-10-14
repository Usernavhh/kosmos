"""
Mavjud teksturalarni 512/1024/2048/4096 versiyalarga resize qiladi.
Yuklab olish SHART EMAS — mavjud fayllar ishlatiladi.

Manba: ~/kosmos/public/textures/*.jpg
Natija: ~/kosmos/public/textures/{512,1024,2048,4096}/*.jpg

Ishga tushirish:
    cd ~/kosmos/tools
    source .venv/bin/activate
    python download_textures.py
"""

import os
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent.parent / "public" / "textures"
SIZES = [512, 1024, 2048, 4096]

# Manba fayllar — mavjud teksturalar
SOURCE_FILES = [
    "sun.jpg",
    "mercurymap.jpg",
    "venusmap.jpg",
    "earth_day.jpg",
    "earth_night.png",
    "earth_clouds.png",
    "marsmap1k.jpg",
    "jupitermap.jpg",
    "saturnmap.jpg",
    "uranusmap.jpg",
    "neptunemap.jpg",
    "moon.jpg",
]


def resize_to_size(src: Path, dest: Path, target_width: int) -> bool:
    """Rasmni berilgan kenglikka resize qiladi."""
    try:
        with Image.open(src) as img:
            # Aspect ratio saqlab
            ratio = target_width / img.width
            target_height = int(img.height * ratio)

            # RGB'ga o'tkazish (PNG bo'lsa ham)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            resized = img.resize((target_width, target_height), Image.LANCZOS)

            # Formatni saqlab
            ext = dest.suffix.lower()
            if ext == ".png":
                resized.save(dest, "PNG", optimize=True)
            else:
                resized.save(dest, "JPEG", quality=88, optimize=True)

        return True
    except Exception as e:
        print(f"    ✗ {dest.name} ({target_width}): {e}")
        return False


def main():
    print("=" * 60)
    print("  KOSMOS — teksturalarni resize qilish")
    print("=" * 60)
    print()

    # Manba fayllar mavjudmi?
    existing_sources = []
    for name in SOURCE_FILES:
        src = BASE / name
        if src.exists() and src.stat().st_size > 10_000:
            existing_sources.append((name, src))
        else:
            print(f"  ⚠️  {name} topilmadi yoki juda kichik")

    print()
    print(f"Manba: {len(existing_sources)} / {len(SOURCE_FILES)} ta fayl")
    print(f"Sizes: {SIZES}")
    print()

    if not existing_sources:
        print("XATO: Hech qanday manba fayl topilmadi!")
        print(f"Papka: {BASE}")
        print()
        print("Barcha fayllar yo'q. Avval ularni yuklab olishingiz kerak.")
        return

    # Kataloglar yaratish
    for size in SIZES:
        (BASE / str(size)).mkdir(parents=True, exist_ok=True)

    total_created = 0
    total_skipped = 0

    for name, src in existing_sources:
        print(f"═══ {name} ({src.stat().st_size / 1024:.0f} KB) ═══")

        with Image.open(src) as img:
            src_w, src_h = img.size
            print(f"  Manba: {src_w}×{src_h}")

        for size in SIZES:
            dest = BASE / str(size) / name

            # Mavjud va o'lchami to'g'rimi?
            if dest.exists() and dest.stat().st_size > 1000:
                # O'lchamni tekshirish
                try:
                    with Image.open(dest) as check:
                        if check.width == size:
                            print(f"    ✓ {size}×{size // 2} allaqachon bor")
                            total_skipped += 1
                            continue
                except Exception:
                    pass

            if resize_to_size(src, dest, size):
                kb = dest.stat().st_size / 1024
                print(f"    → {size}×{size // 2} ({kb:.0f} KB)")
                total_created += 1

        print()

    # Xulosa
    print("=" * 60)
    print(f"✓ Yaratildi: {total_created}")
    print(f"○ O'tkazib yuborildi: {total_skipped}")
    print("=" * 60)
    print()

    # Har bir papka hajmi
    total = 0
    for size in SIZES:
        size_dir = BASE / str(size)
        if size_dir.exists():
            files = list(size_dir.iterdir())
            s = sum(f.stat().st_size for f in files if f.is_file())
            total += s
            print(f"  {size}: {s / 1024 / 1024:.1f} MB ({len(files)} fayl)")
    print(f"  JAMI: {total / 1024 / 1024:.1f} MB")
    print()
    print("Endi brauzerda sinab ko'ring:")
    print("  ?quality=potato    → 512")
    print("  ?quality=medium    → 1024")
    print("  ?quality=high      → 2048")
    print("  ?quality=ultra-plus → 4096")


if __name__ == "__main__":
    main()