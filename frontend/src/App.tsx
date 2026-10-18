import { useState, useEffect } from "react";
import { CanvasScrollytelling } from "./components/scrollytelling/CanvasScrollytelling";
import { WordRevealNarrative } from "./components/WordRevealNarrative";
import { PeelChainFlow } from "./components/graph/PeelChainFlow";
import { SuspectDossier } from "./components/SuspectDossier";
import { FloatingNavbar } from "./components/FloatingNavbar";
import { ForensicArchitecture } from "./components/ForensicArchitecture";
import HackerTerminal from "./pages/HackerTerminal";
import { useForensicData, BASE_URL } from "./services/api";
import {
  Search,
  Radio,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function App() {
  // Direct adversarial exploit console routing
  if (typeof window !== "undefined" && window.location.pathname === "/hacker") {
    return <HackerTerminal />;
  }

  const isBreachQuery = typeof window !== "undefined" && window.location.search.includes("breach=true");
  const { osint, nodes, edges, correlations, suspects, isLiveBackend, isLoading, refetch } = useForensicData();
  const [activeView, setActiveView] = useState<"landing" | "workbench">(isBreachQuery ? "workbench" : "landing");
  const [activeCorr, setActiveCorr] = useState<string>("osint-101");
  const [activeWalletId, setActiveWalletId] = useState<string>("0x66f0...99bb");

  // Multi-Device Siren & Attack State
  const [alertState, setAlertState] = useState<{
    is_under_attack: boolean;
    incident_id?: string;
    attacker_alias?: string;
    amount_usd?: number;
    exploit_type?: string;
  }>({ is_under_attack: false });
  const [showSirenModal, setShowSirenModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // 1.5-second polling loop for real-time breach detection from any connected device
  useEffect(() => {
    let isMounted = true;

    const playBreachChime = () => {
      try {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext })?.webkitAudioContext;
        if (!AudioClass) return;
        const ctx = new AudioClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 500);
      } catch {
        // Audio playback error or autoplay policy fallback
      }
    };

    const pollAlerts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/alerts/latest`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          if (!isMounted || !data) return;

          setAlertState((prev) => {
            const wasUnderAttack = Boolean(prev?.is_under_attack);
            const isNowUnderAttack = Boolean(data?.is_under_attack);

            if (isNowUnderAttack && !wasUnderAttack) {
              setShowSirenModal(true);
              setActiveView("workbench");
              refetch();
              try { playBreachChime(); } catch {}
            } else if (!isNowUnderAttack && wasUnderAttack) {
              setShowSirenModal(false);
              refetch();
            } else if (isNowUnderAttack) {
              refetch();
            }
            return data;
          });
        }
      } catch {
        // Network timeout fallback
      }
    };

    pollAlerts();
    const interval = setInterval(pollAlerts, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-sync active selections when live forensic data updates
  useEffect(() => {
    if (nodes?.length > 0) {
      const exists = nodes.some((n) => n.wallet_id === activeWalletId || (n as any).walletId === activeWalletId);
      if (!exists) {
        const root = nodes.find((n) => n.hop_level === 0 || (n as any).hop === 0) || nodes[0];
        if (root) {
          setActiveWalletId(root.wallet_id || (root as any).walletId || "");
        }
      }
    }
  }, [nodes, activeWalletId]);

  useEffect(() => {
    if (osint?.length > 0) {
      const exists = osint.some((o) => o.id === activeCorr);
      if (!exists) {
        setActiveCorr(osint[0].id);
      }
    }
  }, [osint, activeCorr]);

  const handleResetBreach = async () => {
    setIsResetting(true);
    try {
      await fetch(`${BASE_URL}/api/v1/simulation/reset`, { method: "POST" });
      setAlertState({ is_under_attack: false });
      setShowSirenModal(false);
      await refetch();
    } catch {
      // Backend offline fallback
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectOsint = (osintId: string) => {
    setActiveCorr(osintId);
    const match = correlations.find((c) => c.osint_id === osintId);
    if (match) {
      setActiveWalletId(match.wallet_id);
    }
  };

  const handleSelectWallet = (walletId: string) => {
    setActiveWalletId(walletId);
    const match = correlations.find((c) => c.wallet_id === walletId);
    if (match) {
      setActiveCorr(match.osint_id);
    }
  };

  const handleLaunchWorkbench = () => {
    setActiveView("workbench");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-slate-200 font-sans antialiased selection:bg-slate-800 relative">
      {/* ───────────────────────────────────────────────────────────
          REAL-TIME MULTI-DEVICE FULLSCREEN CRIMSON SIREN MODAL
      ─────────────────────────────────────────────────────────── */}
      {showSirenModal && alertState.is_under_attack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#14080a] border-2 border-red-600 rounded-2xl p-6 md:p-8 text-center shadow-[0_0_80px_rgba(239,68,68,0.65)] space-y-6 overflow-hidden">
            {/* Pulsing Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)] pointer-events-none animate-pulse" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-600/60 text-red-300 font-mono text-xs uppercase tracking-widest animate-bounce">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              <span>LIVE BREACH DETECTED · WAR ROOM ENGAGED</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
                ⚠️ CRITICAL INTRUSION DETECTED
              </h2>
              <p className="text-red-400 font-mono text-base md:text-lg font-bold">
                ${(alertState.amount_usd || 42000000).toLocaleString()} DRAINED BY{" "}
                <span className="text-white underline decoration-red-500 underline-offset-4">
                  {alertState.attacker_alias || "@Phantom_0x"}
                </span>
              </p>
            </div>

            <p className="text-xs text-zinc-300 font-mono max-w-lg mx-auto leading-relaxed">
              Target contract breach confirmed. Live peel-chain fracturing and dark web OSINT intercept telemetry have been routed to the Forensic Investigation Workbench.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowSirenModal(false)}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ENTER ACTIVE WAR ROOM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetBreach}
                disabled={isResetting}
                className="w-full sm:w-auto px-5 py-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 font-mono text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                <span>Reset Simulation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Glassmorphic Capsule Navbar */}
      <FloatingNavbar
        activeTab={activeView === "landing" ? "overview" : "workbench"}
        onTabChange={(tab) => {
          setActiveView(tab === "overview" ? "landing" : "workbench");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isLiveBackend={isLiveBackend}
      />

      {/* ───────────────────────────────────────────────────────────
          VIEW 1: SCROLLYTELLING ENGINE & NARRATIVE ARCHITECTURE
      ─────────────────────────────────────────────────────────── */}
      {activeView === "landing" && (
        <main className="space-y-0 pb-20">
          {/* Canvas Scrollytelling Engine: 300 WebP frames, h-[500vh], sticky canvas, Stage 1-3 overlays */}
          <CanvasScrollytelling onLaunchWorkbench={handleLaunchWorkbench} />

          {/* Word Reveal Incident Narrative (skiper70) with atmospheric bottom blend */}
          <WordRevealNarrative />

          {/* Liquid Glass Architecture Cards & Staggered Scroll with top blend mask */}
          <ForensicArchitecture onLaunch={handleLaunchWorkbench} />

          {/* Discrete Floating Adversary Exploit Terminal Link */}
          <a
            href="/hacker"
            className="fixed bottom-6 right-6 z-40 px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-red-950/80 hover:border-red-600/60 rounded-full text-xs font-mono text-zinc-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-2 transition cursor-pointer transform hover:scale-105 active:scale-95"
            title="Adversary Exploit Injection Console"
          >
            <span className="text-red-400">💀</span>
            <span className="text-zinc-200">ADVERSARY CONSOLE</span>
            <span className="text-[10px] text-red-400 font-sans">(/hacker)</span>
          </a>
        </main>
      )}

      {/* ───────────────────────────────────────────────────────────
          VIEW 2: DE-CONGESTED FORENSIC WORKBENCH (25% / 50% / 25%)
      ─────────────────────────────────────────────────────────── */}
      {activeView === "workbench" && (
        <main id="workbench" className="p-4 md:p-6 pt-24 md:pt-28 space-y-4">
          {/* Real-time Intrusion Banner when under active attack */}
          {alertState.is_under_attack && (
            <div className="bg-gradient-to-r from-red-950/90 via-red-900/70 to-red-950/90 border border-red-600/80 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs font-mono gap-3 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse">
              <div className="flex items-center gap-2.5 text-red-200">
                <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
                <span className="font-bold uppercase tracking-wider text-white">CRITICAL INTRUSION:</span>
                <span>${(alertState.amount_usd || 42000000).toLocaleString()} DRAINED BY {alertState.attacker_alias || "@Phantom_0x"}</span>
              </div>
              <button
                onClick={handleResetBreach}
                disabled={isResetting}
                className="px-3 py-1 bg-black/60 hover:bg-black/90 text-red-300 border border-red-700/60 rounded-md hover:text-white transition flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin" : ""}`} />
                <span>Reset Breach</span>
              </button>
            </div>
          )}

          {/* Workbench Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-zinc-800/80 text-xs gap-3 font-sans">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-100 text-sm">
                Forensic Investigation — Case #42M-DEFI-HEIST
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 text-xs">
                Active Genesis Target: <span className="font-mono text-zinc-200">0x7a1b...4e92</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Latency Offset:</span>
                <span className="text-zinc-200 font-medium font-mono">840ms</span>
              </div>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Topology:</span>
                <span className="text-zinc-200 font-medium">38 Hop Matrix</span>
              </div>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Algorithm:</span>
                <span className="text-zinc-200 font-medium">Time-Delta Fusion Engine</span>
              </div>
              <button
                onClick={handleResetBreach}
                disabled={isResetting}
                className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded bg-zinc-900/60 transition cursor-pointer"
                title="Reset simulation to baseline"
              >
                Reset Breach
              </button>
            </div>
          </div>

          {/* 3-Column Stepped Workbench Hierarchy: 25% | 50% | 25% */}
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)] min-h-[640px]">
            {/* PANEL 1 (Left 25% - col-span-3): OSINT Stream */}
            <div className="col-span-12 lg:col-span-3 bg-[#14161f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs font-sans">
              <div>
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2.5 mb-3 font-sans">
                  <span className="text-zinc-200 font-semibold text-xs tracking-tight flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-zinc-400" /> OSINT Intercepts
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {osint.length} Signals Captured
                  </span>
                </div>

                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-[#10121a] border border-zinc-800/80 rounded-lg space-y-2">
                        <div className="h-2.5 bg-zinc-700 rounded w-1/3" />
                        <div className="h-3 bg-zinc-800 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5 overflow-y-auto max-h-[58vh] pr-1">
                    {osint.map((item) => {
                      const isSelected = activeCorr === item.id;
                      return (
                        <div
                          key={item.id}
                          id={`card-${item.id}`}
                          onClick={() => handleSelectOsint(item.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/[0.04] border-amber-500/60 shadow-sm text-zinc-100"
                              : "bg-[#10121a] border-zinc-800/90 hover:border-zinc-700 text-zinc-300"
                          }`}
                        >
                          <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-sans">
                            <span className="font-semibold text-zinc-200 capitalize">
                              {item.source}
                            </span>
                            <span className="font-mono text-[10px]">{item.timestamp}</span>
                          </div>

                          <p className="text-xs leading-relaxed mb-2 text-zinc-200 font-sans">
                            "{item.text}"
                          </p>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-800/80 font-sans">
                            <span className="font-mono text-[10px] text-zinc-400">{item.author_id}</span>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {item.keywords_flagged.length > 0 ? (
                                item.keywords_flagged.map((k) => (
                                  <span
                                    key={k}
                                    className="bg-red-950/40 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded text-[10px] font-medium font-sans"
                                  >
                                    {k}
                                  </span>
                                ))
                              ) : (
                                <span className="bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 px-1.5 py-0.5 rounded text-[10px] font-medium font-sans">
                                  [Neutral Chatter]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Footer */}
              <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5 mt-3 flex justify-between items-center font-sans">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400" /> Sensor Feed Active
                </span>
                <span className="font-mono text-[10px] text-zinc-500">/api/v1/osint/feed</span>
              </div>
            </div>

            {/* PANEL 2 (Middle 50% - col-span-6): Topological Peel-Chain Graph (@xyflow/react) */}
            <div className="col-span-12 lg:col-span-6 bg-[#14161f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs overflow-hidden">
              <PeelChainFlow
                activeWalletId={activeWalletId}
                onSelectWallet={handleSelectWallet}
                nodes={nodes}
                edges={edges}
              />
            </div>

            {/* PANEL 3 (Right 25% - col-span-3): Target Attribution & Circadian Analysis */}
            <div className="col-span-12 lg:col-span-3 bg-[#14161f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs overflow-hidden">
              <SuspectDossier suspects={suspects} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}