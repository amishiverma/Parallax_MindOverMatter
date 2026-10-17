"""
fracture_engine.py
==================
Module: Wallet Fracture Mocking & Tracing
Agent:  The Tracker (Sanchita)
Project: RedString — Quantitative OSINT Blockchain Engine

Responsibilities:
  - Generate mock directed transaction graphs simulating
    a "wallet fracture" (layering step in money laundering).
  - Provide path-tracing utilities to identify cash-out routes
    between any two wallets in the graph.

Output is clean JSON-serialisable data intended for consumption
by the FastAPI layer defined in /backend/api.
"""

import networkx as nx
import random


# ---------------------------------------------------------------------------
# Graph Generation
# ---------------------------------------------------------------------------

def generate_mock_fracture_graph(
    root_wallet: str = "Stolen_Main_Wallet",
    total_amount: float = 42_000_000,
    num_splits: int = 100,
) -> nx.DiGraph:
    """
    Build a mock directed transaction graph representing a wallet fracture
    (layering / smurfing pattern).

    The ``root_wallet`` distributes ``total_amount`` (in USD) across
    ``num_splits`` child wallets via a single hop.  Edge weights represent
    the transferred amount so that downstream analytics can:
      - Sum flows to verify conservation of value.
      - Weight shortest-path searches by transaction volume.

    Parameters
    ----------
    root_wallet : str
        Label for the originating (stolen) wallet node.
    total_amount : float
        Total value to distribute across child wallets (USD).
    num_splits : int
        Number of child / burner wallets to create.

    Returns
    -------
    nx.DiGraph
        Directed graph where:
          - Nodes carry a ``label`` attribute (wallet address string).
          - Edges carry a ``weight`` attribute (float, amount transferred).

    Example
    -------
    >>> G = generate_mock_fracture_graph()
    >>> len(G.nodes)   # root + 100 children
    101
    >>> sum(d["weight"] for _, _, d in G.edges(data=True))
    42000000.0
    """
    if num_splits < 1:
        raise ValueError("num_splits must be at least 1.")
    if total_amount <= 0:
        raise ValueError("total_amount must be positive.")

    graph = nx.DiGraph()

    # Add root node
    graph.add_node(root_wallet, label=root_wallet, node_type="source")

    # --- Randomly partition total_amount into num_splits pieces ---
    # Use a Dirichlet-like approach: draw random breakpoints and normalise.
    breakpoints = sorted(random.uniform(0, total_amount) for _ in range(num_splits - 1))
    breakpoints = [0.0] + breakpoints + [total_amount]
    split_amounts = [
        round(breakpoints[i + 1] - breakpoints[i], 2)
        for i in range(num_splits)
    ]

    # Sanity: floating-point drift correction on the last bucket
    drift = round(total_amount - sum(split_amounts), 2)
    split_amounts[-1] = round(split_amounts[-1] + drift, 2)

    # --- Create child wallet nodes and edges ---
    for idx, amount in enumerate(split_amounts):
        child_label = f"Burner_Wallet_{idx + 1:03d}"
        graph.add_node(child_label, label=child_label, node_type="burner")
        graph.add_edge(
            root_wallet,
            child_label,
            weight=amount,
            currency="USD",
            hop=1,
        )

    return graph


# ---------------------------------------------------------------------------
# Path Tracing
# ---------------------------------------------------------------------------

def find_cashout_paths(
    graph: nx.DiGraph,
    target_wallet: str,
    root_wallet: str = "Stolen_Main_Wallet",
) -> dict:
    """
    Determine whether a cash-out path exists from ``root_wallet`` to
    ``target_wallet`` inside the fracture graph, and return all simple
    paths if found.

    Uses NetworkX's ``has_path`` for a fast boolean check, then
    ``all_simple_paths`` to enumerate every route (useful for multi-hop
    graphs produced by deeper layering stages).

    Parameters
    ----------
    graph : nx.DiGraph
        The directed transaction graph (e.g., from
        ``generate_mock_fracture_graph``).
    target_wallet : str
        The wallet label to search for as a cash-out destination.
    root_wallet : str
        Source wallet to trace from. Defaults to "Stolen_Main_Wallet".

    Returns
    -------
    dict
        JSON-serialisable result with the schema::

            {
                "source":        str,          # root_wallet
                "target":        str,          # target_wallet
                "path_exists":   bool,
                "paths":         list[list[str]],  # all simple paths
                "path_count":    int,
                "total_paths_amount": float    # sum of weights along paths
            }

    Raises
    ------
    ValueError
        If ``root_wallet`` or ``target_wallet`` are not present in the graph.

    Example
    -------
    >>> G = generate_mock_fracture_graph()
    >>> result = find_cashout_paths(G, "Burner_Wallet_042")
    >>> result["path_exists"]
    True
    """
    # --- Validate inputs ---
    if root_wallet not in graph:
        raise ValueError(
            f"Source wallet '{root_wallet}' not found in graph. "
            f"Available nodes: {list(graph.nodes)[:5]} ..."
        )
    if target_wallet not in graph:
        # Target not in graph → path cannot exist, return gracefully
        return {
            "source": root_wallet,
            "target": target_wallet,
            "path_exists": False,
            "paths": [],
            "path_count": 0,
            "total_paths_amount": 0.0,
            "note": f"Target wallet '{target_wallet}' does not exist in graph.",
        }

    # --- Check path existence ---
    path_exists = nx.has_path(graph, root_wallet, target_wallet)

    paths: list[list[str]] = []
    total_amount = 0.0

    if path_exists:
        # Enumerate all simple paths (no repeated nodes)
        paths = list(nx.all_simple_paths(graph, source=root_wallet, target=target_wallet))

        # Calculate total monetary flow across all discovered paths
        for path in paths:
            for i in range(len(path) - 1):
                edge_data = graph.get_edge_data(path[i], path[i + 1]) or {}
                total_amount += edge_data.get("weight", 0.0)

    return {
        "source": root_wallet,
        "target": target_wallet,
        "path_exists": path_exists,
        "paths": paths,
        "path_count": len(paths),
        "total_paths_amount": round(total_amount, 2),
    }


# ---------------------------------------------------------------------------
# Quick self-test (run directly: python fracture_engine.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    print("=== Generating mock fracture graph ===")
    G = generate_mock_fracture_graph()
    print(f"  Nodes : {G.number_of_nodes()}")
    print(f"  Edges : {G.number_of_edges()}")
    total = sum(d["weight"] for _, _, d in G.edges(data=True))
    print(f"  Total amount distributed : ${total:,.2f}")

    print("\n=== Tracing cash-out path to Burner_Wallet_042 ===")
    result = find_cashout_paths(G, "Burner_Wallet_042")
    print(json.dumps(result, indent=2))

    print("\n=== Tracing cash-out path to non-existent wallet ===")
    result_missing = find_cashout_paths(G, "Ghost_Wallet_999")
    print(json.dumps(result_missing, indent=2))
