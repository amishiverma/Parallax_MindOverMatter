# 🕵️ Project RedString — GHOST ATTACKS: Frontend War Room
**Last Updated:** 2026-10-18T02:07:00+05:30  
**Agent on Duty:** Frontend Weaver (Amishi)  
**Status:** 🟢 Operational / Scrollytelling Ready

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

### ✅ 2026-10-18 — Zero-Lag Canvas Scrollytelling Engine (300 WebP Frames)
- **Core Engine Implementation:**
  - Extracted 300 frames from `/assets/videos/heropg1.mp4` and converted to optimized WebP (`/frames/frame_001.webp` to `frame_300.webp`) using `ffmpeg` and `sharp`.
  - Built `CanvasScrollytelling.tsx` featuring `h-[500vh]` scroll track with `sticky top-0 h-screen w-full` wrapper.
  - Linked Framer Motion `useScroll` (`scrollYProgress` [0, 1]) to frame index [0, 299] via `useTransform`.
  - Implemented hardware-accelerated `requestAnimationFrame` drawing onto a `<canvas width={1920} height={1080}>` maintaining 16:9 aspect ratio cover.
  - Initial caching progress bar with real-time percentage and frame counter, auto-dismissing when all 300 frames are cached.
- **Dynamic Timed Overlays (Zero Text Overlap):**
  - **Stage 1 (0.0 to 0.18):** Anchored Hero overlay with `INCIDENT // 02:14 UTC EXPLOIT`, `Unmasking the Ghost in the Ledger`, and `@number-flow/react` ticker (`$42,000,000 USD Drained`).
  - **Stage 2 (0.20 to 0.75):** Center remains 100% clear. Far-right minimal vertical descent rail with active telemetry stage indicator: `[01 OSINT] -> [02 MATRIX] -> [03 CORRELATION]`.
  - **Stage 3 (0.80 to 1.0):** Centered high-impact bottom CTA button: `LAUNCH INVESTIGATION WORKBENCH ↓` smoothly navigating to the interactive forensic workbench.
- **Vignette & Theme:** Canvas opacity 90% with radial gradient vignette (`from-transparent via-black/45 to-[#090a0f]`), memory-safe unmount cleanup.
- **Precision Frame Processing & Zero-Artifact Smudge (`process_frames.cjs`):**
  - Removed the hard-coded rectangular blackout box div from [CanvasScrollytelling.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/scrollytelling/CanvasScrollytelling.tsx).
  - Executed updated [process_frames.cjs](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/process_frames.cjs) extracting 300 pristine frames directly from source 1280x720 video.
  - **Frames 001–082:** Clean tight crop (`padX: 7%`, `padY: 7%`) removing watermark naturally without smudge.
  - **Frames 083–300:** Preserved 100% horizontal width (slim 5.5% top/bottom cut only) with soft feathered radial black smudge (`cx="93%" cy="92%" r="13%"`), completely eliminating sharp boundaries or clipped cards.
  - Exported at `.webp({ quality: 92 })` with unsharp masking clarity boost (`sigma: 0.8`).
- **Floating Glassmorphic Navbar & Liquid Glass Cards:**
  - Built [FloatingNavbar.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/FloatingNavbar.tsx) detached capsule island (`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl`) with `bg-slate-900/40 backdrop-blur-2xl border border-white/10`, top specular gleam, crimson pulse dot, segmented switcher, and local telemetry pill.
  - Built [ForensicArchitecture.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/ForensicArchitecture.tsx) with Framer Motion `whileInView` staggered scroll animations, liquid glass cards with top specular rim lights, interactive hover lift, and sleek crimson gradient launch CTA.
  - Integrated into [App.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/App.tsx) with responsive workbench clearance.
- **Narrative Calibration & React Bits Integration:**
  - Calibrated [WordRevealNarrative.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/WordRevealNarrative.tsx) with `h-[240vh]` scroll track; all words illuminated (`opacity: 1`) by 85% scroll progress.
  - Added seamless atmospheric gradient merge (`from-transparent via-[#090a0f]/80 to-[#090a0f]`) transitioning into Forensic Architecture's top blend mask.
  - Integrated React Bits components: [ShinyText.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/reactbits/ShinyText.tsx) for dynamic headline specular sheen and [TextType.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/reactbits/TextType.tsx) (GSAP cursor) for the animated subtitle.
  - Applied Image 3 liquid glass spec (`bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]`) with top specular rim light across all 3 architecture cards.
- **3D Circular Gallery & Viewport Calibration:**
  - Built [CircularGallery.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/reactbits/CircularGallery.tsx) and [CircularGallery.css](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/reactbits/CircularGallery.css) powered by OGL WebGL.
  - Rendered 5 curved 3D evidence panels with smooth inertia drag, touch support, trackpad wheel rotation, cylindrical bend (`bend: 2`), and forensic card overlays.
  - Embedded inside [ForensicArchitecture.tsx](file:///Users/amishiverma/Documents/Projects/HackForge_MindOverMatter/frontend/src/components/ForensicArchitecture.tsx) in a dedicated `w-full h-[500px]` container.
  - Adjusted Framer Motion `viewport={{ once: true, amount: 0.1 }}` eliminating negative margin trigger stalls.

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
