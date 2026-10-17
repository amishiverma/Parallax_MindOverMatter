"""
generate_mock_data.py
Phase 1 — Project RedString
Produces two deterministic synthetic datasets:
  1. osint_chatter.json  — 5 suspects, 200+ timestamped forum/Telegram posts
  2. blockchain_txs.json — $42M exploit wallet fracturing through 3 mixer hops
                          into 30 exit wallets

All randomness is seeded (SEED=42) for full reproducibility.
Sleep blackout window for suspect 'Ghost0x': 03:00–11:00 UTC
The same 8-hour dormancy window is mirrored in the blockchain timestamps.
"""

import json
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
SEED = 42
OUTPUT_DIR = Path(__file__).parent
TOTAL_POSTS = 210          # > 200 as specified
START_DATE  = datetime(2024, 3, 1, 0, 0, 0, tzinfo=timezone.utc)
END_DATE    = datetime(2024, 3, 15, 23, 59, 59, tzinfo=timezone.utc)

rng = random.Random(SEED)

# ── Suspect Profiles ──────────────────────────────────────────────────────────
SUSPECTS = [
    {
        "handle":   "Ghost0x",
        "platform": "Telegram",
        "timezone_hint": "UTC+0",
        "sleep_start_utc": 3,   # 03:00 UTC  ← primary suspect blackout
        "sleep_end_utc":   11,  # 11:00 UTC
        "post_weight":     0.35,
        "keywords_bias":   ["boast", "panic"],
    },
    {
        "handle":   "n0_trace",
        "platform": "darkweb_forum",
        "timezone_hint": "UTC-5",
        "sleep_start_utc": 6,
        "sleep_end_utc":   14,
        "post_weight":     0.20,
        "keywords_bias":   ["boast"],
    },
    {
        "handle":   "Sybil_R00t",
        "platform": "Telegram",
        "timezone_hint": "UTC+3",
        "sleep_start_utc": 22,
        "sleep_end_utc":   6,
        "post_weight":     0.20,
        "keywords_bias":   ["panic"],
    },
    {
        "handle":   "CryptoPhantom",
        "platform": "darkweb_forum",
        "timezone_hint": "UTC+1",
        "sleep_start_utc": 0,
        "sleep_end_utc":   8,
        "post_weight":     0.15,
        "keywords_bias":   ["neutral"],
    },
    {
        "handle":   "VoidWalker",
        "platform": "IRC",
        "timezone_hint": "UTC+8",
        "sleep_start_utc": 14,
        "sleep_end_utc":   22,
        "post_weight":     0.10,
        "keywords_bias":   ["boast", "neutral"],
    },
]

KEYWORD_POOLS = {
    "boast": [
        "we drained it clean lmaooo",
        "42 million and they still don't know who we are 🔥",
        "absolute rug, no forensics can touch this",
        "moved another 3M through mixers, flawless",
        "nobody is catching this trade",
        "that protocol was begging to be exploited",
        "exit wallets are set, we're ghosts",
        "cleanest hack this quarter no cap",
        "they patched it 2h too late 😂",
        "their on-chain analysts are clueless",
    ],
    "panic": [
        "delete this NOW they're watching the chain",
        "chainalysis alert just dropped on the main wallet!!!",
        "freeze order incoming, move EVERYTHING",
        "don't touch the wallets for 48h minimum",
        "feds looking at bridging txns, lay low",
        "OPSEC failure on the mixer, abort second hop",
        "someone is tipping them off, internal leak?",
        "thermal imaging on the servers???",
        "my lawyer said don't post anything",
        "if you see this message me ASAP dark side",
    ],
    "neutral": [
        "anyone else noticing weird gas spikes lately",
        "just reading the room, nothing special",
        "market is volatile, hodl everything",
        "thoughts on the new DeFi protocol?",
        "privacy coins are underrated",
        "mixer fees are ridiculous rn",
        "what's the best chain for anonymity in 2024",
        "anyone tried the new Tornado fork?",
        "ZK rollups are the future tbh",
        "staying off-chain for a bit, see you around",
    ],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_in_blackout(hour: int, sleep_start: int, sleep_end: int) -> bool:
    """Return True if `hour` falls inside [sleep_start, sleep_end)."""
    if sleep_start < sleep_end:
        return sleep_start <= hour < sleep_end
    else:  # wraps midnight
        return hour >= sleep_start or hour < sleep_end


def _random_active_ts(suspect: dict, rng: random.Random) -> datetime:
    """Generate a UTC timestamp that is NOT in the suspect's sleep window."""
    for _ in range(1000):
        delta_s = rng.randint(0, int((END_DATE - START_DATE).total_seconds()))
        ts = START_DATE + timedelta(seconds=delta_s)
        if not _is_in_blackout(ts.hour, suspect["sleep_start_utc"], suspect["sleep_end_utc"]):
            return ts
    # Fallback (should never happen with wide date range)
    return START_DATE + timedelta(hours=12)


def _pick_keyword_text(bias: list[str], rng: random.Random) -> tuple[str, str]:
    """Return (intent, message) based on bias pool."""
    intent = rng.choice(bias)
    msg    = rng.choice(KEYWORD_POOLS[intent])
    return intent, msg

# ── Generate OSINT Chatter ────────────────────────────────────────────────────

def generate_osint_chatter() -> list[dict]:
    posts = []
    # Distribute TOTAL_POSTS weighted by suspect post_weight
    weights      = [s["post_weight"] for s in SUSPECTS]
    total_weight = sum(weights)
    counts       = [round(TOTAL_POSTS * w / total_weight) for w in weights]
    # Fix rounding drift
    counts[-1] = TOTAL_POSTS - sum(counts[:-1])

    for suspect, count in zip(SUSPECTS, counts):
        for i in range(count):
            ts     = _random_active_ts(suspect, rng)
            intent, msg = _pick_keyword_text(suspect["keywords_bias"], rng)
            posts.append({
                "post_id":        f"{suspect['handle']}_{i:04d}",
                "author":         suspect["handle"],
                "platform":       suspect["platform"],
                "timestamp_utc":  ts.isoformat(),
                "hour_utc":       ts.hour,
                "intent":         intent,
                "message":        msg,
                "timezone_hint":  suspect["timezone_hint"],
            })

    # Sort chronologically
    posts.sort(key=lambda p: p["timestamp_utc"])
    return posts

# ── Generate Blockchain Transactions ─────────────────────────────────────────

ROOT_WALLET   = "0xROOT_EXPLOIT_42M"
MIXER_WALLETS = [f"0xMIXER_HOP_{i+1}" for i in range(3)]
EXIT_WALLETS  = [f"0xEXIT_{i+1:02d}" for i in range(30)]

# Ghost0x blackout: 03:00-11:00 UTC → blockchain is also dormant in that window
BLOCKCHAIN_SLEEP_START = 3
BLOCKCHAIN_SLEEP_END   = 11

TOTAL_VALUE_USD = 42_000_000


def _random_chain_ts(rng: random.Random) -> datetime:
    """Generate a blockchain tx timestamp outside the 03:00–11:00 UTC blackout."""
    for _ in range(1000):
        delta_s = rng.randint(0, int((END_DATE - START_DATE).total_seconds()))
        ts = START_DATE + timedelta(seconds=delta_s)
        if not _is_in_blackout(ts.hour, BLOCKCHAIN_SLEEP_START, BLOCKCHAIN_SLEEP_END):
            return ts
    return START_DATE + timedelta(hours=13)


def generate_blockchain_txs() -> list[dict]:
    txs = []
    tx_counter = [0]

    def _tx(from_w, to_w, value, ts, tx_type, hop=None):
        tx_counter[0] += 1
        rec = {
            "tx_id":         f"0xTX_{tx_counter[0]:06d}",
            "from_wallet":   from_w,
            "to_wallet":     to_w,
            "value_usd":     round(value, 2),
            "timestamp_utc": ts.isoformat(),
            "hour_utc":      ts.hour,
            "tx_type":       tx_type,
        }
        if hop is not None:
            rec["mixer_hop"] = hop
        txs.append(rec)

    # 1 — Root exploit tx (single large inflow)
    root_ts = START_DATE + timedelta(hours=13, minutes=7)  # 13:07 UTC, active window
    _tx(ROOT_WALLET, ROOT_WALLET, TOTAL_VALUE_USD, root_ts, "exploit_inflow")

    # 2 — 3 mixer hops: root → mixer1 → mixer2 → mixer3
    hop_ts    = root_ts
    remaining = TOTAL_VALUE_USD

    for hop_idx, mixer in enumerate(MIXER_WALLETS):
        delay_h  = rng.randint(1, 6)
        hop_ts   = hop_ts + timedelta(hours=delay_h, minutes=rng.randint(5, 55))
        # Ensure not in blackout
        if _is_in_blackout(hop_ts.hour, BLOCKCHAIN_SLEEP_START, BLOCKCHAIN_SLEEP_END):
            hop_ts = hop_ts.replace(hour=12, minute=rng.randint(0, 59))
        fee = remaining * rng.uniform(0.005, 0.015)
        _tx(ROOT_WALLET if hop_idx == 0 else MIXER_WALLETS[hop_idx - 1],
            mixer, remaining - fee, hop_ts, "mixer_transfer", hop=hop_idx + 1)
        remaining -= fee

    # 3 — 30 exit/cash-out wallets from final mixer
    final_mixer   = MIXER_WALLETS[-1]
    exit_ts_base  = hop_ts
    exit_values   = []
    for _ in range(29):
        frac = rng.uniform(0.01, 0.06)
        exit_values.append(remaining * frac)
    exit_values.append(remaining - sum(exit_values))  # last wallet gets remainder

    for i, exit_wallet in enumerate(EXIT_WALLETS):
        delay_m = rng.randint(10, 180)
        ets = exit_ts_base + timedelta(minutes=delay_m * (i + 1))
        # Skip blackout
        if _is_in_blackout(ets.hour, BLOCKCHAIN_SLEEP_START, BLOCKCHAIN_SLEEP_END):
            ets = ets + timedelta(hours=9)  # push past 11:00
        _tx(final_mixer, exit_wallet, abs(exit_values[i]), ets, "cash_out")

    txs.sort(key=lambda t: t["timestamp_utc"])
    return txs

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    chatter = generate_osint_chatter()
    blockchain = generate_blockchain_txs()

    osint_path = OUTPUT_DIR / "osint_chatter.json"
    chain_path = OUTPUT_DIR / "blockchain_txs.json"

    with open(osint_path, "w", encoding="utf-8") as f:
        json.dump(chatter, f, indent=2, ensure_ascii=False)

    with open(chain_path, "w", encoding="utf-8") as f:
        json.dump(blockchain, f, indent=2, ensure_ascii=False)

    print(f"[OK] osint_chatter.json    — {len(chatter)} posts")
    print(f"[OK] blockchain_txs.json  — {len(blockchain)} transactions")
    print(f"      Root exploit value   : ${TOTAL_VALUE_USD:,.0f}")
    print(f"      Exit wallets         : {len(EXIT_WALLETS)}")
    print(f"      Ghost0x blackout     : {BLOCKCHAIN_SLEEP_START:02d}:00–{BLOCKCHAIN_SLEEP_END:02d}:00 UTC")


if __name__ == "__main__":
    main()
