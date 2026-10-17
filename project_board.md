<<<<<<< HEAD
# 🕵️ Project RedString — GHOST ATTACKS: Frontend War Room
**Last Updated:** 2026-10-17T22:15:41+05:30  
**Agent on Duty:** Frontend Weaver (Amishi)  
**Status:** 🟡 In Progress

---

## 🗂️ Board Overview

| Area | Owner | Status | Notes |
|---|---|---|---|
| Frontend Unified App (`frontend/`) | Amishi | ✅ Done | Vite + React 19 + TypeScript + Tailwind v3 |
| Landing Page Hero + Lenis Smooth Scroll | Amishi | ✅ Done | Hardware-accelerated smooth scrolling, $42M ticker (`skiper37`) |
| WordReveal Narrative (`skiper70`) | Amishi | ✅ Done | Sticky scroll-tied word-by-word reveal with keyword highlighting |
| Dragnet Board UI (OSINT Ingestion) | Amishi | ✅ Done | Multi-source chatter, keyword tags, scanning radar states |
| Fractured Wallet Matrix (Peel-Chain) | Amishi | ✅ Done | 38-hop topology, OTC exit badges, Apple-style replay scrubber (`skiper3`) |
| Attribution Dossier & Sleep-Cycle Chart | Amishi | ✅ Done | Guilt score meter, 24h circadian dormancy sync histogram |
| Red Thread Linkage Engine | Amishi | ✅ Done | Dynamic SVG cubic bezier crimson thread with live recalculation |
| Floating Telemetry HUD (`skiper102`) | Amishi | ✅ Done | Collapsible telemetry monitor reporting latency, hops, and stream status |
| API Service Layer (`services/api.ts`) | Amishi | ✅ Done | Dual-mode: live backend polling + resilient offline fallback telemetry |
| Backend OSINT Engine | Yash | ⏳ Pending | `/backend/osint_engine` |
| Blockchain Engine | Sanchita | ⏳ Pending | `/backend/blockchain_engine` |
| Correlation Engine | Sanchita | ⏳ Pending | `/backend/correlation_engine` |

---

## 📐 Frontend Architecture (`frontend/`)

### Directory Structure
```
frontend/
├── src/
│   ├── components/
│   │   └── WordRevealNarrative.tsx     # skiper70 – Scroll word-by-word reveal
│   ├── services/
│   │   └── api.ts                      # Typed API service + useForensicData hook
│   ├── App.tsx                         # 3-Stage Unified App (Hero + Narrative + War Room)
│   ├── main.tsx                        # Root entry point importing index.css first
│   └── index.css                       # Tailwind v3 directives, Inter + JetBrains Mono, dark tokens
├── tailwind.config.js                  # Tailwind v3 configuration + grid-cols-24 extension
├── postcss.config.js                   # PostCSS with tailwindcss and autoprefixer
├── package.json                        # Dependencies: lenis, framer-motion, @number-flow/react, lucide-react
└── vite.config.ts                      # Vite configuration with @vitejs/plugin-react
```

### API Endpoints Consumed
| Method | Endpoint | Consumer Component |
|---|---|---|
| GET | `/api/v1/osint/feed` | `DragnetBoard` |
| GET | `/api/v1/blockchain/nodes` | `HeatmapMatrix` |
| GET | `/api/v1/correlation/timeline` | `FusionTimeline`, `RedThreadEngine` |
| GET | `/api/v1/suspects/leaderboard` | `SuspectCards` |

### Key Tech Choices
| Concern | Choice |
|---|---|
| Animations | Framer Motion v11 |
| Data Fetching | TanStack React Query v5 |
| Charts | Recharts + Custom HTML5 Canvas |
| SVG Threads | Native SVG with requestAnimationFrame |
| Fonts | Inter (sans) + JetBrains Mono (mono) |
| Styling | Tailwind CSS v4 (dark mode first) |

---

## 🎨 Design Tokens

| Token | Value |
|---|---|
| Background | `#08090c` |
| Panel | `rgba(18, 20, 26, 0.7)` |
| Border | `zinc-800/80` = `rgba(39,39,42,0.8)` |
| Crimson Thread | `#ef4444` with `drop-shadow(0 0 8px rgba(239,68,68,0.8))` |
| Amber Cashout Halo | `#f59e0b` pulsing ring |
| Text Primary | `#f4f4f5` |
| Text Mono | `#4ade80` (green terminal) / `#60a5fa` (blue data) |

---

## 🔴 Red Thread Engine Rules
- SVG overlay is **position: fixed, full viewport, pointer-events: none**
- Coordinate recalculation on: scroll, resize, data update, correlation trigger
- Thread color: `#ef4444`, glow: `drop-shadow(0 0 8px rgba(239,68,68,0.8))`
- Animation: SVG `stroke-dasharray` / `stroke-dashoffset` draw-on effect, 800ms ease-out

---

## 📋 Task Log

### ✅ 2026-10-17 — Initial Frontend Build (Frontend Weaver)
- Scaffolded Next.js 15 App Router project in `frontend/`
- Created typed API service layer with TanStack React Query hooks
- Built `DragnetBoard` with glitch decrypt hover, keyword badges, source chips
- Built `HeatmapMatrix` with Canvas peel-chain graph and amber cashout halos
- Built `FusionTimeline` with dual-axis OSINT/Ledger scrubber + `RedThreadEngine` bezier threads
- Built `SuspectCards` with animated guilt meters and 24h sleep-cycle charts
- Integrated `AnimatedNumber` (skiper37), `WordReveal` (skiper70), `MatrixHUD` (skiper102), `MediaController` (skiper3) animation primitives
- Assembled full `WarRoom` dashboard in `app/page.tsx`

### ✅ 2026-10-18 — Human-Designed Intelligence Redesign (Linear / Gotham / Chainalysis Style)
- **Typography & Clean UI Chrome:**
  - Banned all-caps monospace on UI labels, titles, descriptions, buttons, and badges.
  - Set default typography to human sans-serif (`font-sans`), restricting `font-mono` exclusively to raw hashes and UTC timestamps.
  - Removed robotic tropes, `//` double-slashes, and `>_` terminal arrows in favor of natural Title Case ("OSINT Intercepts", "Peel-Chain Topology", "Target Attribution").
- **View 1: Narrative Landing Page:**
  - Hero with human headline: *"Quantitative Blockchain Forensics"* and subtitle: *"Fusing unstructured OSINT signals with mathematical ledger topology to deanonymize exploit cashouts in real time."*
  - 3-Column Exploit/Conflict/Fusion problem-solution architecture cards.
  - Interactive `$42,000,000 USD` financial counter strictly formatted with `en-US` grouping and `94.8%` certainty badge.
  - Dedicated *"Launch Forensic Workbench →"* navigation CTA and top tabbed view switcher.
- **View 2: De-Congested Stepped Workbench Hierarchy (25% / 50% / 25%):**
  - **Panel 1 (Left 25%):** OSINT Intercepts stream with source badges, timestamps, and active trace triggers.
  - **Panel 2 (Middle 50%):** Topological Peel-Chain Graph powered by `@xyflow/react`:
    - Structured Left-to-Right Directed Acyclic Graph (DAG) with custom `WalletNode` components.
    - Smoothstep bezier edges with directional arrow markers and animated deep crimson (`#dc2626`) active threat routing.
    - Tactical amber `#d97706` badges on OTC Cashout Gateways with zero node overlapping.
    - Integrated React Flow pan/zoom controls and bottom minimalist replay scrubber.
  - **Panel 3 (Right 25%):** Target Attribution & Circadian Analysis:
    - Prime suspect card, animated guilt index, and crisp 24-hour SVG bar chart highlighting the *"Dormancy Window (UTC+3 Moscow Sync)"* (04:00 - 11:00 UTC).
    - Clean bulleted proof vectors.
- **Color Palette & Polish:** Matte charcoal `#0d0e12`, elevated slate cards `#14161f`, crisp hairline borders `border-slate-800/80`.
- Verified production build (`tsc -b && vite build`) with zero TypeScript errors.

---

## ⏳ Next Steps / Open Items

| # | Item | Who | Priority |
|---|---|---|---|
| 1 | Wire real API base URL via `NEXT_PUBLIC_API_URL` env var | Amishi | High |
| 2 | Test with live backend data once OSINT engine ships | Amishi + Yash | High |
| 3 | Build `/backend/osint_engine` Python scraper | Yash | High |
| 4 | Build `/backend/blockchain_engine` peel-chain parser | Sanchita | High |
| 5 | Build `/backend/correlation_engine` matching algo | Sanchita | High |
| 6 | Add WebSocket live feed to `DragnetBoard` once backend ready | Amishi | Medium |
| 7 | Performance audit – Canvas FPS profiling | Amishi | Medium |
| 8 | Mobile responsive pass | Amishi | Low |
=======
# 🔴 Project RedString — Task Board

---

## 📋 Backlog

- Amishi Task 1: Dark-Mode FBI War Room UI Shell
- Amishi Task 2: Network Graph Visualization Component (D3.js)
- Yash Task 1: Dark-Web Chatter Scraper / Parser
- Yash Task 2: Behavioral Intent Flagging (Regex + NLP)
- Sanchita Task 2: Correlation Probability Engine

---

## 🔄 In Progress

- **Sanchita Task 1: Wallet Fracture Mocking/Tracing** *(Assigned: Sanchita — The Tracker)*

---

## ✅ Done


>>>>>>> 785d255cda3339e635b8b0fa6967d436a5e879f4
