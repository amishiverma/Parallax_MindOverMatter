"""
dormancy.py
Blockchain Engine — Phase 3, Project RedString
Identifies per-wallet and aggregate blockchain dormancy windows.
Purely transaction-metric driven — no hardcoded suspect names or
OSINT blackout constants (all cross-domain correlation lives in correlator.py).
Outputs JSON-ready dicts for the correlation engine.
"""

import json
from collections import defaultdict
from pathlib import Path
from typing import Any

RAW_PATH = Path(__file__).parent.parent / "data" / "raw" / "blockchain_txs.json"

# Minimum total tx count for a wallet before dormancy scoring is meaningful.
# Wallets below this threshold receive a penalised score to avoid false positives.
MIN_TX_THRESHOLD = 3


def load_transactions(path: Path = RAW_PATH) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Hour Binning ──────────────────────────────────────────────────────────────

def bin_txs_to_hourly(txs: list[dict]) -> list[int]:
    """
    Aggregate ALL transactions into a 24-slot hour histogram.
    Returns list[int] of length 24 where index = UTC hour.
    """
    bins = [0] * 24
    for tx in txs:
        bins[tx["hour_utc"]] += 1
    return bins


def bin_wallet_txs(txs: list[dict]) -> dict[str, list[int]]:
    """
    Per-wallet tx histogram.
    Both from_wallet and to_wallet are counted as active.
    Returns {wallet_id: [count_h0, ..., count_h23]}
    """
    wallet_bins: dict[str, list[int]] = defaultdict(lambda: [0] * 24)
    for tx in txs:
        wallet_bins[tx["from_wallet"]][tx["hour_utc"]] += 1
        wallet_bins[tx["to_wallet"]][tx["hour_utc"]]   += 1
    return dict(wallet_bins)


# ── Inactivity Window Detection ───────────────────────────────────────────────

def find_dormancy_window(hourly_bins: list[int], window_len: int = 8) -> dict[str, Any]:
    """
    Sliding circular window over 24 hours; finds the window_len-hour span
    with the fewest transactions (lowest sum → most dormant).

    Scoring:
      - dormancy_score = 1 - (window_sum / total_txs), floored at 0.
      - When total_txs < MIN_TX_THRESHOLD the score is penalised
        (max 0.5) so sparse wallets cannot produce misleading 1.0 scores.

    Returns:
      {start_hour, end_hour (excl), length, zero_hours, window_sum,
       dormancy_score, total_txs, penalised}
    """
    n          = 24
    best_sum   = float("inf")
    best_start = 0
    total_txs  = sum(hourly_bins)

    for start in range(n):
        s = sum(hourly_bins[(start + i) % n] for i in range(window_len))
        if s < best_sum:
            best_sum   = s
            best_start = start

    zero_hours = [
        (best_start + i) % n
        for i in range(window_len)
        if hourly_bins[(best_start + i) % n] == 0
    ]

    penalised = total_txs < MIN_TX_THRESHOLD

    if total_txs == 0:
        raw_score = 0.0
    else:
        raw_score = 1.0 - (best_sum / total_txs)

    # Cap sparse wallets at 0.5 to prevent false 1.0 signals
    dormancy_score = round(min(raw_score, 0.5) if penalised else raw_score, 4)
    dormancy_score = max(0.0, dormancy_score)

    return {
        "start_hour":     best_start,
        "end_hour":       (best_start + window_len) % n,
        "length":         window_len,
        "zero_hours":     sorted(zero_hours),
        "window_sum":     int(best_sum),
        "dormancy_score": dormancy_score,
        "total_txs":      total_txs,
        "penalised":      penalised,
    }


# ── Overlap Utility (pure circular math — domain-agnostic) ────────────────────

def _hours_in_window(start: int, length: int) -> set[int]:
    return {(start + i) % 24 for i in range(length)}


def compute_window_overlap(
    start_a: int = 0,
    len_a: int = 8,
    start_b: int = 0,
    len_b: int = 8,
    **kwargs: Any,
) -> dict[str, Any]:
    """
    Compute hour-by-hour overlap between two arbitrary circular windows over 24h.
    Pure modular arithmetic — zero cross-domain assumptions.
    Accepts start_a/len_a/start_b/len_b or legacy bc_start/bc_len/osint_start/osint_len.
    Returns {overlap_hours, overlap_count, overlap_pct (of smaller window)}.
    """
    s_a = kwargs.get("bc_start", start_a)
    l_a = kwargs.get("bc_len", len_a)
    s_b = kwargs.get("osint_start", start_b)
    l_b = kwargs.get("osint_len", len_b)

    set_a   = _hours_in_window(s_a, l_a)
    set_b   = _hours_in_window(s_b, l_b)
    overlap = set_a & set_b
    smaller = min(l_a, l_b)
    return {
        "overlap_hours":   sorted(overlap),
        "overlap_count":   len(overlap),
        "overlap_pct":     round(len(overlap) / smaller, 4) if smaller else 0.0,
    }


# ── Master Dormancy Analysis ──────────────────────────────────────────────────

def analyze_blockchain_dormancy(txs: list[dict] | None = None,
                                 window_len: int = 8) -> dict[str, Any]:
    """
    Full dormancy pipeline — purely based on transaction metrics.
    No references to specific suspects or externally-known blackout windows;
    all cross-domain correlation is handled by correlation_engine/correlator.py.

    Returns clean dict ready for JSON serialisation:
      {global_hourly_bins, global_dormancy, wallet_profiles, summary}

    wallet_profiles are sorted by dormancy_score descending.
    Each wallet entry includes a placeholder osint_overlap dict
    (zeros) so callers that expect the key don't KeyError;
    the correlator fills real overlap values at scoring time.
    """
    if txs is None:
        txs = load_transactions()

    global_bins     = bin_txs_to_hourly(txs)
    global_dormancy = find_dormancy_window(global_bins, window_len=window_len)

    wallet_bins     = bin_wallet_txs(txs)
    wallet_profiles: list[dict] = []

    for wallet, bins in wallet_bins.items():
        w_dormancy = find_dormancy_window(bins, window_len=window_len)
        wallet_profiles.append({
            "wallet":          wallet,
            "hourly_bins":     bins,
            "dormancy_window": w_dormancy,
        })

    # Sort by dormancy_score descending (most dormant first)
    wallet_profiles.sort(
        key=lambda x: x["dormancy_window"]["dormancy_score"], reverse=True
    )

    return {
        "global_hourly_bins": global_bins,
        "global_dormancy":    global_dormancy,
        "wallet_profiles":    wallet_profiles,
        "summary": {
            "total_txs":               len(txs),
            "detected_dormancy_start": global_dormancy["start_hour"],
            "detected_dormancy_end":   global_dormancy["end_hour"],
            "dormancy_score":          global_dormancy["dormancy_score"],
            "wallets_analysed":        len(wallet_profiles),
        },
    }


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    result = analyze_blockchain_dormancy()
    s      = result["summary"]
    gd     = result["global_dormancy"]
    print(f"[dormancy] TXs={s['total_txs']} | "
          f"Dormancy={gd['start_hour']:02d}:00\u2013{gd['end_hour']:02d}:00 UTC | "
          f"Score={gd['dormancy_score']:.4f} | "
          f"Penalised={gd['penalised']}")
    print(f"  Top 5 dormant wallets:")
    for wp in result["wallet_profiles"][:5]:
        dw = wp["dormancy_window"]
        print(f"    {wp['wallet']:25s}  score={dw['dormancy_score']:.4f}  "
              f"txs={dw['total_txs']:3d}  penalised={dw['penalised']}")
