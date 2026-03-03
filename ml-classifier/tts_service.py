"""
Edge-TTS Service for career mentor voice responses.
Uses Microsoft Edge's free TTS API — supports 300+ voices and all major languages.
Zero model download, works on any Python version.
"""

import io
import asyncio
import re
import edge_tts

# ─── Voice mapping by language ──────────────────────────────────────
VOICE_MAP = {
    'en': 'en-US-AriaNeural',        # English (US) — natural female
    'hi': 'hi-IN-SwaraNeural',        # Hindi
    'es': 'es-ES-ElviraNeural',       # Spanish
    'fr': 'fr-FR-DeniseNeural',       # French
    'de': 'de-DE-KatjaNeural',        # German
    'ja': 'ja-JP-NanamiNeural',       # Japanese
    'ko': 'ko-KR-SunHiNeural',       # Korean
    'zh': 'zh-CN-XiaoxiaoNeural',     # Chinese
    'pt': 'pt-BR-FranciscaNeural',    # Portuguese
    'ru': 'ru-RU-SvetlanaNeural',     # Russian
    'ar': 'ar-SA-ZariyahNeural',      # Arabic
    'ta': 'ta-IN-PallaviNeural',      # Tamil
    'te': 'te-IN-ShrutiNeural',       # Telugu
    'bn': 'bn-IN-TanishaaNeural',     # Bengali
    'mr': 'mr-IN-AarohiNeural',       # Marathi
    'gu': 'gu-IN-DhwaniNeural',       # Gujarati
    'kn': 'kn-IN-SapnaNeural',        # Kannada
    'ml': 'ml-IN-SobhanaNeural',      # Malayalam
}

DEFAULT_VOICE = 'en-US-AriaNeural'

_ready = True  # Edge-TTS requires no model loading


def _get_voice(language: str) -> str:
    """Get the best voice for a given language code."""
    lang = (language or 'en').lower().split('-')[0]  # 'en-US' → 'en'
    return VOICE_MAP.get(lang, DEFAULT_VOICE)


def _clean_for_tts(text: str) -> str:
    """Clean text for better TTS output."""
    # Remove markdown
    text = re.sub(r'```[\s\S]*?```', ' code block omitted ', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'^[-•]\s', '', text, flags=re.MULTILINE)
    text = re.sub(r'^###?\s', '', text, flags=re.MULTILINE)

    # Remove JSON formatting
    text = re.sub(r'[{}\[\]]', '', text)
    text = re.sub(r'"(\w+)":', r'\1:', text)

    # Clean up whitespace
    text = re.sub(r'\n{2,}', '. ', text)
    text = re.sub(r'\n', '. ', text)
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


async def synthesize_speech_async(text: str, language: str = 'en') -> bytes:
    """
    Convert text to speech audio (MP3 format) using Edge-TTS.

    Args:
        text: Text to synthesize
        language: Language code (e.g., 'en', 'hi', 'es')

    Returns:
        MP3 audio bytes
    """
    # Truncate very long text
    if len(text) > 1500:
        text = text[:1500] + "..."

    # Clean text
    text = _clean_for_tts(text)
    if not text.strip():
        raise ValueError("Empty text after cleaning")

    voice = _get_voice(language)
    print(f"[TTS] Synthesizing with voice={voice}, lang={language}, len={len(text)}")

    # Edge-TTS communicates and returns audio
    communicate = edge_tts.Communicate(text, voice)

    audio_buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_bytes = audio_buffer.getvalue()

    if len(audio_bytes) == 0:
        raise RuntimeError("Edge-TTS returned empty audio")

    print(f"[TTS] Generated {len(audio_bytes)} bytes of MP3 audio")
    return audio_bytes


def synthesize_speech(text: str, language: str = 'en') -> bytes:
    """Synchronous wrapper for synthesize_speech_async."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # We're inside an async context (FastAPI), use a new thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, synthesize_speech_async(text, language))
            return future.result(timeout=60)
    else:
        return asyncio.run(synthesize_speech_async(text, language))


def is_ready() -> bool:
    """Edge-TTS is always ready (no model to load)."""
    return True


def get_health() -> dict:
    """Get TTS service health info."""
    return {
        "ready": True,
        "service": "edge-tts",
        "model": "Microsoft Edge Neural TTS",
        "languages": list(VOICE_MAP.keys()),
    }
