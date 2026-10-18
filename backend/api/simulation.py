"""
backend/api/simulation.py
Dynamic Real-Time Attack Simulation Engine — Project RedString

Allows on-demand injection of arbitrary attacks with custom attacker aliases,
amounts, exploit mechanics, sleep/dormancy windows, and boast messages.
Maintains an in-memory singleton state so standard API endpoints immediately
reflect the active simulation, ranking the custom attacker at #1.
"""

from __future__ import annotations

import random
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from pydantic import BaseModel, Field


# ── Pydantic Request & Response Models ────────────────────────────────────────

class AttackLaunchRequest(BaseModel):
    attacker_alias: str = Field(default="Ghost_Unknown", description="Custom attacker pseudonym")
    amount_usd: float = Field(default=42000000.0, ge=1.0, description="Exploit amount in USD")
    sleep_start_hour: int = Field(default=4, ge=0, le=23, description="Sleep inactivity start (UTC hour 0-23)")
    sleep_end_hour: int = Field(default=11, ge=0, le=23, description="Sleep inactivity end (UTC hour 0-23)")
    exploit_type: str = Field(default="Reentrancy Exploit", description="Vulnerability or attack mechanism")
    boast_message: str = Field(
        default="42M drained and peeled across mixers.",
        description="Public boast / bragging message broadcast by the attacker",
    )


class AlertStatusResponse(BaseModel):
    is_under_attack: bool
    incident_id: str
    attacker_alias: str
    amount_usd: float
    timestamp_utc: str


# ── Window Math Utilities ─────────────────────────────────────────────────────

def get_blackout_hours(start_hour: int, end_hour: int) -> set[int]:
    """
    Returns the set of UTC hours spanning [start_hour, end_hour).
    Guarantees an inactivity window of at least 8 hours for consistent correlation.
    """
    span = (end_hour - start_hour) % 24
    length = max(8, span if span > 0 else 8)
    if span == 7:
        length = 8
    return {(start_hour + i) % 24 for i in range(length)}


# ── Synthetic Telemetry Generators ───────────────────────────────────────────

def generate_simulated_blockchain_txs(
    attacker_alias: str,
    amount_usd: float,
    sleep_start_hour: int,
    sleep_end_hour: int,
    exploit_type: str,
) -> list[dict[str, Any]]:
    """
    Generates a 3-hop peel chain:
      1. Genesis Root Exploit Wallet (0x..._ROOT_EXPLOIT)
      2. 3 Mixer Hop Wallets (0x..._MIXER_HOP_1..3)
      3. 32 Exit Cash-Out Wallets (0x..._EXIT_01..32)
    Enforces that zero transactions occur during [sleep_start_hour, sleep_end_hour).
    """
    blackout = get_blackout_hours(sleep_start_hour, sleep_end_hour)
    active_hours = [h for h in range(24) if h not in blackout]
    if not active_hours:
        active_hours = [(sleep_start_hour + 12) % 24]

    hex_seed = secrets.token_hex(4).upper()
    root_wallet = f"0x{hex_seed}_ROOT_EXPLOIT"
    mixer_wallets = [f"0x{hex_seed}_MIXER_HOP_{i+1}" for i in range(3)]
    exit_wallets = [f"0x{hex_seed}_EXIT_{i+1:02d}" for i in range(32)]

    now = datetime.now(timezone.utc)
    base_date = now - timedelta(days=4)

    txs: list[dict[str, Any]] = []
    tx_count = 0

    def make_active_ts(day_offset: int, hour_index: int, minute: int = 15) -> datetime:
        h = active_hours[hour_index % len(active_hours)]
        dt = base_date + timedelta(days=day_offset)
        return dt.replace(hour=h, minute=minute, second=random.randint(0, 59), microsecond=0)

    # 1. Root Exploit Inflow
    tx_count += 1
    root_ts = make_active_ts(0, 1, minute=14)
    txs.append({
        "tx_id": f"0xTX_{tx_count:06d}",
        "from_wallet": root_wallet,
        "to_wallet": root_wallet,
        "value_usd": round(amount_usd, 2),
        "timestamp_utc": root_ts.isoformat(),
        "hour_utc": root_ts.hour,
        "tx_type": "exploit_inflow",
    })

    # 2. 3 Mixer Hops
    remaining = amount_usd
    prev_wallet = root_wallet
    for hop_idx, mixer in enumerate(mixer_wallets, start=1):
        tx_count += 1
        hop_ts = make_active_ts(hop_idx, hop_idx * 2, minute=30)
        fee = remaining * random.uniform(0.008, 0.015)
        transfer_val = remaining - fee
        txs.append({
            "tx_id": f"0xTX_{tx_count:06d}",
            "from_wallet": prev_wallet,
            "to_wallet": mixer,
            "value_usd": round(transfer_val, 2),
            "timestamp_utc": hop_ts.isoformat(),
            "hour_utc": hop_ts.hour,
            "tx_type": "mixer_transfer",
            "mixer_hop": hop_idx,
        })
        prev_wallet = mixer
        remaining = transfer_val

    # 3. 32 Exit Cash-Out Wallets from final mixer
    weights = [random.uniform(0.015, 0.045) for _ in range(len(exit_wallets))]
    sum_w = sum(weights)
    shares = [(w / sum_w) * remaining for w in weights]

    final_mixer = mixer_wallets[-1]
    for i, exit_wallet in enumerate(exit_wallets):
        tx_count += 1
        exit_ts = make_active_ts(3 + (i // 11), i * 3, minute=(i * 7) % 60)
        txs.append({
            "tx_id": f"0xTX_{tx_count:06d}",
            "from_wallet": final_mixer,
            "to_wallet": exit_wallet,
            "value_usd": round(shares[i], 2),
            "timestamp_utc": exit_ts.isoformat(),
            "hour_utc": exit_ts.hour,
            "tx_type": "cash_out",
        })

    txs.sort(key=lambda t: t["timestamp_utc"])
    return txs


def generate_simulated_osint_chatter(
    attacker_alias: str,
    amount_usd: float,
    sleep_start_hour: int,
    sleep_end_hour: int,
    exploit_type: str,
    boast_message: str,
) -> list[dict[str, Any]]:
    """
    Generates OSINT chatter:
      - Primary attacker: strictly active outside [sleep_start_hour, sleep_end_hour),
        broadcasts boast & panic posts referencing the breach.
      - 4 Decoy background suspects with distinct sleep windows and low intent scores.
    """
    attacker_blackout = get_blackout_hours(sleep_start_hour, sleep_end_hour)
    attacker_active_hours = [h for h in range(24) if h not in attacker_blackout]
    if not attacker_active_hours:
        attacker_active_hours = [(sleep_start_hour + 12) % 24]

    now = datetime.now(timezone.utc)
    base_date = now - timedelta(days=5)

    posts: list[dict[str, Any]] = []

    # ── Attacker Posts ────────────────────────────────────────────────────────
    attacker_boasts = [
        f"{boast_message} {exploit_type} executed flawlessly on-chain.",
        f"we drained it clean lmaooo, {amount_usd:,.0f} and they still don't know who we are 🔥",
        f"absolute rug, no forensics can touch this {exploit_type}",
        "cleanest hack this quarter no cap, nobody is catching this ghost",
        "exit wallets are set, moved everything through mixers, flawless",
        "their on-chain analysts are clueless, patched 2h too late 😂",
        f"drained another batch across bridges, 42 million gone forever",
        "that protocol was begging to be exploited, clean sweep",
    ]

    attacker_panics = [
        "delete this NOW they're watching the chain and tracking the root wallet",
        "chainalysis alert just dropped on the main wallet, freeze order incoming!",
        "OPSEC failure on the mixer, abort second hop and move everything",
        "feds looking at bridging txns, lay low and don't touch the wallets for 48h",
        "someone is tipping them off, thermal imaging on the servers??? dark side asap",
        "my lawyer said don't post anything, wipe telegram caches right now",
        "tip off leak confirmed, move everything to cold storage ASAP",
    ]

    attacker_neutrals = [
        "anyone noticing gas fee spikes on the relayers?",
        "staying off-chain for a bit, see you around",
    ]

    # Generate 60 posts for attacker, evenly distributing across active hours
    for i in range(60):
        h = attacker_active_hours[i % len(attacker_active_hours)]
        day = (i // len(attacker_active_hours)) % 5
        ts = (base_date + timedelta(days=day)).replace(
            hour=h, minute=(i * 11) % 60, second=random.randint(0, 59), microsecond=0
        )

        if i == 0:
            msg = f"{boast_message} {exploit_type} executed. ${amount_usd:,.0f} drained from vault!"
            intent = "boast"
        elif i % 2 == 1:
            msg = random.choice(attacker_boasts)
            intent = "boast"
        elif i % 10 == 0:
            msg = random.choice(attacker_neutrals)
            intent = "neutral"
        else:
            msg = random.choice(attacker_panics)
            intent = "panic"

        posts.append({
            "post_id": f"{attacker_alias}_{i:04d}",
            "author": attacker_alias,
            "platform": "darkweb_forum",
            "timestamp_utc": ts.isoformat(),
            "hour_utc": ts.hour,
            "intent": intent,
            "message": msg,
            "timezone_hint": "UTC+0",
        })

    # ── 4 Decoy Suspects ──────────────────────────────────────────────────────
    decoys = [
        {
            "handle": "Cipher_Zero",
            "platform": "IRC",
            "sleep_start": (sleep_start_hour + 6) % 24,
            "timezone": "UTC+3",
            "risk": 0.6,
        },
        {
            "handle": "ByteBandit",
            "platform": "Telegram",
            "sleep_start": (sleep_start_hour + 12) % 24,
            "timezone": "UTC-5",
            "risk": 0.8,
        },
        {
            "handle": "ShadowNode",
            "platform": "IRC",
            "sleep_start": (sleep_start_hour + 18) % 24,
            "timezone": "UTC+8",
            "risk": 0.6,
        },
        {
            "handle": "EchoFlux",
            "platform": "darkweb_forum",
            "sleep_start": (sleep_start_hour + 10) % 24,
            "timezone": "UTC+1",
            "risk": 1.0,
        },
    ]

    decoy_neutral_pool = [
        "anyone else noticing weird gas spikes lately",
        "just reading the room, nothing special here",
        "market is volatile today, hodl everything",
        "thoughts on the new DeFi protocol upgrade?",
        "privacy coins are underrated in this market",
        "mixer fees are getting ridiculous rn",
        "what's the best chain for anonymity in 2024",
        "ZK rollups are the future tbh",
        "keeping my head down, see you folks later",
    ]

    for decoy in decoys:
        d_blackout = get_blackout_hours(decoy["sleep_start"], (decoy["sleep_start"] + 8) % 24)
        d_active = [h for h in range(24) if h not in d_blackout]
        for j in range(30):
            h = d_active[j % len(d_active)]
            day = (j // len(d_active)) % 5
            ts = (base_date + timedelta(days=day)).replace(
                hour=h, minute=(j * 17) % 60, second=random.randint(0, 59), microsecond=0
            )
            # Decoys are 90% neutral, 10% boast/panic
            if j == 5:
                intent = "boast"
                msg = "drained a few small tokens, nothing major"
            elif j == 15:
                intent = "panic"
                msg = "delete this log, alert on network"
            else:
                intent = "neutral"
                msg = random.choice(decoy_neutral_pool)

            posts.append({
                "post_id": f"{decoy['handle']}_{j:04d}",
                "author": decoy["handle"],
                "platform": decoy["platform"],
                "timestamp_utc": ts.isoformat(),
                "hour_utc": ts.hour,
                "intent": intent,
                "message": msg,
                "timezone_hint": decoy["timezone"],
            })

    posts.sort(key=lambda p: p["timestamp_utc"])
    return posts


# ── Simulation State Singleton ────────────────────────────────────────────────

class SimulationEngine:
    def __init__(self) -> None:
        self.is_under_attack: bool = False
        self.incident_id: str = "BASELINE-42M-HEIST"
        self.attacker_alias: str = "Ghost0x"
        self.amount_usd: float = 42000000.0
        self.sleep_start_hour: int = 3
        self.sleep_end_hour: int = 11
        self.exploit_type: str = "Reentrancy Exploit"
        self.boast_message: str = "42M drained and peeled across mixers."
        self.timestamp_utc: str = datetime.now(timezone.utc).isoformat()

        self._simulated_osint: list[dict[str, Any]] | None = None
        self._simulated_chain: list[dict[str, Any]] | None = None

    def launch_attack(self, req: AttackLaunchRequest) -> dict[str, Any]:
        """
        Launches an active attack simulation:
          - Generates synchronized on-chain peel chain and OSINT chatter.
          - Updates singleton state so all queries dynamically resolve this attack.
        """
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        launch_ts = datetime.now(timezone.utc).isoformat()

        chain_txs = generate_simulated_blockchain_txs(
            attacker_alias=req.attacker_alias,
            amount_usd=req.amount_usd,
            sleep_start_hour=req.sleep_start_hour,
            sleep_end_hour=req.sleep_end_hour,
            exploit_type=req.exploit_type,
        )

        osint_posts = generate_simulated_osint_chatter(
            attacker_alias=req.attacker_alias,
            amount_usd=req.amount_usd,
            sleep_start_hour=req.sleep_start_hour,
            sleep_end_hour=req.sleep_end_hour,
            exploit_type=req.exploit_type,
            boast_message=req.boast_message,
        )

        self.is_under_attack = True
        self.incident_id = incident_id
        self.attacker_alias = req.attacker_alias
        self.amount_usd = req.amount_usd
        self.sleep_start_hour = req.sleep_start_hour
        self.sleep_end_hour = req.sleep_end_hour
        self.exploit_type = req.exploit_type
        self.boast_message = req.boast_message
        self.timestamp_utc = launch_ts

        self._simulated_osint = osint_posts
        self._simulated_chain = chain_txs

        return {
            "status": "launched",
            "is_under_attack": True,
            "incident_id": self.incident_id,
            "attacker_alias": self.attacker_alias,
            "amount_usd": self.amount_usd,
            "sleep_window": f"{self.sleep_start_hour:02d}:00-{self.sleep_end_hour:02d}:00 UTC",
            "exploit_type": self.exploit_type,
            "boast_message": self.boast_message,
            "timestamp_utc": self.timestamp_utc,
            "txs_generated": len(chain_txs),
            "osint_posts_generated": len(osint_posts),
        }

    def reset(self) -> dict[str, Any]:
        """Resets the simulation engine back to baseline static dataset."""
        self.is_under_attack = False
        self.incident_id = "BASELINE-42M-HEIST"
        self.attacker_alias = "Ghost0x"
        self.amount_usd = 42000000.0
        self.sleep_start_hour = 3
        self.sleep_end_hour = 11
        self.exploit_type = "Reentrancy Exploit"
        self.boast_message = "42M drained and peeled across mixers."
        self.timestamp_utc = datetime.now(timezone.utc).isoformat()

        self._simulated_osint = None
        self._simulated_chain = None

        return {
            "status": "reset",
            "message": "Simulation reset to baseline state.",
            "is_under_attack": False,
            "timestamp_utc": self.timestamp_utc,
        }

    def get_alert_status(self) -> dict[str, Any]:
        """Returns the real-time breach alert state."""
        return {
            "is_under_attack": self.is_under_attack,
            "incident_id": self.incident_id,
            "attacker_alias": self.attacker_alias,
            "amount_usd": self.amount_usd,
            "timestamp_utc": self.timestamp_utc,
        }

    def get_osint_posts(self, baseline_fn: Any) -> list[dict[str, Any]]:
        if self.is_under_attack and self._simulated_osint is not None:
            return self._simulated_osint
        return baseline_fn()

    def get_chain_txs(self, baseline_fn: Any) -> list[dict[str, Any]]:
        if self.is_under_attack and self._simulated_chain is not None:
            return self._simulated_chain
        return baseline_fn()


# Global Singleton
simulation_engine = SimulationEngine()
