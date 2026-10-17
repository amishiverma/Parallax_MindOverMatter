"""
correlation_engine.py
=====================
Module: The Correlation Engine
Agent:  The Tracker (Sanchita)
Project: RedString — Quantitative OSINT Blockchain Engine

Responsibilities:
  - Accept a suspect's OSINT-derived sleep profile (sleep_start_hour →
    sleep_end_hour in 24-h format) and a wallet's raw transaction history.
  - Calculate a correlation score [0.0 – 1.0] that measures how closely
    the wallet's *dormant* periods align with the suspect's *sleep* periods.
  - A high score (≥ 0.85) means the wallet was almost exclusively active
    while the suspect was awake → strong behavioural fingerprint match.
  - A low score (≈ 0.0) means the wallet fires heavily during the suspect's
    supposed sleep hours → likely a different actor or automated noise.

Output is clean JSON-serialisable data for the FastAPI layer in /backend/api.

Scoring maths (see calculate_sleep_correlation docstring for details)
----------------------------------------------------------------------
  awake_tx_ratio  = transactions_outside_sleep_window / total_transactions
  raw_score       = awake_tx_ratio                  (linear in [0, 1])
  final_score     = clip(raw_score * CONFIDENCE_SCALE, 0.0, 1.0)

  CONFIDENCE_SCALE caps the theoretical maximum at 0.97 to acknowledge that
  perfect correlation is never provable from transaction data alone.
"""

import pandas as pd
import numpy as np
from datetime import datetime


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CONFIDENCE_SCALE: float = 0.97   # shrinks the ceiling away from 1.0
SCORE_HIGH_THRESHOLD: float = 0.85
SCORE_LOW_THRESHOLD: float = 0.40


# ---------------------------------------------------------------------------
# Core Correlation Function
# ---------------------------------------------------------------------------

def calculate_sleep_correlation(
    suspect_sleep_profile: dict,
    wallet_transactions: list[dict],
) -> dict:
    """
    Measure the behavioural alignment between a suspect's sleep schedule and
    a wallet's transaction activity pattern.

    The core intuition: a suspect-controlled wallet will be **dormant** during
    the suspect's **sleep hours** and **active** during the suspect's **awake
    hours**.  The more a wallet's activity fits that pattern, the higher the
    correlation score.

    Parameters
    ----------
    suspect_sleep_profile : dict
        OSINT-derived sleep schedule. Required keys::

            {
                "suspect_id"      : str,   # e.g. "U1"
                "sleep_start_hour": int,   # 24-h format, e.g. 2  (02:00 AM)
                "sleep_end_hour"  : int,   # 24-h format, e.g. 7  (07:00 AM)
            }

        Supports **overnight windows** (sleep_start_hour > sleep_end_hour),
        e.g. sleeping 23:00 → 06:00.

    wallet_transactions : list[dict]
        Raw transaction records. Each dict must contain at minimum::

            {
                "wallet_id" : str,
                "timestamp" : str,   # ISO-8601, e.g. "2023-10-27T02:34:00"
                ... (additional fields are tolerated and ignored)
            }

    Returns
    -------
    dict
        JSON-serialisable result::

            {
                "suspect_id"            : str,
                "wallet_id"             : str,
                "correlation_score"     : float,   # [0.0 – 1.0]
                "awake_tx_count"        : int,
                "sleep_tx_count"        : int,
                "total_tx_count"        : int,
                "awake_tx_ratio"        : float,   # raw metric
                "sleep_window"          : str,      # human-readable
                "reason"                : str,
                "confidence"            : str       # "HIGH" | "MEDIUM" | "LOW"
            }

    Raises
    ------
    ValueError
        If required keys are missing from inputs, or if wallet_transactions
        is empty.

    Examples
    --------
    >>> profile = {"suspect_id": "U1", "sleep_start_hour": 2, "sleep_end_hour": 7}
    >>> txns = [
    ...     {"wallet_id": "W1", "timestamp": "2023-10-27T09:00:00", "amount": 500},
    ...     {"wallet_id": "W1", "timestamp": "2023-10-27T14:00:00", "amount": 300},
    ...     {"wallet_id": "W1", "timestamp": "2023-10-27T20:00:00", "amount": 200},
    ... ]
    >>> result = calculate_sleep_correlation(profile, txns)
    >>> result["correlation_score"]   # all 3 txns during awake hours
    0.97
    """
    # ------------------------------------------------------------------
    # Input validation
    # ------------------------------------------------------------------
    required_profile_keys = {"suspect_id", "sleep_start_hour", "sleep_end_hour"}
    missing_profile = required_profile_keys - set(suspect_sleep_profile.keys())
    if missing_profile:
        raise ValueError(f"suspect_sleep_profile missing keys: {missing_profile}")

    if not wallet_transactions:
        raise ValueError("wallet_transactions must not be empty.")

    suspect_id   = suspect_sleep_profile["suspect_id"]
    sleep_start  = int(suspect_sleep_profile["sleep_start_hour"])
    sleep_end    = int(suspect_sleep_profile["sleep_end_hour"])

    if not (0 <= sleep_start <= 23) or not (0 <= sleep_end <= 23):
        raise ValueError("sleep_start_hour and sleep_end_hour must be in [0, 23].")

    # ------------------------------------------------------------------
    # Step 1: Load transactions into a DataFrame and parse timestamps
    # ------------------------------------------------------------------
    df = pd.DataFrame(wallet_transactions)

    if "timestamp" not in df.columns:
        raise ValueError("Each transaction dict must contain a 'timestamp' key.")
    if "wallet_id" not in df.columns:
        raise ValueError("Each transaction dict must contain a 'wallet_id' key.")

    df["parsed_ts"] = pd.to_datetime(df["timestamp"], format="mixed", utc=False)
    df["hour"]      = df["parsed_ts"].dt.hour   # integer 0–23

    wallet_id     = df["wallet_id"].iloc[0]     # use first wallet as label
    total_tx      = len(df)

    # ------------------------------------------------------------------
    # Step 2: Classify each transaction as "awake" or "sleep"
    #
    # Overnight window example: sleep 23:00 → 06:00
    #   is_sleep = (hour >= 23) OR (hour < 6)
    #
    # Normal window example: sleep 02:00 → 07:00
    #   is_sleep = (hour >= 2) AND (hour < 7)
    # ------------------------------------------------------------------
    if sleep_start < sleep_end:
        # Normal window (does not cross midnight)
        is_sleep_mask = (df["hour"] >= sleep_start) & (df["hour"] < sleep_end)
    else:
        # Overnight window (crosses midnight)
        is_sleep_mask = (df["hour"] >= sleep_start) | (df["hour"] < sleep_end)

    sleep_tx_count = int(is_sleep_mask.sum())
    awake_tx_count = total_tx - sleep_tx_count

    # ------------------------------------------------------------------
    # Step 3: Calculate the correlation score
    #
    # awake_tx_ratio ∈ [0.0, 1.0]
    #   → 1.0 means zero activity during sleep  (perfect match)
    #   → 0.0 means all activity during sleep   (no match / noise)
    #
    # We scale by CONFIDENCE_SCALE (0.97) to acknowledge that empirical
    # data can never prove a perfect behavioural match.
    # ------------------------------------------------------------------
    awake_tx_ratio  = awake_tx_count / total_tx                  # numpy float64
    raw_score       = float(awake_tx_ratio)
    correlation_score = float(np.clip(raw_score * CONFIDENCE_SCALE, 0.0, 1.0))
    correlation_score = round(correlation_score, 4)

    # ------------------------------------------------------------------
    # Step 4: Build human-readable sleep window and reason string
    # ------------------------------------------------------------------
    def fmt_hour(h: int) -> str:
        return datetime.strptime(str(h), "%H").strftime("%I:%M %p")

    sleep_window = f"{fmt_hour(sleep_start)} → {fmt_hour(sleep_end)}"

    if correlation_score >= SCORE_HIGH_THRESHOLD:
        reason     = "Matching dormant cycles — wallet silent during suspect's sleep window"
        confidence = "HIGH"
    elif correlation_score >= SCORE_LOW_THRESHOLD:
        reason     = "Partial overlap — some wallet activity during suspect's sleep hours"
        confidence = "MEDIUM"
    else:
        reason     = "Mismatched cycles — wallet heavily active during suspect's sleep window"
        confidence = "LOW"

    return {
        "suspect_id":        suspect_id,
        "wallet_id":         wallet_id,
        "correlation_score": correlation_score,
        "awake_tx_count":    awake_tx_count,
        "sleep_tx_count":    sleep_tx_count,
        "total_tx_count":    total_tx,
        "awake_tx_ratio":    round(float(awake_tx_ratio), 4),
        "sleep_window":      sleep_window,
        "reason":            reason,
        "confidence":        confidence,
    }


# ---------------------------------------------------------------------------
# Batch Helper: score multiple wallets against one suspect profile
# ---------------------------------------------------------------------------

def batch_correlate(
    suspect_sleep_profile: dict,
    wallet_transaction_map: dict[str, list[dict]],
) -> list[dict]:
    """
    Convenience wrapper — score multiple wallets at once and return them
    sorted by correlation score (descending).

    Parameters
    ----------
    suspect_sleep_profile : dict
        Same format as ``calculate_sleep_correlation``.
    wallet_transaction_map : dict[str, list[dict]]
        Keys are wallet_id labels, values are their transaction lists.

    Returns
    -------
    list[dict]
        Sorted list of correlation result dicts (highest score first).
    """
    results = []
    for wallet_id, txns in wallet_transaction_map.items():
        try:
            result = calculate_sleep_correlation(suspect_sleep_profile, txns)
            results.append(result)
        except ValueError as exc:
            results.append({
                "wallet_id": wallet_id,
                "error": str(exc),
                "correlation_score": None,
            })

    results.sort(key=lambda r: r.get("correlation_score") or 0.0, reverse=True)
    return results


# ---------------------------------------------------------------------------
# Quick self-test (run directly: python correlation_engine.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")  # fix Windows cp1252 console encoding
    import json

    profile = {
        "suspect_id":       "U1_Sanchita",
        "sleep_start_hour": 2,
        "sleep_end_hour":   7,
    }

    print("=" * 60)
    print("TEST 1 — Perfect awake-hours wallet (expect HIGH score)")
    print("=" * 60)
    perfect_match_txns = [
        {"wallet_id": "W_PerfectMatch", "timestamp": "2023-10-27T09:00:00", "amount": 500},
        {"wallet_id": "W_PerfectMatch", "timestamp": "2023-10-27T13:30:00", "amount": 300},
        {"wallet_id": "W_PerfectMatch", "timestamp": "2023-10-27T20:00:00", "amount": 200},
        {"wallet_id": "W_PerfectMatch", "timestamp": "2023-10-27T22:59:00", "amount": 750},
    ]
    r1 = calculate_sleep_correlation(profile, perfect_match_txns)
    print(json.dumps(r1, indent=2))

    print("\n" + "=" * 60)
    print("TEST 2 — Bot active during sleep (expect LOW score)")
    print("=" * 60)
    sleep_active_txns = [
        {"wallet_id": "W_SleepBot", "timestamp": "2023-10-27T02:15:00", "amount": 1000},
        {"wallet_id": "W_SleepBot", "timestamp": "2023-10-27T03:40:00", "amount": 800},
        {"wallet_id": "W_SleepBot", "timestamp": "2023-10-27T05:10:00", "amount": 600},
        {"wallet_id": "W_SleepBot", "timestamp": "2023-10-27T06:55:00", "amount": 400},
    ]
    r2 = calculate_sleep_correlation(profile, sleep_active_txns)
    print(json.dumps(r2, indent=2))

    print("\n" + "=" * 60)
    print("TEST 3 — Mixed activity (expect MEDIUM score)")
    print("=" * 60)
    mixed_txns = [
        {"wallet_id": "W_Mixed", "timestamp": "2023-10-27T08:00:00", "amount": 200},
        {"wallet_id": "W_Mixed", "timestamp": "2023-10-27T03:00:00", "amount": 900},  # sleep
        {"wallet_id": "W_Mixed", "timestamp": "2023-10-27T14:00:00", "amount": 400},
        {"wallet_id": "W_Mixed", "timestamp": "2023-10-27T19:00:00", "amount": 300},
    ]
    r3 = calculate_sleep_correlation(profile, mixed_txns)
    print(json.dumps(r3, indent=2))

    print("\n" + "=" * 60)
    print("TEST 4 -- Overnight sleep window (23:00 -> 06:00)")
    print("=" * 60)
    night_owl_profile = {
        "suspect_id":       "U2_NightOwl",
        "sleep_start_hour": 23,
        "sleep_end_hour":   6,
    }
    night_txns = [
        {"wallet_id": "W_NightOwl", "timestamp": "2023-10-27T07:00:00", "amount": 300},
        {"wallet_id": "W_NightOwl", "timestamp": "2023-10-27T12:00:00", "amount": 500},
        {"wallet_id": "W_NightOwl", "timestamp": "2023-10-27T20:00:00", "amount": 700},
    ]
    r4 = calculate_sleep_correlation(night_owl_profile, night_txns)
    print(json.dumps(r4, indent=2))

    print("\n" + "=" * 60)
    print("TEST 5 — batch_correlate: rank 3 wallets for same suspect")
    print("=" * 60)
    wallet_map = {
        "W_PerfectMatch": perfect_match_txns,
        "W_SleepBot":     sleep_active_txns,
        "W_Mixed":        mixed_txns,
    }
    ranked = batch_correlate(profile, wallet_map)
    print(json.dumps(ranked, indent=2))
