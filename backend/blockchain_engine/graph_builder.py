"""
graph_builder.py
Blockchain Engine — Phase 3, Project RedString
Builds a directed NetworkX graph from blockchain_txs.json.
Each wallet = node, each transaction = directed weighted edge.
Outputs node/edge data as clean JSON dicts for FastAPI consumption.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

try:
    import networkx as nx
    _NX = True
except ImportError:
    _NX = False


# ── Data Loading ──────────────────────────────────────────────────────────────

RAW_PATH = Path(__file__).parent.parent / "data" / "raw" / "blockchain_txs.json"


def load_transactions(path: Path = RAW_PATH) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Graph Construction ────────────────────────────────────────────────────────

def build_graph(txs: list[dict]) -> "nx.DiGraph":
    """
    Build a directed graph where:
      - Nodes = wallet addresses with aggregated attributes
      - Edges = transactions (weight=value_usd, tx_type, timestamp_utc, hour_utc)
    """
    if not _NX:
        raise ImportError("networkx is required: pip install networkx")

    G = nx.DiGraph()

    for tx in txs:
        src = tx["from_wallet"]
        dst = tx["to_wallet"]
        val = tx["value_usd"]
        typ = tx["tx_type"]

        # Add/update nodes
        for wallet in (src, dst):
            if wallet not in G:
                G.add_node(wallet, total_received=0.0, total_sent=0.0,
                           tx_count=0, tx_types=set(), hours_active=set())

        G.nodes[src]["total_sent"]    += val
        G.nodes[src]["tx_count"]      += 1
        G.nodes[src]["tx_types"].add(typ)
        G.nodes[src]["hours_active"].add(tx["hour_utc"])

        G.nodes[dst]["total_received"] += val
        G.nodes[dst]["tx_count"]       += 1
        G.nodes[dst]["tx_types"].add(typ)
        G.nodes[dst]["hours_active"].add(tx["hour_utc"])

        # Add edge (allow multiple edges: use MultiDiGraph would be heavier — store as list attr)
        if G.has_edge(src, dst):
            G[src][dst]["txs"].append(tx)
            G[src][dst]["total_value"] += val
        else:
            G.add_edge(src, dst,
                       txs=[tx],
                       total_value=val,
                       tx_type=typ,
                       first_timestamp=tx["timestamp_utc"],
                       last_timestamp=tx["timestamp_utc"])

    # Freeze sets to sorted lists for JSON serialisation
    for node, data in G.nodes(data=True):
        data["tx_types"]     = sorted(data["tx_types"])
        data["hours_active"] = sorted(data["hours_active"])
        data["total_sent"]   = round(data["total_sent"], 2)
        data["total_received"] = round(data["total_received"], 2)

    return G


# ── Serialisers ───────────────────────────────────────────────────────────────

def _classify_wallet_role(node: str, data: dict) -> str:
    if "ROOT" in node:
        return "exploit_root"
    if "MIXER" in node:
        return "mixer"
    if "EXIT" in node:
        return "exit"
    return "unknown"


def graph_to_nodes_json(G: "nx.DiGraph") -> list[dict]:
    """Return list of node dicts suitable for frontend graph rendering."""
    nodes = []
    for node, data in G.nodes(data=True):
        nodes.append({
            "id":              node,
            "role":            _classify_wallet_role(node, data),
            "total_sent":      data.get("total_sent", 0.0),
            "total_received":  data.get("total_received", 0.0),
            "tx_count":        data.get("tx_count", 0),
            "tx_types":        data.get("tx_types", []),
            "hours_active":    data.get("hours_active", []),
        })
    return nodes


def graph_to_edges_json(G: "nx.DiGraph") -> list[dict]:
    """Return list of edge dicts suitable for frontend graph rendering."""
    edges = []
    for src, dst, data in G.edges(data=True):
        edges.append({
            "source":          src,
            "target":          dst,
            "total_value":     round(data["total_value"], 2),
            "tx_count":        len(data["txs"]),
            "tx_type":         data["tx_type"],
            "first_timestamp": data["first_timestamp"],
            "last_timestamp":  data["last_timestamp"],
        })
    return edges


def build_full_graph_payload(txs: list[dict] | None = None) -> dict[str, Any]:
    """
    Master builder: loads txs → builds graph → returns serialisable dict.
    {nodes: [...], edges: [...], summary: {...}}
    """
    if txs is None:
        txs = load_transactions()

    G       = build_graph(txs)
    nodes   = graph_to_nodes_json(G)
    edges   = graph_to_edges_json(G)
    total_v = sum(e["total_value"] for e in edges if "EXIT" in e["target"])

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_wallets":      len(nodes),
            "total_edges":        len(edges),
            "total_transactions": len(txs),
            "exploit_root":       next((n["id"] for n in nodes if n["role"] == "exploit_root"), None),
            "mixer_count":        sum(1 for n in nodes if n["role"] == "mixer"),
            "exit_wallet_count":  sum(1 for n in nodes if n["role"] == "exit"),
            "total_exit_value_usd": round(total_v, 2),
        },
    }


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    payload = build_full_graph_payload()
    s       = payload["summary"]
    print(f"[graph_builder] Wallets={s['total_wallets']} | Edges={s['total_edges']} "
          f"| TXs={s['total_transactions']} | Exit value=${s['total_exit_value_usd']:,.2f}")
    for n in payload["nodes"]:
        print(f"  [{n['role']:12s}] {n['id']:25s}  sent=${n['total_sent']:>14,.2f}  "
              f"recv=${n['total_received']:>14,.2f}  hrs={n['hours_active']}")
