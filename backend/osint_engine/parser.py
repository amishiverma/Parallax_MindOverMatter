"""
parser.py
OSINT Engine — Phase 2, Project RedString
Keyword intent classifier that flags brag/panic markers and extracts author profiles.
Uses Regex + lightweight NLP (no heavy ML models).
"""

import re
import json
import base64
import math
from pathlib import Path
from collections import defaultdict, Counter
from typing import Any

# ── Keyword Taxonomy ──────────────────────────────────────────────────────────
INTENT_PATTERNS = {
    "boast": re.compile(
        r"\b("
        r"drain(ed)?|hack(ed)?|exploit(ed)?|clean\s?est|flawless|no\s?cap|"
        r"nobody.{0,10}catch|ghosts?|rug|absolute|million|lmao|fire|"
        r"clueless|begging.{0,10}exploit(ed)?|too\s?late|"
        r"railgun|peel(ing)?|vault\s?(v\d+)?|mixer|tornado|cash\s?out|"
        r"reentranc(y|e)|bridge|stole(n)?|split|launder(ing)?|shield(ed)?"
        r")\b",
        re.IGNORECASE,
    ),
    "panic": re.compile(
        r"\b("
        r"delete|watching|alert|freeze|abort|opsec|lay\s?low|feds?|"
        r"lawyer|don.{0,5}touch|move.{0,10}everything|internal\s?leak|"
        r"tipping|chainalysis|tip\s?off|thermal|asap|dark\s?side|wipe|tracking"
        r")\b",
        re.IGNORECASE,
    ),
}

PLATFORM_RISK = {
    "Telegram":       0.8,
    "darkweb_forum":  1.0,
    "IRC":            0.6,
}


def _shannon_entropy(data: str) -> float:
    if not data:
        return 0.0
    counts = Counter(data)
    n = len(data)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def _is_readable_text(s: str) -> bool:
    if not s or len(s.strip()) == 0:
        return False
    printable = sum(1 for c in s if c.isprintable() or c in "\r\n\t")
    if printable / len(s) < 0.85:
        return False
    alpha = sum(1 for c in s if c.isalpha())
    return alpha >= max(2, int(len(s) * 0.25))


def inspect_payload(message: str) -> dict[str, Any]:
    """
    Lightweight payload inspector:
      - Valid Base64 or Hex encoding (length >= 8, decodes to readable ASCII/UTF-8)
      - High-entropy gibberish/ciphertext that fails decoding
    """
    clean = message.strip()

    # 1. Base64 Check
    if len(clean) >= 8 and " " not in clean and re.match(r"^[A-Za-z0-9+/=]+$", clean):
        try:
            if len(clean) % 4 in (0, 2, 3):
                padded = clean + "=" * ((4 - len(clean) % 4) % 4)
                raw = base64.b64decode(padded, validate=True)
                decoded = raw.decode("utf-8")
                if _is_readable_text(decoded):
                    return {
                        "is_encoded": True,
                        "is_cipher": False,
                        "decoded_payload": decoded,
                        "encoding": "base64",
                    }
        except Exception:
            pass

    # 2. Hex Check
    hex_cand = clean[2:] if clean.startswith(("0x", "0X")) else clean
    if len(hex_cand) >= 8 and len(hex_cand) % 2 == 0 and " " not in hex_cand and re.match(r"^[0-9a-fA-F]+$", hex_cand):
        try:
            raw = bytes.fromhex(hex_cand)
            decoded = raw.decode("utf-8")
            if _is_readable_text(decoded):
                return {
                    "is_encoded": True,
                    "is_cipher": False,
                    "decoded_payload": decoded,
                    "encoding": "hex",
                }
        except Exception:
            pass

    # 3. High-entropy ciphertext / gibberish check
    entropy = _shannon_entropy(clean)
    if len(clean) >= 16 and " " not in clean and entropy >= 3.8:
        return {
            "is_encoded": False,
            "is_cipher": True,
            "decoded_payload": None,
            "encoding": None,
        }

    return {
        "is_encoded": False,
        "is_cipher": False,
        "decoded_payload": None,
        "encoding": None,
    }


def classify_intent(message: str) -> str:
    """Return 'boast', 'panic', or 'neutral' based on keyword regex match."""
    matches = {intent: bool(pat.search(message)) for intent, pat in INTENT_PATTERNS.items()}
    if matches["panic"]:
        return "panic"
    if matches["boast"]:
        return "boast"
    return "neutral"


def extract_keyword_hits(message: str) -> dict[str, list[str]]:
    """Return matched keyword spans per intent category."""
    hits = {}
    for intent, pat in INTENT_PATTERNS.items():
        found = pat.findall(message)
        if found:
            hits[intent] = [m if isinstance(m, str) else m[0] for m in found]
    return hits


def parse_feed(posts: list[dict]) -> list[dict]:
    """
    Enrich raw OSINT posts with:
      - classified_intent: model-derived intent label (boast, panic, neutral, panic_evasion)
      - keyword_hits: matched tokens + bonus tags
      - decoded_payload: string when obfuscation is detected & decoded
      - platform_risk_score: float 0.0–1.0 (+0.15 for encrypted payload)
      - is_flagged: True if boast, panic, or panic_evasion
    Returns enriched posts sorted by timestamp.
    """
    enriched = []
    for post in posts:
        msg = post.get("message", "")
        risk = PLATFORM_RISK.get(post.get("platform", ""), 0.5)

        inspector_res = inspect_payload(msg)
        decoded_payload = inspector_res.get("decoded_payload")

        if inspector_res["is_encoded"]:
            # Valid Base64 or Hex: decode, run keyword classifier on decoded text, set bonus tag
            decoded_text = decoded_payload or ""
            hits = extract_keyword_hits(decoded_text)
            hits.setdefault("boast", [])
            if "evasion_obfuscation" not in hits["boast"]:
                hits["boast"].append("evasion_obfuscation")
            intent = "boast"
            is_flagged = True
        elif inspector_res["is_cipher"]:
            # High-entropy gibberish/ciphertext that fails decoding: flag panic_evasion & encrypted_payload_detected
            intent = "panic_evasion"
            hits = {"panic": ["encrypted_payload_detected"]}
            risk = min(1.0, risk + 0.15)
            is_flagged = True
        else:
            # Plain text message
            intent = classify_intent(msg)
            hits = extract_keyword_hits(msg)
            is_flagged = intent in ("boast", "panic")

        item = {
            **post,
            "classified_intent": intent,
            "keyword_hits": hits,
            "platform_risk_score": risk,
            "is_flagged": is_flagged,
        }
        if decoded_payload:
            item["decoded_payload"] = decoded_payload

        enriched.append(item)

    enriched.sort(key=lambda p: p["timestamp_utc"])
    return enriched


def build_author_profiles(enriched_posts: list[dict]) -> dict[str, dict]:
    """
    Build per-author profile:
      - total_posts, flagged_posts, intent_distribution
      - platform, timezone_hint
      - flagged_rate: fraction of posts flagged
    """
    profiles: dict[str, dict] = defaultdict(lambda: {
        "handle": "",
        "platform": "",
        "timezone_hint": "",
        "total_posts": 0,
        "flagged_posts": 0,
        "intent_counts": {"boast": 0, "panic": 0, "neutral": 0, "panic_evasion": 0},
        "platform_risk_score": 0.0,
    })

    for post in enriched_posts:
        author = post["author"]
        p = profiles[author]
        p["handle"] = author
        p["platform"] = post.get("platform", "")
        p["timezone_hint"] = post.get("timezone_hint", "")
        p["platform_risk_score"] = post.get("platform_risk_score", 0.5)
        p["total_posts"] += 1
        intent = post["classified_intent"]
        p["intent_counts"][intent] = p["intent_counts"].get(intent, 0) + 1
        if post["is_flagged"]:
            p["flagged_posts"] += 1

    for author, p in profiles.items():
        total = p["total_posts"]
        p["flagged_rate"] = round(p["flagged_posts"] / total, 4) if total > 0 else 0.0

    return dict(profiles)


# ── CLI / standalone use ──────────────────────────────────────────────────────
if __name__ == "__main__":
    raw_path = Path(__file__).parent.parent / "data" / "raw" / "osint_chatter.json"
    with open(raw_path, encoding="utf-8") as f:
        raw_posts = json.load(f)

    enriched = parse_feed(raw_posts)
    profiles = build_author_profiles(enriched)

    print(f"[parser] Enriched {len(enriched)} posts")
    for handle, prof in profiles.items():
        print(f"  {handle:15s} | posts={prof['total_posts']:3d} | "
              f"flagged={prof['flagged_posts']:3d} | "
              f"rate={prof['flagged_rate']:.0%} | "
              f"intents={prof['intent_counts']}")
