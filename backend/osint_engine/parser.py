"""
parser.py
OSINT Engine — Phase 2, Project RedString
Keyword intent classifier that flags brag/panic markers and extracts author profiles.
Uses Regex + lightweight NLP (no heavy ML models).
"""

import re
import json
from pathlib import Path
from collections import defaultdict

# ── Keyword Taxonomy ──────────────────────────────────────────────────────────
INTENT_PATTERNS = {
    "boast": re.compile(
        r"\b("
        r"drain(ed)?|hack(ed)?|exploit(ed)?|clean\s?est|flawless|no\s?cap|"
        r"nobody.{0,10}catch|ghosts?|rug|absolute|million|lmao|fire|"
        r"clueless|begging.{0,10}exploit(ed)?|too\s?late"
        r")\b",
        re.IGNORECASE,
    ),
    "panic": re.compile(
        r"\b("
        r"delete|watching|alert|freeze|abort|opsec|lay\s?low|feds?|"
        r"lawyer|don.{0,5}touch|move.{0,10}everything|internal\s?leak|"
        r"tipping|chainalysis|tip\s?off|thermal|asap|dark\s?side"
        r")\b",
        re.IGNORECASE,
    ),
}

PLATFORM_RISK = {
    "Telegram":       0.8,
    "darkweb_forum":  1.0,
    "IRC":            0.6,
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
      - classified_intent: model-derived intent label
      - keyword_hits: matched tokens
      - platform_risk_score: float 0.0–1.0
      - is_flagged: True if classified as boast or panic
    Returns enriched posts sorted by timestamp.
    """
    enriched = []
    for post in posts:
        msg     = post.get("message", "")
        intent  = classify_intent(msg)
        hits    = extract_keyword_hits(msg)
        risk    = PLATFORM_RISK.get(post.get("platform", ""), 0.5)

        enriched.append({
            **post,
            "classified_intent":   intent,
            "keyword_hits":        hits,
            "platform_risk_score": risk,
            "is_flagged":          intent in ("boast", "panic"),
        })

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
        "handle":             "",
        "platform":           "",
        "timezone_hint":      "",
        "total_posts":        0,
        "flagged_posts":      0,
        "intent_counts":      {"boast": 0, "panic": 0, "neutral": 0},
        "platform_risk_score": 0.0,
    })

    for post in enriched_posts:
        author = post["author"]
        p      = profiles[author]
        p["handle"]             = author
        p["platform"]           = post.get("platform", "")
        p["timezone_hint"]      = post.get("timezone_hint", "")
        p["platform_risk_score"] = post.get("platform_risk_score", 0.5)
        p["total_posts"]        += 1
        p["intent_counts"][post["classified_intent"]] += 1
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
