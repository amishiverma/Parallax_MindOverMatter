"""
attack_generator.py
Dynamic Telemetry & Attack Simulation Engine — Project RedString

Generates on-demand synthetic attacks with arbitrary parameters:
  - Custom attacker alias, exploit type, boast messages, and sleep windows
  - Synthetic Blockchain transaction graph (exploit root -> 3-hop peel chain -> 30+ exit/mixer wallets)
    with total dormancy during the attacker's sleep window
  - Synthetic OSINT chatter for attacker + 4 decoy background suspects with low intent scores
"""

import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

# ── Baseline Decoy Suspects ───────────────────────────────────────────────────
DECOY_SUSPECTS = [
    {
        "handle": "Sybil_R00t",
        "platform": "Telegram",
        "timezone_hint": "UTC+3",
        "sleep_start_utc": 22,
        "sleep_end_utc": 6,
        "keywords_bias": ["neutral"],
    },
    {
        "handle": "CryptoPhantom",
        "platform": "darkweb_forum",
        "timezone_hint": "UTC+1",
        "sleep_start_utc": 0,
        "sleep_end_utc": 8,
        "keywords_bias": ["neutral"],
    },
    {
        "handle": "VoidWalker",
        "platform": "IRC",
        "timezone_hint": "UTC+8",
        "sleep_start_utc": 14,
        "sleep_end_utc": 22,
        "keywords_bias": ["neutral"],
    },
    {
        "handle": "AnonMule_99",
        "platform": "IRC",
        "timezone_hint": "UTC-4",
        "sleep_start_utc": 12,
        "sleep_end_utc": 20,
        "keywords_bias": ["neutral"],
    },
]

DECOY_NEUTRAL_POSTS = [
    "monitoring the market trends today, gas is quiet",
    "anyone checking the new l2 rollup testnet metrics?",
    "just running routine node sync across endpoints",
    "liquidity depth seems standard on major dex pairs",
    "checking block finality times on secondary bridges",
    "reading through the governance proposal on security audit",
    "compiling cross-chain transaction data for review",
    "setting up new RPC relays for validator infra",
]


def _is_in_blackout(hour: int, start: int, end: int) -> bool:
    """Check if hour is inside [start, end) circular interval."""
    if start <= end:
        return start <= hour < end
    return hour >= start or hour < end


def generate_attack_simulation(
    attacker_alias: str = "Ghost_Unknown",
    amount_usd: float = 42000000.0,
    sleep_start_hour: int = 4,
    sleep_end_hour: int = 11,
    exploit_type: str = "Reentrancy Exploit",
    boast_message: str = "42M drained and peeled across mixers.",
    seed: int | None = None,
) -> dict[str, Any]:
    """
    Generate synthetic blockchain transactions and OSINT posts for a dynamic attack.
    Enforces that the attacker and blockchain dormancy perfectly align to [sleep_start_hour, sleep_end_hour).
    """
    rng = random.Random(seed if seed is not None else random.randint(1, 999999))
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"

    start_date = datetime(2024, 3, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_date = datetime(2024, 3, 15, 23, 59, 59, tzinfo=timezone.utc)
    total_seconds = int((end_date - start_date).total_seconds())

    # ─────────────────────────────────────────────────────────────────────────
    # 1. BLOCKCHAIN TRANSACTIONS
    # ─────────────────────────────────────────────────────────────────────────
    root_hex = f"0xROOT_{uuid.uuid4().hex[:8].upper()}"
    mixer_wallets = [f"0xMIXER_HOP_{i+1}_{uuid.uuid4().hex[:4].upper()}" for i in range(3)]
    exit_wallets = [f"0xEXIT_{i+1:02d}_{uuid.uuid4().hex[:4].upper()}" for i in range(32)]

    txs: list[dict] = []
    tx_counter = [0]

    def _add_tx(from_w: str, to_w: str, val: float, dt: datetime, tx_t: str, hop: int | None = None):
        tx_counter[0] += 1
        rec = {
            "tx_id": f"0xTX_{tx_counter[0]:06d}",
            "from_wallet": from_w,
            "to_wallet": to_w,
            "value_usd": round(val, 2),
            "timestamp_utc": dt.isoformat(),
            "hour_utc": dt.hour,
            "tx_type": tx_t,
        }
        if hop is not None:
            rec["mixer_hop"] = hop
        txs.append(rec)

    # Pick an active hour for root exploit (outside blackout)
    active_root_hour = (sleep_end_hour + 2) % 24
    if _is_in_blackout(active_root_hour, sleep_start_hour, sleep_end_hour):
        active_root_hour = (sleep_end_hour + 1) % 24
    root_ts = start_date + timedelta(hours=active_root_hour, minutes=15)

    _add_tx(root_hex, root_hex, amount_usd, root_ts, "exploit_inflow")

    # 3-hop peel chain through mixers
    current_sender = root_hex
    current_val = amount_usd
    current_ts = root_ts

    for hop_idx, mixer in enumerate(mixer_wallets):
        delay_h = rng.randint(2, 5)
        current_ts = current_ts + timedelta(hours=delay_h, minutes=rng.randint(5, 50))
        # Ensure never during blackout
        while _is_in_blackout(current_ts.hour, sleep_start_hour, sleep_end_hour):
            current_ts = current_ts + timedelta(hours=1)

        fee = current_val * rng.uniform(0.005, 0.015)
        send_val = current_val - fee
        _add_tx(current_sender, mixer, send_val, current_ts, "mixer_transfer", hop=hop_idx + 1)
        current_sender = mixer
        current_val = send_val

    # Fracture final mixer balance into 32 exit wallets
    final_mixer = mixer_wallets[-1]
    fractions = [rng.uniform(0.01, 0.05) for _ in range(len(exit_wallets) - 1)]
    sum_fractions = sum(fractions)
    scale = 0.96 / sum_fractions if sum_fractions > 0 else 1.0
    fractions = [f * scale for f in fractions]
    exit_values = [current_val * f for f in fractions]
    exit_values.append(current_val - sum(exit_values))  # remaining balance

    exit_ts = current_ts
    for i, exit_wallet in enumerate(exit_wallets):
        exit_ts = exit_ts + timedelta(minutes=rng.randint(15, 60))
        while _is_in_blackout(exit_ts.hour, sleep_start_hour, sleep_end_hour):
            exit_ts = exit_ts + timedelta(hours=1)
        _add_tx(final_mixer, exit_wallet, abs(exit_values[i]), exit_ts, "cash_out")

    # Add background jitter transactions across the 15-day range (never in blackout)
    for _ in range(60):
        rand_delta = timedelta(seconds=rng.randint(0, total_seconds))
        ts = start_date + rand_delta
        if _is_in_blackout(ts.hour, sleep_start_hour, sleep_end_hour):
            ts = ts.replace(hour=(sleep_end_hour + rng.randint(1, 4)) % 24)
        from_w = rng.choice(mixer_wallets + exit_wallets[:10])
        to_w = rng.choice(exit_wallets)
        if from_w != to_w:
            _add_tx(from_w, to_w, rng.uniform(10000, 500000), ts, "peel_hop")

    txs.sort(key=lambda t: t["timestamp_utc"])

    # ─────────────────────────────────────────────────────────────────────────
    # 2. OSINT POSTS GENERATION
    # ─────────────────────────────────────────────────────────────────────────
    posts: list[dict] = []
    post_counter = [0]

    def _add_post(author: str, platform: str, tz_hint: str, msg: str, dt: datetime, intent: str):
        post_counter[0] += 1
        posts.append({
            "post_id": f"{author[:2].upper()}_{post_counter[0]:04d}",
            "author": author,
            "platform": platform,
            "timestamp_utc": dt.isoformat(),
            "hour_utc": dt.hour,
            "message": msg,
            "timezone_hint": tz_hint,
            "intent": intent,
        })

    # Attacker messages
    attacker_boast_pool = [
        boast_message,
        f"cleanest {exploit_type} hack this year, million dollar drain completed no cap",
        f"we drained the liquidity clean lmaooo, nobody is catching this trade",
        "exit wallets are set across mixers, we are ghosts in the chain",
        "they patched it 2h too late, absolute rug",
    ]
    attacker_panic_pool = [
        "delete this NOW they are watching the chain alerts",
        "chainalysis alert just dropped, freeze order incoming move EVERYTHING",
        "opsec failure on the second bridge, lay low for 48h minimum",
        "feds looking at bridge txns, don't touch the funds",
        "someone is tipping them off, move the wallets asap",
    ]

    # Generate 45 attacker posts outside their sleep window (100% boast/panic flags, darkweb_forum)
    for i in range(45):
        rand_delta = timedelta(seconds=rng.randint(0, total_seconds))
        post_ts = start_date + rand_delta
        while _is_in_blackout(post_ts.hour, sleep_start_hour, sleep_end_hour):
            post_ts = post_ts + timedelta(hours=1)

        if i % 2 == 0:
            msg = rng.choice(attacker_boast_pool)
            intent = "boast"
        else:
            msg = rng.choice(attacker_panic_pool)
            intent = "panic"

        _add_post(
            author=attacker_alias,
            platform="darkweb_forum",
            tz_hint="UTC+0",
            msg=msg,
            dt=post_ts,
            intent=intent,
        )

    # Generate decoy posts for 4 suspects (low intent, neutral bias, different sleep windows)
    for decoy in DECOY_SUSPECTS:
        for _ in range(35):
            rand_delta = timedelta(seconds=rng.randint(0, total_seconds))
            post_ts = start_date + rand_delta
            while _is_in_blackout(post_ts.hour, decoy["sleep_start_utc"], decoy["sleep_end_utc"]):
                post_ts = post_ts + timedelta(hours=1)

            _add_post(
                author=decoy["handle"],
                platform=decoy["platform"],
                tz_hint=decoy["timezone_hint"],
                msg=rng.choice(DECOY_NEUTRAL_POSTS),
                dt=post_ts,
                intent="neutral",
            )

    posts.sort(key=lambda p: p["timestamp_utc"])

    return {
        "incident_id": incident_id,
        "attacker_alias": attacker_alias,
        "amount_usd": amount_usd,
        "sleep_start_hour": sleep_start_hour,
        "sleep_end_hour": sleep_end_hour,
        "exploit_type": exploit_type,
        "boast_message": boast_message,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "posts": posts,
        "txs": txs,
    }
