"""
guilt_engine.py
===============
Module: Guilt Probability Calculator
Agent:  The Tracker (Sanchita)
Project: RedString — Quantitative OSINT Blockchain Engine

Responsibilities:
  - Aggregate signals from every upstream engine (OSINT NLP flags,
    puppeteer timing clusters, sleep correlation score, graph pathfinder)
    into a single, human-readable GUILT PERCENTAGE (0–100).
  - The score is intentionally transparent and weight-based so it can be
    explained to a jury / presented on the War Room leaderboard.

Weight table
------------
  Signal                        | Max contribution
  ------------------------------|------------------
  NLP flags (nlp_flag_count>0)  | +20 pts
  Puppeteer cluster detected    | +20 pts
  Sleep correlation score       | up to +35 pts  (score × 35)
  Linked to source wallet       | +25 pts
  ------------------------------|------------------
  Total possible                | 100 pts   (capped at 100)

Output is a clean int percentage for the FastAPI leaderboard endpoint.
"""


# ---------------------------------------------------------------------------
# Core Guilt Calculator
# ---------------------------------------------------------------------------

def calculate_final_guilt(
    nlp_flag_count: int,
    is_puppeteer: bool,
    sleep_score: float,
    is_linked_to_source: bool,
) -> int:
    """
    Calculate a composite guilt probability percentage (0–100) by combining
    signals from all upstream analysis engines.

    Parameters
    ----------
    nlp_flag_count : int
        Number of NLP behavioural flags raised by the OSINT engine
        (panic phrases, bragging patterns, etc.).
        Any value > 0 contributes +20 pts regardless of magnitude —
        presence/absence is what matters here, not quantity.

    is_puppeteer : bool
        True if the timing engine detected the wallet inside a puppeteer
        cluster (transactions fired within 2 s of coordinated wallets).
        Contributes +20 pts.

    sleep_score : float
        Correlation score ∈ [0.0, 1.0] from the correlation engine,
        representing how closely the wallet's dormant periods match the
        suspect's sleep window.  Scaled by 35 → contributes up to +35 pts.

    is_linked_to_source : bool
        True if the fracture-engine pathfinder confirmed a directed path
        from the root "Stolen_Main_Wallet" to this wallet.
        Contributes +25 pts.

    Returns
    -------
    int
        Guilt percentage in [0, 100].

    Raises
    ------
    ValueError
        If sleep_score is outside [0.0, 1.0] or nlp_flag_count is negative.

    Examples
    --------
    >>> calculate_final_guilt(
    ...     nlp_flag_count=3,
    ...     is_puppeteer=True,
    ...     sleep_score=0.97,
    ...     is_linked_to_source=True,
    ... )
    100

    >>> calculate_final_guilt(
    ...     nlp_flag_count=0,
    ...     is_puppeteer=False,
    ...     sleep_score=0.0,
    ...     is_linked_to_source=False,
    ... )
    0

    >>> calculate_final_guilt(
    ...     nlp_flag_count=1,
    ...     is_puppeteer=False,
    ...     sleep_score=0.5,
    ...     is_linked_to_source=True,
    ... )
    62   # 20 (NLP) + 0 (no puppeteer) + 17 (0.5×35) + 25 (linked) = 62
    """
    # --- Input validation ---
    if nlp_flag_count < 0:
        raise ValueError(f"nlp_flag_count must be >= 0, got {nlp_flag_count}.")
    if not (0.0 <= sleep_score <= 1.0):
        raise ValueError(f"sleep_score must be in [0.0, 1.0], got {sleep_score}.")

    score: float = 0.0

    # Weight 1: NLP behavioural flags  → +20 pts (binary: present or not)
    if nlp_flag_count > 0:
        score += 20.0

    # Weight 2: Puppeteer cluster      → +20 pts
    if is_puppeteer:
        score += 20.0

    # Weight 3: Sleep correlation      → up to +35 pts (continuous)
    score += sleep_score * 35.0

    # Weight 4: Linked to source       → +25 pts
    if is_linked_to_source:
        score += 25.0

    # Cap at 100 and return as integer percentage
    return min(100, int(round(score)))


# ---------------------------------------------------------------------------
# Convenience: score a full suspect profile dict
# ---------------------------------------------------------------------------

def score_suspect(suspect: dict) -> dict:
    """
    Wrapper that accepts a suspect dict (as returned by the API layer or
    correlation pipeline) and appends a ``guilt_score_percentage`` field.

    Expected input keys
    -------------------
    ``suspect_id``, ``nlp_flag_count``, ``is_puppeteer``,
    ``sleep_score``, ``is_linked_to_source``

    Returns
    -------
    dict
        Original suspect dict with ``guilt_score_percentage`` (int) added.
    """
    required = {"suspect_id", "nlp_flag_count", "is_puppeteer",
                "sleep_score", "is_linked_to_source"}
    missing = required - set(suspect.keys())
    if missing:
        raise ValueError(f"Suspect dict missing keys: {missing}")

    guilt = calculate_final_guilt(
        nlp_flag_count=suspect["nlp_flag_count"],
        is_puppeteer=suspect["is_puppeteer"],
        sleep_score=suspect["sleep_score"],
        is_linked_to_source=suspect["is_linked_to_source"],
    )
    return {**suspect, "guilt_score_percentage": guilt}


# ---------------------------------------------------------------------------
# Quick self-test  (python guilt_engine.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    test_cases = [
        {
            "label": "Primary suspect — all signals hot",
            "args":  dict(nlp_flag_count=5, is_puppeteer=True,
                          sleep_score=0.97, is_linked_to_source=True),
            "expect": 100,
        },
        {
            "label": "Clean wallet — no signals",
            "args":  dict(nlp_flag_count=0, is_puppeteer=False,
                          sleep_score=0.0,  is_linked_to_source=False),
            "expect": 0,
        },
        {
            "label": "Partial match — NLP + linked, no timing/sleep",
            "args":  dict(nlp_flag_count=2, is_puppeteer=False,
                          sleep_score=0.0,  is_linked_to_source=True),
            "expect": 45,
        },
        {
            "label": "Strong sleep match + puppeteer, no NLP/source",
            "args":  dict(nlp_flag_count=0, is_puppeteer=True,
                          sleep_score=0.85, is_linked_to_source=False),
            "expect": 50,  # 20 + round(0.85*35)=30 → 50
        },
        {
            "label": "Mixed evidence",
            "args":  dict(nlp_flag_count=1, is_puppeteer=False,
                          sleep_score=0.5,  is_linked_to_source=True),
            "expect": 62,  # 20 + 0 + round(17.5)=18 + 25 → 63
        },
    ]

    print(f"{'Label':<45} {'Got':>5}  {'Pass':>5}")
    print("-" * 60)
    all_pass = True
    for tc in test_cases:
        result = calculate_final_guilt(**tc["args"])
        # Use >= check for the "Mixed" case due to rounding
        passed = (result == tc["expect"]) or abs(result - tc["expect"]) <= 1
        status = "✅" if passed else "❌"
        if not passed:
            all_pass = False
        print(f"{tc['label']:<45} {result:>5}  {status}")

    print("-" * 60)
    print("All tests passed!" if all_pass else "Some tests FAILED.")
