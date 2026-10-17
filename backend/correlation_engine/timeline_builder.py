"""
timeline_builder.py
Correlation Engine — Phase 4, Project RedString
Constructs a unified chronological timeline merging OSINT posts and
blockchain transactions, annotated with correlation context.
Output is a JSON-ready list sorted by timestamp_utc.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.osint_engine.parser import parse_feed
from backend.correlation_engine.correlator import run_correlation

DATA_DIR = Path(__file__).parent.parent / "data" / "raw"

# Severity band thresholds (applied to OSINT + TX events)
SEVERITY_BANDS = [
    (0.80, "CRITICAL"),
    (0.55, "HIGH"),
    (0.30, "MEDIUM"),
    (0.00, "LOW"),
]


def _severity(score: float) -> str:
    for threshold, label in SEVERITY_BANDS:
        if score >= threshold:
            return label
    return "LOW"


def _parse_iso(ts: str) -> datetime:
    """Parse ISO-8601 string to UTC-aware datetime.
    Handles both +00:00 and Z suffixes (Python <3.11 fromisoformat rejects Z).
    """
    ts = ts.replace("Z", "+00:00")
    dt = datetime.fromisoformat(ts)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


# ── Event Builders ────────────────────────────────────────────────────────────

def _osint_event(post: dict, suspect_prob: dict[str, float]) -> dict[str, Any]:
    """Convert enriched OSINT post → timeline event."""
    author = post["author"]
    prob   = suspect_prob.get(author, 0.0)
    intent = post.get("classified_intent", "neutral")

    # Intent-based risk bump
    intent_risk = {"panic": 0.8, "boast": 0.6, "neutral": 0.2}.get(intent, 0.2)
    event_score = round((prob * 0.7) + (intent_risk * 0.3), 4)

    return {
        "event_id":       post["post_id"],
        "type":           "osint_post",
        "timestamp_utc":  post["timestamp_utc"],
        "hour_utc":       post["hour_utc"],
        "actor":          author,
        "platform":       post.get("platform", ""),
        "message":        post.get("message", ""),
        "intent":         intent,
        "is_flagged":     post.get("is_flagged", False),
        "keyword_hits":   post.get("keyword_hits", {}),
        "risk_score":     event_score,
        "severity":       _severity(event_score),
        "suspect_probability": round(prob, 4),
    }


def _chain_event(tx: dict, global_prob: float) -> dict[str, Any]:
    """Convert blockchain tx → timeline event."""
    tx_type = tx["tx_type"]

    # TX-type-based risk
    type_risk = {
        "exploit_inflow":  1.0,
        "mixer_transfer":  0.75,
        "cash_out":        0.5,
    }.get(tx_type, 0.4)

    event_score = round((global_prob * 0.6) + (type_risk * 0.4), 4)

    event = {
        "event_id":       tx["tx_id"],
        "type":           "blockchain_tx",
        "timestamp_utc":  tx["timestamp_utc"],
        "hour_utc":       tx["hour_utc"],
        "actor":          tx["from_wallet"],
        "from_wallet":    tx["from_wallet"],
        "to_wallet":      tx["to_wallet"],
        "value_usd":      tx["value_usd"],
        "tx_type":        tx_type,
        "risk_score":     event_score,
        "severity":       _severity(event_score),
        "suspect_probability": round(global_prob, 4),
    }
    if "mixer_hop" in tx:
        event["mixer_hop"] = tx["mixer_hop"]
    return event


# ── Master Timeline Builder ───────────────────────────────────────────────────

def build_timeline(
    osint_posts: list[dict] | None = None,
    chain_txs:   list[dict] | None = None,
    include_neutral: bool = False,
) -> dict[str, Any]:
    """
    Merge OSINT + blockchain events into a single sorted timeline.
    Args:
      include_neutral: if False, drops OSINT neutral posts (reduces noise)
    Returns:
      {
        events: [sorted timeline events...],
        stats:  {total, osint_count, chain_count, flagged_count, ...},
        suspect_rank: [...],   # from correlator
      }
    """
    # Load data
    if osint_posts is None:
        with open(DATA_DIR / "osint_chatter.json", encoding="utf-8") as f:
            osint_posts = json.load(f)
    if chain_txs is None:
        with open(DATA_DIR / "blockchain_txs.json", encoding="utf-8") as f:
            chain_txs = json.load(f)

    # Run correlation to get probabilities
    correlation = run_correlation(osint_posts, chain_txs)
    suspect_prob = {s["handle"]: s["probability"] for s in correlation["suspects"]}
    global_prob  = correlation["metadata"]["primary_probability"]

    # Enrich OSINT posts
    enriched_posts = parse_feed(osint_posts)

    events: list[dict] = []

    for post in enriched_posts:
        if not include_neutral and post.get("classified_intent") == "neutral":
            continue
        events.append(_osint_event(post, suspect_prob))

    for tx in chain_txs:
        events.append(_chain_event(tx, global_prob))

    # Sort chronologically
    events.sort(key=lambda e: _parse_iso(e["timestamp_utc"]))

    # Annotate sequence index
    for idx, ev in enumerate(events):
        ev["seq"] = idx

    # Stats
    osint_events  = [e for e in events if e["type"] == "osint_post"]
    chain_events  = [e for e in events if e["type"] == "blockchain_tx"]
    flagged       = [e for e in events if e.get("is_flagged") or e.get("risk_score", 0) >= 0.55]
    critical      = [e for e in events if e.get("severity") in ("CRITICAL", "HIGH")]

    return {
        "events": events,
        "stats": {
            "total_events":    len(events),
            "osint_count":     len(osint_events),
            "chain_count":     len(chain_events),
            "flagged_count":   len(flagged),
            "critical_count":  len(critical),
            "date_range_start": events[0]["timestamp_utc"] if events else None,
            "date_range_end":   events[-1]["timestamp_utc"] if events else None,
        },
        "suspect_rank": correlation["suspects"],
        "metadata": {
            "include_neutral": include_neutral,
            "primary_suspect": correlation["metadata"]["primary_suspect"],
            "global_probability": global_prob,
        },
    }


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    result = build_timeline(include_neutral=False)
    stats  = result["stats"]
    meta   = result["metadata"]
    print(f"[timeline] Events={stats['total_events']} | "
          f"OSINT={stats['osint_count']} | Chain={stats['chain_count']} | "
          f"Flagged={stats['flagged_count']} | Critical={stats['critical_count']}")
    print(f"           Date range: {stats['date_range_start']} → {stats['date_range_end']}")
    print(f"           Primary suspect: {meta['primary_suspect']} "
          f"(P={meta['global_probability']:.4f})")
    print(f"\n  Last 5 HIGH+ events:")
    critical_events = [e for e in result["events"] if e["severity"] in ("CRITICAL", "HIGH")]
    for ev in critical_events[-5:]:
        actor = ev.get("actor", "?")
        msg   = ev.get("message") or f"TX {ev.get('tx_type')} ${ev.get('value_usd', 0):,.0f}"
        print(f"    [{ev['severity']:8s}] {ev['timestamp_utc'][:19]} | {actor:15s} | {msg[:60]}")
