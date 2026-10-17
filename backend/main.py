"""
main.py
=======
OSINT War Room API — FastAPI Entry Point
Agent:  The Tracker (Sanchita)
Project: RedString — Quantitative OSINT Blockchain Engine

This is the single FastAPI application that the React frontend (Amishi)
connects to.  All routes are versioned under /api/v1/.

Mock data is intentionally rich so Amishi can wire up every UI component
without waiting on real data pipelines.  When real engines are ready,
swap the mock dicts for calls to the tracker/osint/correlation modules.

Run the server
--------------
    cd backend
    uvicorn main:app --reload --port 8000

Interactive docs → http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Make the tracker package importable when running from /backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "tracker"))
from guilt_engine import calculate_final_guilt


# ---------------------------------------------------------------------------
# App Initialisation
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OSINT War Room API",
    description=(
        "Project RedString — Quantitative OSINT Blockchain Engine. "
        "Connects dark-web chatter to blockchain transaction graphs."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for hackathon development
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    """Liveness probe — confirms the API is running."""
    return {"status": "online", "project": "RedString", "api_version": "v1"}


# ---------------------------------------------------------------------------
# GET /api/v1/osint/feed
# Returns: array of OSINT sticky-note objects (dark-web forum posts)
# ---------------------------------------------------------------------------

@app.get("/api/v1/osint/feed", tags=["OSINT"])
def get_osint_feed():
    """
    Return a mock feed of flagged dark-web posts with NLP behavioural tags.
    Consumed by the Sticky-Notes / Red-String wall component.
    """
    return {
        "source": "dark_web_scraper_mock",
        "posts": [
            {
                "post_id":    "DW-001",
                "forum":      "Tor_Finance_Board",
                "timestamp":  "2023-10-27T01:15:00Z",
                "content":    "moved the funds. cant stop shaking. nobody suspects anything yet",
                "nlp_flags":  ["panic", "evasion"],
                "flag_count": 2,
                "suspect_id": "DarkWeb_User99",
            },
            {
                "post_id":    "DW-002",
                "forum":      "CryptoHaven_Anon",
                "timestamp":  "2023-10-27T02:05:00Z",
                "content":    "42M split. 100 wallets. good luck tracing that lmao",
                "nlp_flags":  ["bragging", "financial_crime_ref"],
                "flag_count": 2,
                "suspect_id": "DarkWeb_User99",
            },
            {
                "post_id":    "DW-003",
                "forum":      "Tor_Finance_Board",
                "timestamp":  "2023-10-27T14:33:00Z",
                "content":    "layer 2 complete. mixing service worked perfectly",
                "nlp_flags":  ["layering_ref"],
                "flag_count": 1,
                "suspect_id": "DarkWeb_User99",
            },
            {
                "post_id":    "DW-004",
                "forum":      "AnonExchange_IRC",
                "timestamp":  "2023-10-28T09:20:00Z",
                "content":    "anyone know a good cashout point in Singapore?",
                "nlp_flags":  ["cashout_intent", "geography_flag"],
                "flag_count": 2,
                "suspect_id": "Unknown_Actor_77",
            },
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/v1/blockchain/nodes
# Returns: array of wallet nodes from the fracture graph
# ---------------------------------------------------------------------------

@app.get("/api/v1/blockchain/nodes", tags=["Blockchain"])
def get_blockchain_nodes():
    """
    Return mock wallet nodes representing the fractured transaction graph.
    Consumed by the D3.js / NetworkX force-directed graph component.
    """
    nodes = [
        {
            "wallet_id":   "Stolen_Main_Wallet",
            "node_type":   "source",
            "balance_usd": 42_000_000,
            "tx_count":    100,
            "is_flagged":  True,
        }
    ]
    # Generate 10 representative burner wallets for the mock
    amounts = [
        450000, 380000, 520000, 290000, 610000,
        175000, 830000, 420000, 340000, 480000,
    ]
    for i, amt in enumerate(amounts, start=1):
        nodes.append({
            "wallet_id":   f"Burner_Wallet_{i:03d}",
            "node_type":   "burner",
            "balance_usd": amt,
            "tx_count":    1,
            "is_flagged":  i in {2, 5, 8},   # random flagged subset
        })

    edges = [
        {"source": "Stolen_Main_Wallet", "target": f"Burner_Wallet_{i:03d}", "weight": amounts[i - 1]}
        for i in range(1, 11)
    ]

    return {"nodes": nodes, "edges": edges, "total_nodes": len(nodes)}


# ---------------------------------------------------------------------------
# GET /api/v1/correlation/timeline
# Returns: array of matched dormant-window events (the "red string" matches)
# ---------------------------------------------------------------------------

@app.get("/api/v1/correlation/timeline", tags=["Correlation"])
def get_correlation_timeline():
    """
    Return mock timeline events showing OSINT sleep-window / wallet-dormancy
    matches.  Consumed by the Red-String Timeline component.
    """
    return {
        "suspect_id": "DarkWeb_User99",
        "sleep_window": "02:00 AM --> 07:00 AM",
        "matches": [
            {
                "event_id":         "TL-001",
                "date":             "2023-10-27",
                "wallet_id":        "Burner_Wallet_005",
                "wallet_dormant":   True,
                "osint_post_count": 0,
                "match_type":       "FULL_DORMANCY",
                "correlation":      0.97,
            },
            {
                "event_id":         "TL-002",
                "date":             "2023-10-28",
                "wallet_id":        "Burner_Wallet_002",
                "wallet_dormant":   True,
                "osint_post_count": 0,
                "match_type":       "FULL_DORMANCY",
                "correlation":      0.93,
            },
            {
                "event_id":         "TL-003",
                "date":             "2023-10-29",
                "wallet_id":        "Burner_Wallet_008",
                "wallet_dormant":   False,
                "osint_post_count": 1,
                "match_type":       "PARTIAL_MATCH",
                "correlation":      0.64,
            },
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/v1/suspects/leaderboard
# Returns: ranked list of suspects with live guilt_score_percentage
# ---------------------------------------------------------------------------

@app.get("/api/v1/suspects/leaderboard", tags=["Suspects"])
def get_suspects_leaderboard():
    """
    Return mock suspects ranked by guilt score.
    Scores are computed live via ``calculate_final_guilt`` from guilt_engine.py
    so the leaderboard reflects real weights even in mock mode.
    """
    raw_suspects = [
        {
            "suspect_id":          "DarkWeb_User99",
            "alias":               "GhostLayer",
            "nlp_flag_count":      4,
            "is_puppeteer":        True,
            "sleep_score":         0.97,
            "is_linked_to_source": True,
            "country_guess":       "Unknown / TOR",
        },
        {
            "suspect_id":          "Unknown_Actor_77",
            "alias":               "SingaporeGhost",
            "nlp_flag_count":      2,
            "is_puppeteer":        True,
            "sleep_score":         0.72,
            "is_linked_to_source": False,
            "country_guess":       "SG (inferred)",
        },
        {
            "suspect_id":          "CryptoHaven_9x",
            "alias":               "LayerKing",
            "nlp_flag_count":      1,
            "is_puppeteer":        False,
            "sleep_score":         0.55,
            "is_linked_to_source": True,
            "country_guess":       "Unknown",
        },
        {
            "suspect_id":          "AnonExchange_Z",
            "alias":               "Mule_Z",
            "nlp_flag_count":      0,
            "is_puppeteer":        False,
            "sleep_score":         0.10,
            "is_linked_to_source": False,
            "country_guess":       "Unknown",
        },
    ]

    # Compute live guilt scores and sort descending
    scored = []
    for s in raw_suspects:
        guilt = calculate_final_guilt(
            nlp_flag_count=s["nlp_flag_count"],
            is_puppeteer=s["is_puppeteer"],
            sleep_score=s["sleep_score"],
            is_linked_to_source=s["is_linked_to_source"],
        )
        scored.append({**s, "guilt_score_percentage": guilt})

    scored.sort(key=lambda x: x["guilt_score_percentage"], reverse=True)

    return {
        "leaderboard": scored,
        "total_suspects": len(scored),
        "scoring_weights": {
            "nlp_flags_present": "+20 pts",
            "puppeteer_cluster": "+20 pts",
            "sleep_correlation":  "score × 35 pts (max +35)",
            "linked_to_source":  "+25 pts",
            "max_score":         "100 pts",
        },
    }
