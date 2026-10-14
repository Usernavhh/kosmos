"""
KOSMOS — TTS serveri
1) Edge-TTS (Microsoft Neural) — sifatli, ASOSIY
2) gTTS (Google Translate) — ishonchli, FALLBACK

Agar Edge-TTS 403 bersa — avtomatik gTTS ga o'tadi.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import time
import asyncio
from gtts import gTTS
import io

try:
    import edge_tts
    EDGE_AVAILABLE = True
except ImportError:
    EDGE_AVAILABLE = False
    print("[warn] edge-tts o'rnatilmagan — faqat gTTS ishlaydi")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════ OVOZLAR ═══════════
# Edge-TTS ovozlari (asosiy — sifatli)
VOICES = [
    {"name": "uz-UZ-SardorNeural", "lang": "uz", "gender": "Male", "label": "Sardor (erkak) ⭐"},
    {"name": "uz-UZ-MadinaNeural", "lang": "uz", "gender": "Female", "label": "Madina (ayol) ⭐"},
    {"name": "tr-TR-AhmetNeural", "lang": "tr", "gender": "Male", "label": "Ahmet (turk)"},
    {"name": "tr-TR-EmelNeural", "lang": "tr", "gender": "Female", "label": "Emel (turk)"},
    {"name": "ru-RU-DmitryNeural", "lang": "ru", "gender": "Male", "label": "Dmitriy (rus)"},
    {"name": "ru-RU-SvetlanaNeural", "lang": "ru", "gender": "Female", "label": "Svetlana (rus)"},
    {"name": "en-US-GuyNeural", "lang": "en", "gender": "Male", "label": "Guy (ingliz)"},
    {"name": "en-US-JennyNeural", "lang": "en", "gender": "Female", "label": "Jenny (ingliz)"},
]

# Kesh
cache: dict[str, bytes] = {}
CACHE_MAX = 200

# Edge-tts bloklanish vaqti (timestamp)
edge_blocked_until = 0.0


class TTSRequest(BaseModel):
    text: str
    voice: str = "uz-UZ-SardorNeural"


def clean_text(text: str) -> str:
    text = re.sub(r"\*\*", "", text)
    text = re.sub(r"\*", "", text)
    text = re.sub(r"`[^`]*`", "", text)
    text = re.sub(r"\$[^$]*\$", "", text)
    text = re.sub(r"#+\s", "", text)
    text = re.sub(r"[\U0001F300-\U0001F9FF]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_sentences(text: str, max_len: int = 200) -> list[str]:
    sentences = re.split(r"(?<=[.!?…])\s+", text)
    chunks = []
    cur = ""
    for s in sentences:
        if len(cur) + len(s) + 1 > max_len and cur:
            chunks.append(cur)
            cur = s
        else:
            cur = cur + " " + s if cur else s
    if cur:
        chunks.append(cur)
    return chunks if chunks else [text]


# ═══════════ EDGE-TTS ═══════════
async def fetch_edge_tts(text: str, voice: str) -> bytes | None:
    """Sifatli Edge-TTS. Blok bo'lsa None qaytaradi."""
    global edge_blocked_until

    if not EDGE_AVAILABLE:
        return None

    if time.time() < edge_blocked_until:
        return None

    audio = b""
    try:
        communicate = edge_tts.Communicate(text, voice, rate="+0%")
        async for piece in communicate.stream():
            if piece["type"] == "audio":
                audio += piece["data"]
        return audio if audio else None
    except Exception as e:
        err = str(e)
        if "403" in err or "Invalid response" in err or "Handshake" in err:
            edge_blocked_until = time.time() + 120  # 2 daqiqa
            print(f"[edge] 403 — 2 daqiqa blok")
        else:
            print(f"[edge] Xato: {err[:80]}")
        return None


# ═══════════ gTTS (Google Translate) ═══════════
def fetch_gtts(text: str, lang: str) -> bytes | None:
    """Google TTS — fallback. Sifat pastroq, ishonchli."""
    try:
        # gTTS 100 belgidan oshsa bo'laklarga bo'lish kerak
        chunks = split_sentences(text, 100)
        audio = b""
        for chunk in chunks:
            tts = gTTS(text=chunk, lang=lang, slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            audio += buf.getvalue()
        return audio if audio else None
    except Exception as e:
        print(f"[gtts] Xato: {str(e)[:80]}")
        return None


# ═══════════ ENDPOINTLAR ═══════════
@app.get("/health")
async def health():
    return {
        "ok": True,
        "edge_available": EDGE_AVAILABLE,
        "edge_blocked": time.time() < edge_blocked_until,
        "edge_unblocks_in": max(0, edge_blocked_until - time.time()),
    }


@app.get("/voices")
async def list_voices():
    return VOICES


@app.post("/tts")
async def tts(req: TTSRequest):
    text = clean_text(req.text)
    if not text:
        raise HTTPException(400, "Matn bo'sh")

    # Tilni aniqlash
    if "-" in req.voice:
        lang = req.voice.split("-")[0]
    else:
        lang = req.voice

    # Kesh
    cache_key = f"{req.voice}:{text}"
    if cache_key in cache:
        print(f"[cache] {text[:50]}")
        return Response(content=cache[cache_key], media_type="audio/mpeg")

    audio = None
    source = "unknown"

    # ═══ 1) Edge-TTS (sifatli — o'zbek bor) ═══
    audio = await fetch_edge_tts(text, req.voice)
    if audio:
        source = "edge"

    # ═══ 2) gTTS (faqat tr/ru/en uchun — o'zbek yo'q) ═══
    if not audio and lang in ("tr", "ru", "en", "ar", "de", "fr", "es", "it", "ja", "ko", "zh"):
        print(f"[fallback] gTTS ({lang})")
        audio = fetch_gtts(text, lang)
        if audio:
            source = "gtts"

    # ═══ 3) O'zbek uchun ishlamadi — 204 (brauzer TTS ishlatsin) ═══
    if not audio:
        if lang == "uz":
            print(f"[fallback] O'zbek uchun edge ishlamadi — brauzer TTS")
            raise HTTPException(204, "Brauzer TTS ishlatilsin")
        raise HTTPException(503, "Barcha TTS ishlamadi")

    # Keshga saqlash
    if len(cache) > CACHE_MAX:
        cache.clear()
    cache[cache_key] = audio

    print(f"[tts] {source}: {len(audio)} bayt — {text[:50]}")
    return Response(content=audio, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    print("=" * 55)
    print("  KOSMOS TTS serveri")
    print("  Edge-TTS (sifatli) + gTTS (fallback)")
    print("  http://127.0.0.1:5001")
    print("=" * 55)
    uvicorn.run(app, host="127.0.0.1", port=5001, log_level="warning")