# Project RedString — Hackathon Board

## Status Legend
| Symbol | Meaning |
|--------|---------|
| 🔄 | In Progress |
| ✅ | Complete & Verified |
| ⏳ | Pending |
| ❌ | Blocked |

---

## Phase 1 — Synthetic Mock Data Generation ✅
**Target:** `backend/data/raw/`

| Deliverable | Status |
|-------------|--------|
| `generate_mock_data.py` | ✅ |
| `osint_chatter.json` (210 posts, 5 suspects, sleep blackout) | ✅ |
| `blockchain_txs.json` ($42M exploit → 3 mixer hops → 30 exits) | ✅ |

---

## Phase 2 — OSINT Engine & Circadian Detection ✅
**Target:** `backend/osint_engine/`

| Deliverable | Status |
|-------------|--------|
| `parser.py` | ✅ |
| `sleep_cycle.py` | ✅ |
| `tests/test_osint.py` (16/16 passed) | ✅ |

---

## Phase 3 — Blockchain Graph Engine & Dormancy Analysis ✅
**Target:** `backend/blockchain_engine/`

| Deliverable | Status |
|-------------|--------|
| `graph_builder.py` | ✅ |
| `dormancy.py` | ✅ |
| `tests/test_blockchain.py` (20/20 passed) | ✅ |

---

## Phase 4 — Probabilistic Correlation & RedString Engine ✅
**Target:** `backend/correlation_engine/`

| Deliverable | Status |
|-------------|--------|
| `correlator.py` | ✅ |
| `timeline_builder.py` | ✅ |
| `tests/test_correlation.py` (29/29 passed) | ✅ |

---

## Phase 5 — FastAPI Web2 Delivery Layer ✅
**Target:** `backend/api/`

| Deliverable | Status |
|-------------|--------|
| `main.py` (FastAPI + CORS) | ✅ |
| Routes: `/osint/feed`, `/blockchain/nodes`, `/correlation/timeline`, `/suspects/leaderboard` | ✅ |
| `tests/test_api.py` (requires: `pip install -r backend/requirements.txt`) | ✅ |

---

## Phase 6 — Pre-Frontend Audit & Bug Patch ✅
**Scope:** Validate all 4 requested fixes + endpoint readiness for Next.js frontend

| Fix / Check | Status |
|---|---|
| `dormancy.py`: No `KNOWN_BLACKOUT_*` / Ghost0x hardcoding in engine | ✅ (verified clean) |
| `dormancy.py`: `MIN_TX_THRESHOLD=3` + 0.5 penalty cap for sparse wallets | ✅ (verified in place) |
| `timeline_builder.py`: `_parse_iso()` handles `Z` suffix (Py <3.11) | ✅ (verified in place) |
| `main.py`: No `@lru_cache` on data loaders (no mutation bugs) | ✅ (verified clean) |
| `test_blockchain.py`: Removed stale `overlap_with_ghost0x` assertion | ✅ |
| `test_api.py`: Removed stale `cache_clear()` calls from setUp | ✅ |
| All 4 endpoints return valid JSON 200 with expected keys | ✅ (96/96 tests pass) |
| `hour_utc` / `timestamp_utc` keys present in all mock data records | ✅ |
| No NoneType errors across modules | ✅ |

---

## Architecture Notes
- All modules output clean JSON for FastAPI consumption
- Strict directory isolation per `agents.md`
- No heavy ML — Regex + lightweight NLP only
- CORS open for frontend dev (Amishi's Next.js)
- Blockchain engine is purely transaction-metric driven; all cross-domain correlation is in `correlator.py`

## Run Commands
```bash
# Install deps
pip install -r backend/requirements.txt

# Generate mock data
python backend/data/raw/generate_mock_data.py

# Run all unit tests
python -m unittest discover -s backend/tests -v

# Start API server (http://localhost:8000/docs)
python -m backend.api.main
```

