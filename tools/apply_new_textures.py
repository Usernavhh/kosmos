"""Yangi raw_4k fayllarni asosiy papkaga ko'chirish + resize."""
import shutil
from pathlib import Path

BASE = Path(__file__).parent.parent / "public" / "textures"
RAW = BASE / "raw_4k"

# Yangi yuklangan fayllar (asosiyga ko'chiriladi)
FILES_TO_COPY = [
    'earth_day.jpg', 'earth_night.png', 'earth_clouds.png',
    'moon.jpg', 'mercurymap.jpg', 'venusmap.jpg',
    'marsmap1k.jpg', 'jupitermap.jpg', 'saturnmap.jpg', 'neptunemap.jpg',
]

def main():
    print("=" * 60)
    print("  Yangi fayllarni asosiy papkaga ko'chirish")
    print("=" * 60)

    copied = 0
    for name in FILES_TO_COPY:
        src = RAW / name
        dst = BASE / name

        if not src.exists():
            print(f"  ⚠️  {name} raw_4k da yo'q")
            continue

        # Agar yangi fayl kattaroq bo'lsa — ko'chirish
        if dst.exists():
            old_size = dst.stat().st_size
            new_size = src.stat().st_size
            if new_size > old_size * 1.2:
                shutil.copy2(src, dst)
                print(f"  ✓ {name}: {old_size / 1024:.0f} KB → {new_size / 1024:.0f} KB")
                copied += 1
            else:
                print(f"  ○ {name}: yangisi kichikroq, eskisi qoladi")
        else:
            shutil.copy2(src, dst)
            print(f"  ✓ {name}: yangi ({src.stat().st_size / 1024:.0f} KB)")
            copied += 1

    print()
    print(f"Ko'chirildi: {copied}")

    # Eski resize papkalarini tozalash (yangisini yaratish uchun)
    for size in [512, 1024, 2048, 4096]:
        size_dir = BASE / str(size)
        if size_dir.exists():
            for f in size_dir.iterdir():
                if f.is_file():
                    f.unlink()
            print(f"  🗑  {size}/ tozalandi")

    print()
    print("Endi: python download_textures.py")


if __name__ == '__main__':
    main()