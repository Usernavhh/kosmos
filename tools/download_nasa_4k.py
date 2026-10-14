"""
Ishonchli manbalardan teksturalar yuklash.
Wikimedia Special:FilePath — avtomatik o'lcham.
threex.planets — jsDelivr orqali.
"""

import requests
from pathlib import Path
from urllib.parse import quote

BASE = Path(__file__).parent.parent / "public" / "textures" / "raw_4k"
BASE.mkdir(parents=True, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}


def wikimedia(filename: str, width: int = 2048) -> str:
    """Wikimedia Special:FilePath URL — avtomatik to'g'ri o'lchamga yo'naltiradi."""
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename)}?width={width}"


SOURCES = {
    # ═══ Earth — NASA (ishladi) ═══
    'earth_day.jpg': [
        'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png',
    ],

    # ═══ Sun — Wikimedia ═══
    'sun.jpg': [
        wikimedia('The Sun by the Atmospheric Imaging Assembly of NASA\'s Solar Dynamics Observatory - 20100819.jpg', 2048),
    ],

    # ═══ Mercury ═══
    'mercurymap.jpg': [
        wikimedia('Mercury in true color.jpg', 2048),
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/mercurymap.jpg',
    ],

    # ═══ Venus ═══
    'venusmap.jpg': [
        wikimedia('Venus globe.jpg', 2048),
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/venusmap.jpg',
    ],

    # ═══ Mars — threex (aslida ishlagan) ═══
    'marsmap1k.jpg': [
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg',
        wikimedia('OSIRIS Mars true color.jpg', 2048),
    ],

    # ═══ Jupiter ═══
    'jupitermap.jpg': [
        wikimedia('Jupiter and its shrunken Great Red Spot.jpg', 2048),
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/jupitermap.jpg',
    ],

    # ═══ Saturn ═══
    'saturnmap.jpg': [
        wikimedia('Saturn during Equinox.jpg', 2048),
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnmap.jpg',
    ],

    # ═══ Uranus — hozir buzilgan, qayta yuklash kerak ═══
    'uranusmap.jpg': [
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/uranusmap.jpg',
        wikimedia('Uranus2.jpg', 2048),
    ],

    # ═══ Neptune ═══
    'neptunemap.jpg': [
        wikimedia('Neptune - Voyager 2 (29347980845) flatten crop.jpg', 2048),
        'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/neptunemap.jpg',
    ],

    # ═══ Moon ═══
    'moon.jpg': [
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg',
    ],

    # ═══ Earth night/clouds (ishladi) ═══
    'earth_night.png': [
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_lights_2048.png',
    ],
    'earth_clouds.png': [
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_1024.png',
    ],
}


def try_download(url: str, dest: Path) -> bool:
    try:
        print(f"    ↓ {url[:90]}")
        r = requests.get(url, headers=HEADERS, timeout=60, stream=True, allow_redirects=True)
        r.raise_for_status()

        # Content-Type tekshirish
        ct = r.headers.get('Content-Type', '').lower()
        if 'html' in ct:
            print(f"      ✗ HTML qaytardi (xato sahifasi)")
            return False

        with open(dest, 'wb') as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)

        size = dest.stat().st_size
        if size < 10_000:
            print(f"      ✗ Juda kichik: {size} bayt")
            dest.unlink()
            return False

        print(f"      ✓ {size / 1024:.0f} KB")
        return True
    except Exception as e:
        print(f"      ✗ {str(e)[:100]}")
        return False


def main():
    print("=" * 60)
    print("  Ishonchli manbalardan teksturalar")
    print("=" * 60)
    print()

    success = 0
    failed = []

    for name, urls in SOURCES.items():
        dest = BASE / name
        if dest.exists() and dest.stat().st_size > 10_000:
            print(f"═══ {name} ✓ allaqachon bor ({dest.stat().st_size / 1024:.0f} KB) ═══")
            success += 1
            continue

        print(f"═══ {name} ═══")

        got = False
        for url in urls:
            if try_download(url, dest):
                got = True
                success += 1
                break

        if not got:
            print(f"  ✗ {name} yuklanmadi")
            failed.append(name)

        print()

    print("=" * 60)
    print(f"✓ Muvaffaqiyatli: {success} / {len(SOURCES)}")
    if failed:
        print(f"✗ Muvaffaqiyatsiz: {', '.join(failed)}")
    print("=" * 60)

    total = sum(f.stat().st_size for f in BASE.iterdir() if f.is_file())
    print(f"\nDisk: {total / 1024 / 1024:.1f} MB")
    print(f"Papka: {BASE}")


if __name__ == '__main__':
    main()