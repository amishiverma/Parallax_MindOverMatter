"""
sleep_cycle.py
OSINT Engine — Phase 2, Project RedString
Bins post timestamps into 24 1-hour UTC slots using pandas.
Calculates the primary contiguous 7–8 hour inactivity window per suspect.
"""

import json
from pathlib import Path
from collections import defaultdict

try:
    import pandas as pd
    _PANDAS = True
except ImportError:
    _PANDAS = False


# ── Core binning ─────────────────────────────────────────────────────────────

def bin_posts_to_hourly(posts: list[dict]) -> dict[str, list[int]]:
    """
    Returns {author: [count_h0, count_h1, ..., count_h23]}
    Each index = UTC hour (0–23), value = number of posts in that hour.
    """
    author_bins: dict[str, list[int]] = defaultdict(lambda: [0] * 24)
    for post in posts:
        author = post["author"]
        hour   = int(post["hour_utc"])
        author_bins[author][hour] += 1
    return dict(author_bins)


def find_inactivity_window(hourly_counts: list[int], target_len: int = 8) -> dict:
    """
    Identify the primary contiguous inactivity window of `target_len` hours.
    Uses a sliding circular window over 24 hours.
    Returns:
      {
        "start_hour": int,
        "end_hour":   int,          # exclusive, mod 24
        "length":     int,
        "zero_hours": list[int],    # hours with zero posts
        "window_sum": int,          # total posts in that window (lower = better)
      }
    """
    n   = 24
    win = target_len

    best_sum   = float("inf")
    best_start = 0

    # Try all windows of exactly `win` hours
    for start in range(n):
        window_sum = sum(hourly_counts[(start + i) % n] for i in range(win))
        if window_sum < best_sum:
            best_sum   = window_sum
            best_start = start

    zero_hours = [
        (best_start + i) % n
        for i in range(win)
        if hourly_counts[(best_start + i) % n] == 0
    ]

    return {
        "start_hour": best_start,
        "end_hour":   (best_start + win) % n,
        "length":     win,
        "zero_hours": sorted(zero_hours),
        "window_sum": int(best_sum),
    }


def analyze_sleep_cycles(posts: list[dict], target_window_len: int = 8) -> dict[str, dict]:
    """
    Full pipeline:
    1. Bin posts per author into 24-hour slots
    2. Detect primary inactivity window (circadian rhythm)
    3. Return per-author result with pandas DataFrame info if available

    Returns: {author: {hourly_bins, inactivity_window, ...}}
    """
    author_bins = bin_posts_to_hourly(posts)
    results     = {}

    for author, bins in author_bins.items():
        inactivity = find_inactivity_window(bins, target_len=target_window_len)
        entry = {
            "author":             author,
            "hourly_bins":        bins,
            "total_posts":        sum(bins),
            "peak_hour_utc":      bins.index(max(bins)),
            "inactivity_window":  inactivity,
        }

        # Optional pandas enrichment
        if _PANDAS:
            series        = pd.Series(bins, index=range(24), name="post_count")
            entry["mean_hourly"] = round(float(series.mean()), 3)
            entry["std_hourly"]  = round(float(series.std()), 3)

        results[author] = entry

    return results


def format_report(results: dict[str, dict]) -> str:
    """Human-readable circadian report."""
    lines = ["=" * 62, "  OSINT CIRCADIAN ANALYSIS REPORT", "=" * 62]
    for author, data in results.items():
        iw   = data["inactivity_window"]
        lines.append(f"\n  Suspect : {author}")
        lines.append(f"  Posts   : {data['total_posts']}")
        lines.append(f"  Peak hr : {data['peak_hour_utc']:02d}:00 UTC")
        lines.append(
            f"  Sleep   : {iw['start_hour']:02d}:00 – {iw['end_hour']:02d}:00 UTC"
            f"  ({iw['length']}h window, {iw['window_sum']} posts inside)"
        )
        if _PANDAS:
            lines.append(f"  μ/h     : {data.get('mean_hourly', '—')}")
        lines.append(f"  Bins    : {data['hourly_bins']}")
    lines.append("=" * 62)
    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    raw_path = Path(__file__).parent.parent / "data" / "raw" / "osint_chatter.json"
    with open(raw_path, encoding="utf-8") as f:
        posts = json.load(f)

    results = analyze_sleep_cycles(posts)
    print(format_report(results))
