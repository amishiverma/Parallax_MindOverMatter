"""
timing_engine.py
================
Module: Transaction Timing Engine — Puppeteer Logic
Agent:  The Tracker (Sanchita)
Project: RedString — Quantitative OSINT Blockchain Engine

Responsibilities:
  - Ingest a raw list of blockchain transactions (wallet_id, timestamp, amount).
  - Detect "puppeteer clusters": groups of transactions fired so close together
    in time that they are almost certainly controlled by a single automated
    actor (bot / script) rather than independent human wallets.
  - Return clean, JSON-serialisable cluster data for consumption by the
    FastAPI layer defined in /backend/api.

Clustering algorithm — sliding-window sequential scan
------------------------------------------------------
  1. Parse & sort all transactions by timestamp (ascending).
  2. Walk the sorted list with a two-pointer approach:
       - `window_start` marks the first transaction of the current candidate
         cluster.
       - For each transaction i, check whether
             tx[i].timestamp - tx[window_start].timestamp <= time_window_seconds
         If YES  → tx[i] belongs to the current cluster.
         If NO   → close the current cluster, emit it (if len > 1),
                   advance window_start to i and open a new cluster.
  3. After the loop, close and emit the final pending cluster.

Complexity: O(n log n) dominated by the sort; O(n) for the scan itself.
"""

from __future__ import annotations

import pandas as pd
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Core Detection Function
# ---------------------------------------------------------------------------

def detect_puppeteer_clusters(
    transactions: list[dict],
    time_window_seconds: int = 2,
) -> list[dict]:
    """
    Identify clusters of transactions that fire within ``time_window_seconds``
    of each other — a strong signal of automated / puppeteer-controlled wallets.

    Parameters
    ----------
    transactions : list[dict]
        Raw transaction records. Each dict must contain:
          - ``wallet_id``  (str)  : wallet address / label
          - ``timestamp``  (str)  : ISO-8601 datetime string
                                    e.g. "2023-10-27T10:00:00.123"
          - ``amount``     (float): value transferred (USD or token units)
    time_window_seconds : int, optional
        Maximum gap (in seconds) between the **first** transaction of a cluster
        and any subsequent transaction still considered part of that cluster.
        Default is 2 seconds (tight enough to flag bot behaviour).

    Returns
    -------
    list[dict]
        A list of cluster objects. Only clusters with **more than one**
        transaction are returned (singletons are not puppeteer evidence).

        Each cluster dict has the schema::

            {
                "cluster_id"         : int,          # 1-indexed
                "transaction_count"  : int,
                "time_span_seconds"  : float,        # last_ts - first_ts
                "total_amount"       : float,         # sum of amounts in cluster
                "wallet_ids"         : list[str],     # unique wallets involved
                "transactions"       : list[dict]     # full records, sorted by ts
            }

    Raises
    ------
    ValueError
        If ``transactions`` is empty or ``time_window_seconds`` is < 1.

    Examples
    --------
    >>> txns = [
    ...     {"wallet_id": "W1", "timestamp": "2023-10-27T10:00:00.100", "amount": 500},
    ...     {"wallet_id": "W2", "timestamp": "2023-10-27T10:00:00.900", "amount": 300},
    ...     {"wallet_id": "W3", "timestamp": "2023-10-27T10:00:05.000", "amount": 200},
    ... ]
    >>> clusters = detect_puppeteer_clusters(txns, time_window_seconds=2)
    >>> len(clusters)          # W1+W2 cluster; W3 is a singleton → filtered out
    1
    >>> clusters[0]["transaction_count"]
    2
    """
    if not transactions:
        raise ValueError("transactions list must not be empty.")
    if time_window_seconds < 1:
        raise ValueError("time_window_seconds must be at least 1.")

    # ------------------------------------------------------------------
    # Step 1: Load into a DataFrame and parse timestamps
    # ------------------------------------------------------------------
    df = pd.DataFrame(transactions)

    required_cols = {"wallet_id", "timestamp", "amount"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Transaction records are missing required keys: {missing}")

    df["parsed_ts"] = pd.to_datetime(df["timestamp"], format="mixed", utc=False)
    df = df.sort_values("parsed_ts").reset_index(drop=True)

    # ------------------------------------------------------------------
    # Step 2: Sliding-window scan — O(n) after the sort
    # ------------------------------------------------------------------
    clusters: list[dict] = []
    cluster_id_counter = 0

    window_start = 0
    current_cluster_indices = [0]

    for i in range(1, len(df)):
        gap = (df.at[i, "parsed_ts"] - df.at[window_start, "parsed_ts"]).total_seconds()

        if gap <= time_window_seconds:
            # Still within the window — extend current cluster
            current_cluster_indices.append(i)
        else:
            # Gap exceeded — close current cluster
            cluster_rows = df.iloc[current_cluster_indices]
            if len(cluster_rows) > 1:          # filter singletons
                cluster_id_counter += 1
                clusters.append(_build_cluster(cluster_id_counter, cluster_rows))

            # Start a fresh cluster from the current transaction
            window_start = i
            current_cluster_indices = [i]

    # Close the final pending cluster
    cluster_rows = df.iloc[current_cluster_indices]
    if len(cluster_rows) > 1:
        cluster_id_counter += 1
        clusters.append(_build_cluster(cluster_id_counter, cluster_rows))

    return clusters


# ---------------------------------------------------------------------------
# Internal Helper
# ---------------------------------------------------------------------------

def _build_cluster(cluster_id: int, cluster_df: pd.DataFrame) -> dict:
    """
    Serialise a cluster DataFrame slice into a clean JSON-ready dict.

    Parameters
    ----------
    cluster_id : int
        1-indexed identifier assigned by the caller.
    cluster_df : pd.DataFrame
        Rows belonging to this cluster, already sorted by ``parsed_ts``.

    Returns
    -------
    dict
        Cluster summary with metadata and full transaction list.
    """
    first_ts: pd.Timestamp = cluster_df["parsed_ts"].iloc[0]
    last_ts:  pd.Timestamp = cluster_df["parsed_ts"].iloc[-1]
    time_span = (last_ts - first_ts).total_seconds()

    # Reconstruct transaction records without the internal parsed_ts column
    tx_records = (
        cluster_df
        .drop(columns=["parsed_ts"])
        .to_dict(orient="records")
    )

    return {
        "cluster_id":        cluster_id,
        "transaction_count": len(cluster_df),
        "time_span_seconds": round(time_span, 6),
        "total_amount":      round(float(cluster_df["amount"].sum()), 2),
        "wallet_ids":        sorted(cluster_df["wallet_id"].unique().tolist()),
        "first_timestamp":   first_ts.isoformat(),
        "last_timestamp":    last_ts.isoformat(),
        "transactions":      tx_records,
    }


# ---------------------------------------------------------------------------
# Quick self-test (run directly: python timing_engine.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    sample_transactions = [
        # --- Cluster A: 3 bots fire within ~1 second ---
        {"wallet_id": "W_Bot_01", "timestamp": "2023-10-27T10:00:00.100", "amount": 1500.00},
        {"wallet_id": "W_Bot_02", "timestamp": "2023-10-27T10:00:00.550", "amount": 2200.50},
        {"wallet_id": "W_Bot_03", "timestamp": "2023-10-27T10:00:00.980", "amount": 980.75},

        # --- Singleton: human-paced transaction 10 s later → filtered out ---
        {"wallet_id": "W_Human_01", "timestamp": "2023-10-27T10:00:10.000", "amount": 500.00},

        # --- Cluster B: 2 wallets fire ~1.8 s apart ---
        {"wallet_id": "W_Bot_04", "timestamp": "2023-10-27T10:00:20.000", "amount": 3300.00},
        {"wallet_id": "W_Bot_05", "timestamp": "2023-10-27T10:00:21.800", "amount": 3300.00},

        # --- Singleton: another isolated human tx → filtered out ---
        {"wallet_id": "W_Human_02", "timestamp": "2023-10-27T10:01:00.000", "amount": 750.00},
    ]

    print("=== Running Puppeteer Cluster Detection ===\n")
    clusters = detect_puppeteer_clusters(sample_transactions, time_window_seconds=2)

    print(f"  Puppeteer clusters detected: {len(clusters)}\n")
    print(json.dumps(clusters, indent=2))

    # --- Edge case: all singletons ---
    print("\n=== Edge Case: All Singletons (should return []) ===\n")
    singletons = [
        {"wallet_id": "W1", "timestamp": "2023-10-27T10:00:00.000", "amount": 100},
        {"wallet_id": "W2", "timestamp": "2023-10-27T10:00:10.000", "amount": 200},
        {"wallet_id": "W3", "timestamp": "2023-10-27T10:00:20.000", "amount": 300},
    ]
    result = detect_puppeteer_clusters(singletons, time_window_seconds=2)
    print(f"  Clusters found: {len(result)}  (expected: 0)")
