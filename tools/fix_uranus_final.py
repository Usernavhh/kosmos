"""
Uran uchun shovqinli tekstura yaratish (barcha o'lchamlarda).
Uran deyarli bir xil — lekin ozgina shovqin real ko'rinish beradi.
"""
import numpy as np
from PIL import Image
from pathlib import Path

BASE = Path(__file__).parent.parent / "public" / "textures"
SIZES = [512, 1024, 2048, 4096]


def make_uranus(width: int, height: int) -> Image.Image:
    """Uran uslubidagi shovqinli tekstura."""
    # Asosiy rang: ko'k-yashil (Uran metan tufayli)
    base_r, base_g, base_b = 140, 200, 215

    # Shovqin generatsiyasi
    np.random.seed(42)
    noise = np.random.randn(height, width).astype(np.float32)

    # Silliqlash (blur)
    from scipy.ndimage import gaussian_filter
    try:
        noise = gaussian_filter(noise, sigma=2)
    except ImportError:
        # scipy yo'q — oddiy o'rtacha
        pass

    # Normalizatsiya
    noise = (noise - noise.min()) / (noise.max() - noise.min() + 1e-9)

    # Rangni ozgina o'zgartirish
    r = (base_r + noise * 15).clip(0, 255).astype(np.uint8)
    g = (base_g + noise * 12).clip(0, 255).astype(np.uint8)
    b = (base_b + noise * 10).clip(0, 255).astype(np.uint8)

    # Balandlik bo'yicha gradient (qutblar bir oz yorqinroq)
    for y in range(height):
        t = abs(y / height - 0.5) * 2  # 0 = markaz, 1 = qutb
        boost = int(t * 10)
        r[y] = (r[y].astype(int) + boost).clip(0, 255).astype(np.uint8)
        g[y] = (g[y].astype(int) + boost).clip(0, 255).astype(np.uint8)
        b[y] = (b[y].astype(int) + boost).clip(0, 255).astype(np.uint8)

    rgb = np.stack([r, g, b], axis=2)
    return Image.fromarray(rgb, 'RGB')


def main():
    print("=" * 60)
    print("  Uran teksturasi — barcha o'lchamlarda")
    print("=" * 60)

    # Asosiy fayl (2048)
    print("\n═══ uranusmap.jpg (2048) ═══")
    img_main = make_uranus(2048, 1024)
    img_main.save(BASE / "uranusmap.jpg", "JPEG", quality=85, optimize=True)
    print(f"  ✓ {BASE / 'uranusmap.jpg'}")

    # Har bir o'lcham uchun
    for size in SIZES:
        (BASE / str(size)).mkdir(exist_ok=True)
        img = make_uranus(size, size // 2)
        dest = BASE / str(size) / "uranusmap.jpg"
        img.save(dest, "JPEG", quality=85, optimize=True)
        print(f"  → {size}×{size // 2}: {dest.stat().st_size / 1024:.0f} KB")

    print("\n✅ Tayyor!")


if __name__ == '__main__':
    main()