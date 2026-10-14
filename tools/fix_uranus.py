"""Uran uchun muqobil manba."""
import requests
from pathlib import Path

BASE = Path(__file__).parent.parent / "public" / "textures"
HEADERS = {'User-Agent': 'Mozilla/5.0'}

# Uran uchun urinishlar (turli o'lchamlar)
URLS = [
    # Wikipedia thumbnail (aniq o'lcham)
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/1920px-Uranus2.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/1280px-Uranus2.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/1024px-Uranus2.jpg',
    # Alternativ
    'https://nssdc.gsfc.nasa.gov/image/planetary/uranus/uranus1.jpg',
    'https://solarsystem.nasa.gov/system/resources/detail_files/400_Uranus.jpg',
]

# Sun uchun urinishlar
SUN_URLS = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1920px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1280px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
]


def try_download(urls, dest_name):
    dest = BASE / dest_name
    print(f"\n═══ {dest_name} ═══")

    for url in urls:
        try:
            print(f"  ↓ {url[:80]}...")
            r = requests.get(url, headers=HEADERS, timeout=60, stream=True)
            r.raise_for_status()

            ct = r.headers.get('Content-Type', '').lower()
            if 'html' in ct:
                print(f"    ✗ HTML")
                continue

            with open(dest, 'wb') as f:
                for chunk in r.iter_content(65536):
                    f.write(chunk)

            size = dest.stat().st_size
            if size < 10_000:
                print(f"    ✗ Juda kichik: {size}")
                dest.unlink()
                continue

            print(f"    ✓ {size / 1024:.0f} KB")
            return True
        except Exception as e:
            print(f"    ✗ {str(e)[:80]}")

    return False


def main():
    print("=" * 60)
    print("  Uran va Quyosh uchun muqobil manbalar")
    print("=" * 60)

    # Uran
    if not try_download(URLS, 'uranusmap.jpg'):
        print("\n⚠️  Uran yuklanmadi — solid color fallback ishlatiladi")
        # Zaxira: yassi ko'k rasm
        from PIL import Image
        img = Image.new('RGB', (1024, 512), (140, 180, 200))
        img.save(BASE / 'uranusmap.jpg', 'JPEG', quality=90)
        print("  ✓ Yassi ko'k Urан yaratildi (1024×512)")

    # Sun (agar eski bo'lsa ham, yaxshiroq kerak)
    sun_dest = BASE / 'sun.jpg'
    if sun_dest.exists() and sun_dest.stat().st_size > 100_000:
        print(f"\n═══ sun.jpg — eski fayl yetarli ({sun_dest.stat().st_size / 1024:.0f} KB) ═══")
    else:
        if not try_download(SUN_URLS, 'sun.jpg'):
            print("\n⚠️  Sun yuklanmadi — eski qoladi")


if __name__ == '__main__':
    main()