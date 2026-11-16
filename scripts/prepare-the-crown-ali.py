#!/usr/bin/env python3
"""Prepare ALI Cinema bilingual machine draft from the exact user-supplied clip.

Not editorial approval: ASR and Vietnamese translation require human verification.
Run only in the isolated GitHub Actions publisher, never by the browser.
"""
import json
import pathlib
import re
import subprocess
import sys
import time
import wave

import numpy as np

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from faster_whisper import WhisperModel

SLUG = "the-crown-she-is-our-caesar"
ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = pathlib.Path("/tmp/ali-the-crown-audio.wav")
VIDEO = ROOT / "media" / SLUG / "video.mp4"
POSTER = ROOT / "media" / SLUG / "poster.jpg"
CAPTION = ROOT / "captions" / (SLUG + ".json")
CATALOG = ROOT / "ali-movies.json"

def probe():
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration:stream=codec_type,codec_name,width,height,pix_fmt",
        "-of", "json", str(VIDEO)], text=True))

def check_video():
    assert VIDEO.exists() and POSTER.exists(), "MP4/poster missing"
    info = probe()
    duration = float(info["format"]["duration"])
    assert 288.0 < duration < 291.0, f"Unexpected duration {duration}"
    assert 1000000 < VIDEO.stat().st_size < 90 * 1048576, "MP4 size invalid"
    assert POSTER.stat().st_size > 2000, "Poster too small"
    video = next(s for s in info["streams"] if s["codec_type"] == "video")
    audio = next(s for s in info["streams"] if s["codec_type"] == "audio")
    assert video["codec_name"] == "h264" and video["pix_fmt"] == "yuv420p"
    assert video["width"] == 1920 and video["height"] == 1080, "1080p source required"
    assert audio["codec_name"] == "aac"
    with VIDEO.open("rb") as f:
        assert b"moov" in f.read(262144), "MP4 faststart metadata missing"
    return duration

def translate_lines(lines):
    """Offline Apache-2.0 Marian EN->VI model avoids shared-IP rate limits."""
    model_id = "Helsinki-NLP/opus-mt-en-vi"
    print(f"Loading offline neural translator: {model_id}", flush=True)
    torch.set_num_threads(4)
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
    model.eval()
    languages = getattr(tokenizer, "supported_language_codes", None) or []
    prefix = ">>vie<< " if ">>vie<<" in languages else ""
    translations = []
    for start in range(0, len(lines), 8):
        batch = [prefix + line for line in lines[start:start + 8]]
        inputs = tokenizer(batch, return_tensors="pt", padding=True,
                           truncation=True, max_length=192)
        with torch.inference_mode():
            ids = model.generate(**inputs, num_beams=4, max_new_tokens=120)
        outputs = tokenizer.batch_decode(ids, skip_special_tokens=True)
        translations.extend([x.strip() for x in outputs])
        print(f"Translated {len(translations)}/{len(lines)}", flush=True)
    assert len(translations) == len(lines) and all(translations), "Vietnamese translation incomplete"
    return translations

def main():
    duration = check_video()
    assert SOURCE.exists(), "Audio was not extracted"
    print("Transcribing exact 4m50s The Crown clip with Whisper base.en", flush=True)
    model = WhisperModel("base.en", device="cpu", compute_type="int8", cpu_threads=4)
    with wave.open(str(SOURCE), "rb") as wav:
        assert wav.getframerate() == 16000 and wav.getnchannels() == 1 and wav.getsampwidth() == 2
        pcm = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    segments, _ = model.transcribe(
        pcm, language="en", beam_size=4, vad_filter=True,
        condition_on_previous_text=False, no_speech_threshold=0.55)
    transcript = []
    for seg in segments:
        en = re.sub(r"\s+", " ", seg.text).strip()
        start = max(0.0, round(float(seg.start), 3))
        end = min(duration, round(float(seg.end), 3))
        if en and end - start >= 0.2:
            # Whisper occasionally stretches a short utterance across long silence.
            # Keep provisional captions from lingering on-screen; editorial review is still required.
            words = len(en.split())
            if end - start > 9.5:
                end = round(min(end, start + max(4.0, min(8.5, 1.5 + 0.85 * words))), 3)
            elif words <= 3 and end - start > 5.0:
                end = round(min(end, start + 3.5), 3)
            transcript.append({"start": start, "end": end, "en": en})
    assert len(transcript) >= 10, f"Insufficient English dialogue: {len(transcript)}"
    assert all(transcript[i]["start"] <= transcript[i + 1]["start"]
               for i in range(len(transcript) - 1)), "Cues out of order"
    print(f"English transcript: {len(transcript)} segments", flush=True)
    vi_lines = translate_lines([cue["en"] for cue in transcript])
    cues = [{**cue, "vi": vi} for cue, vi in zip(transcript, vi_lines)]
    assert all(c["en"] and c["vi"] and c["end"] > c["start"] for c in cues)
    CAPTION.parent.mkdir(parents=True, exist_ok=True)
    CAPTION.write_text(json.dumps({
        "movieId": SLUG,
        "duration": round(duration, 3),
        "status": "machine_transcript_bilingual_unreviewed",
        "source": "Speech recognition from the user-supplied clip with Whisper base.en; offline automatic Vietnamese translation (Helsinki-NLP/opus-mt-en-vi). Requires human review.",
        "cues": cues
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    movie = {
        "id": SLUG,
        "title": "\"She Is Our Caesar\" Explaining the Coup Strategy Involving the Queen | The Crown (Olivia Colman)",
        "category": "PHIM SONG NGỮ · THE CROWN",
        "description": "Trích đoạn giải thích chiến lược đảo chính liên quan đến Nữ hoàng trong The Crown · 04:50 · bản phát 1080p/30fps; phụ đề Anh–Việt tự động đang chờ rà soát.",
        "duration": "04:50",
        "durationSeconds": round(duration, 3),
        "poster": f"./media/{SLUG}/poster.jpg",
        "source": {"type": "url", "url": f"./media/{SLUG}/video.mp4"},
        "captions": f"./captions/{SLUG}.json",
        "subtitleStatus": "machine_transcript_bilingual_unreviewed",
        "presentation": {
            "hideSourceLink": True,
            "background": "film-blur",
            "layout": "video-left-captions-right"
        },
        "qa": {
            "stage": "public_preview_pending_editorial_review",
            "rightsConfirmed": False,
            "englishReviewed": False,
            "vietnameseReviewed": False,
            "timingsReviewed": False,
            "desktopMobileTested": False,
            "approvedAt": "",
            "videoTechnicalChecked": True
        }
    }
    movies = catalog["movies"]
    old = next((i for i, item in enumerate(movies) if item["id"] == SLUG), None)
    if old is not None: movies[old] = movie
    else: movies.append(movie)
    catalog["version"] = int(catalog.get("version", 1)) + 1
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(cues)} EN/VI machine-draft cues; catalog total {len(movies)}", flush=True)

if __name__ == "__main__":
    main()
