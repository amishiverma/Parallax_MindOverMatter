"""
main.py
FastAPI Delivery Layer — Phase 5, Project RedString
Serves endpoints backed by the OSINT/blockchain/correlation engines.
CORS is fully open for Amishi's Next.js frontend.

All endpoints are registered under both `/` and `/api/v1/` route prefixes:
  - /osint/feed & /api/v1/osint/feed
  - /blockchain/nodes & /api/v1/blockchain/nodes
  - /correlation/timeline & /api/v1/correlation/timeline
  - /suspects/leaderboard & /api/v1/suspects/leaderboard
  - /health & /api/v1/health
  - /attack/launch & /api/v1/attack/launch
  - /alerts/latest & /api/v1/alerts/latest
  - /simulation/reset & /api/v1/simulation/reset
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Path bootstrap ─────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))

from backend.osint_engine.parser import parse_feed, build_author_profiles
from backend.osint_engine.sleep_cycle import analyze_sleep_cycles
from backend.blockchain_engine.graph_builder import build_full_graph_payload
from backend.blockchain_engine.dormancy import analyze_blockchain_dormancy
from backend.correlation_engine.correlator import run_correlation
from backend.correlation_engine.timeline_builder import build_timeline
from backend.tracker.timing_engine import detect_puppeteer_clusters
from backend.api.simulation import (
    AttackLaunchRequest,
    AlertStatusResponse,
    simulation_engine,
)

# ── App Init ───────────────────────────────────────────────────────────────────
app = FastAPI(
    title="RedString API",
    description="OSINT-Blockchain Correlation Engine — Project RedString",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = ROOT / "backend" / "data" / "raw"


# ── Data Loaders ──────────────────────────────────────────────────────────────

def _load_disk_osint_posts() -> list[dict]:
    path = DATA_DIR / "osint_chatter.json"
    if not path.exists():
        raise FileNotFoundError(
            f"osint_chatter.json not found at {path}. Run generate_mock_data.py first."
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_disk_chain_txs() -> list[dict]:
    path = DATA_DIR / "blockchain_txs.json"
    if not path.exists():
        raise FileNotFoundError(
            f"blockchain_txs.json not found at {path}. Run generate_mock_data.py first."
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _cached_osint_posts() -> list[dict]:
    return simulation_engine.get_osint_posts(_load_disk_osint_posts)


def _cached_chain_txs() -> list[dict]:
    return simulation_engine.get_chain_txs(_load_disk_chain_txs)


def _handle_missing(exc: FileNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"error": "Data not available", "detail": str(exc)},
    )


# ── Route Handlers ────────────────────────────────────────────────────────────

def _health_handler() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "project": "RedString", "version": "1.0.0"}


def _osint_feed_handler(
    flagged_only: bool = False,
    author: Optional[str] = None,
    limit: int = 100,
) -> dict[str, Any] | JSONResponse:
    """
    Enriched OSINT post feed with intent classification and author profiles.
    Includes per-author circadian sleep cycle analysis.
    """
    try:
        raw_posts = _cached_osint_posts()
    except FileNotFoundError as exc:
        return _handle_missing(exc)

    enriched = parse_feed(raw_posts)

    if flagged_only:
        enriched = [p for p in enriched if p["is_flagged"]]
    if author:
        enriched = [p for p in enriched if p["author"].lower() == author.lower()]

    enriched.sort(key=lambda p: p.get("timestamp_utc", ""), reverse=True)
    enriched = enriched[:limit]

    profiles = build_author_profiles(enriched)
    sleep_cycles = analyze_sleep_cycles(enriched)

    for handle, cycle in sleep_cycles.items():
        if handle in profiles:
            profiles[handle]["sleep_window"] = cycle["inactivity_window"]
            profiles[handle]["peak_hour_utc"] = cycle["peak_hour_utc"]

    return {
        "posts": enriched,
        "author_profiles": profiles,
        "meta": {
            "total_posts": len(enriched),
            "flagged_only": flagged_only,
            "author_filter": author,
        },
    }


def _blockchain_nodes_handler(
    role: Optional[str] = None,
) -> dict[str, Any] | JSONResponse:
    """
    Blockchain transaction graph — nodes (wallets) + edges (transfers) + summary.
    Includes dormancy analysis aligned to OSINT blackout window and puppeteer clusters.
    """
    try:
        txs = _cached_chain_txs()
    except FileNotFoundError as exc:
        return _handle_missing(exc)

    payload = build_full_graph_payload(txs)
    dormancy = analyze_blockchain_dormancy(txs)

    nodes = payload["nodes"]
    edges = payload["edges"]

    if role:
        nodes = [n for n in nodes if n["role"] == role]
        node_ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e["source"] in node_ids and e["target"] in node_ids]

    puppeteer_txs = [
        {
            "wallet_id": tx["from_wallet"],
            "timestamp": tx["timestamp_utc"],
            "amount": tx["value_usd"],
        }
        for tx in txs
    ]
    clusters = detect_puppeteer_clusters(puppeteer_txs, time_window_seconds=2) if puppeteer_txs else []

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": payload["summary"],
        "dormancy": dormancy["summary"],
        "puppeteer_clusters": clusters,
        "meta": {
            "role_filter": role,
        },
    }


def _correlation_timeline_handler(
    include_neutral: bool = False,
    severity: Optional[str] = None,
    limit: int = 500,
) -> dict[str, Any] | JSONResponse:
    """
    Unified chronological timeline merging OSINT posts and blockchain transactions.
    Events are risk-scored and annotated with suspect correlation context.
    """
    try:
        posts = _cached_osint_posts()
        txs = _cached_chain_txs()
    except FileNotFoundError as exc:
        return _handle_missing(exc)

    timeline = build_timeline(posts, txs, include_neutral=include_neutral)
    events = timeline["events"]

    if severity:
        events = [e for e in events if e.get("severity", "").upper() == severity.upper()]

    events = events[:limit]

    return {
        "events": events,
        "stats": timeline["stats"],
        "metadata": timeline["metadata"],
        "suspect_rank": timeline["suspect_rank"],
        "meta": {
            "severity_filter": severity,
            "include_neutral": include_neutral,
            "returned_events": len(events),
        },
    }


def _suspects_leaderboard_handler(
    top_n: int = 10,
) -> dict[str, Any] | JSONResponse:
    """
    Ranked suspect leaderboard with composite probability scores,
    sleep window evidence, and best blockchain wallet match.
    """
    try:
        posts = _cached_osint_posts()
        txs = _cached_chain_txs()
    except FileNotFoundError as exc:
        return _handle_missing(exc)

    result = run_correlation(posts, txs)
    top = result["suspects"][:top_n]

    return {
        "leaderboard": top,
        "global_match": result["global_match"],
        "wallet_matches": result["wallet_matches"],
        "metadata": result["metadata"],
        "meta": {
            "top_n": top_n,
        },
    }


# ── Routes: dual registration (/ and /api/v1/) ────────────────────────────────

@app.get("/health", tags=["Meta"])
@app.get("/api/v1/health", tags=["Meta"])
def health() -> dict[str, str]:
    return _health_handler()


@app.get("/osint/feed", tags=["OSINT"])
@app.get("/api/v1/osint/feed", tags=["OSINT"])
def osint_feed(
    flagged_only: bool = Query(False, description="Return only flagged (boast/panic) posts"),
    author: Optional[str] = Query(None, description="Filter by suspect handle"),
    limit: int = Query(100, ge=1, le=1000, description="Max posts to return"),
) -> dict[str, Any]:
    return _osint_feed_handler(flagged_only=flagged_only, author=author, limit=limit)


@app.get("/blockchain/nodes", tags=["Blockchain"])
@app.get("/api/v1/blockchain/nodes", tags=["Blockchain"])
def blockchain_nodes(
    role: Optional[str] = Query(None, description="Filter by role: exploit_root|mixer|exit"),
) -> dict[str, Any]:
    return _blockchain_nodes_handler(role=role)


@app.get("/correlation/timeline", tags=["Correlation"])
@app.get("/api/v1/correlation/timeline", tags=["Correlation"])
def correlation_timeline(
    include_neutral: bool = Query(False, description="Include neutral OSINT posts"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW|MEDIUM|HIGH|CRITICAL"),
    limit: int = Query(500, ge=1, le=5000, description="Max timeline events to return"),
) -> dict[str, Any]:
    return _correlation_timeline_handler(include_neutral=include_neutral, severity=severity, limit=limit)


@app.get("/suspects/leaderboard", tags=["Correlation"])
@app.get("/api/v1/suspects/leaderboard", tags=["Correlation"])
def suspects_leaderboard(
    top_n: int = Query(10, ge=1, le=100, description="Number of top suspects to return"),
) -> dict[str, Any]:
    return _suspects_leaderboard_handler(top_n=top_n)


# ── Simulation & Live Attack Endpoints ────────────────────────────────────────

@app.post("/attack/launch", tags=["Simulation"])
@app.post("/api/v1/attack/launch", tags=["Simulation"])
def attack_launch(
    payload: AttackLaunchRequest = AttackLaunchRequest(),
) -> dict[str, Any]:
    """Launch dynamic synthetic attack and immediately update live state."""
    return simulation_engine.launch_attack(payload)


@app.get("/alerts/latest", response_model=AlertStatusResponse, tags=["Alerts"])
@app.get("/api/v1/alerts/latest", response_model=AlertStatusResponse, tags=["Alerts"])
def alerts_latest() -> dict[str, Any]:
    """Return real-time breach alert state."""
    return simulation_engine.get_alert_status()


@app.post("/simulation/reset", tags=["Simulation"])
@app.post("/api/v1/simulation/reset", tags=["Simulation"])
def simulation_reset() -> dict[str, Any]:
    """Reset simulation engine back to baseline static state."""
    return simulation_engine.reset()


# ── Dev entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
