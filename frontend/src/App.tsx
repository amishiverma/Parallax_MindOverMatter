import { useState } from "react";
import { CanvasScrollytelling } from "./components/scrollytelling/CanvasScrollytelling";
import { WordRevealNarrative } from "./components/WordRevealNarrative";
import { PeelChainFlow } from "./components/graph/PeelChainFlow";
import { SuspectDossier } from "./components/SuspectDossier";
import { FloatingNavbar } from "./components/FloatingNavbar";
import { ForensicArchitecture } from "./components/ForensicArchitecture";
import { WorkbenchTour } from "./components/WorkbenchTour";
import { BreachWarningModal } from "./components/BreachWarningModal";
import { useForensicData } from "./services/api";
import {
  Search,
  Radio,
  Activity,
  ShieldCheck,
} from "lucide-react";

export default function App() {
  const { osint, correlations, isLiveBackend, isLoading } = useForensicData();
  const [activeView, setActiveView] = useState<"landing" | "workbench">("landing");
  const [activeCorr, setActiveCorr] = useState<string>("osint-101");
  const [activeWalletId, setActiveWalletId] = useState<string>("0x66f0...99bb");

  // Attack simulation & breach warning modal state
  const [hasAttackOccurred, setHasAttackOccurred] = useState<boolean>(false);
  const [showBreachModal, setShowBreachModal] = useState<boolean>(false);

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

  const triggerAttackDemo = () => {
    setShowBreachModal(true);
    // Asynchronously notify backend simulation engine if live
    fetch("/api/v1/attack/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attacker_alias: "Aleksei_Voronin",
        amount_usd: 42000000,
        sleep_start_hour: 4,
        sleep_end_hour: 11,
        exploit_type: "Reentrancy Exploit",
        boast_message: "42M drained and peeled across mixers.",
      }),
    }).catch(() => {});
  };

  const handleDismissBreach = () => {
    setShowBreachModal(false);
    setHasAttackOccurred(true);
    setActiveView("workbench");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetToStandby = () => {
    setHasAttackOccurred(false);
    fetch("/api/v1/simulation/reset", { method: "POST" }).catch(() => {});
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-slate-200 font-sans antialiased selection:bg-slate-800">
      {/* Floating Glassmorphic Minimalist Navbar */}
      <FloatingNavbar
        activeTab={activeView === "landing" ? "overview" : "workbench"}
        onTabChange={(tab) => {
          setActiveView(tab === "overview" ? "landing" : "workbench");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isLiveBackend={isLiveBackend}
      />

      {/* Emergency Breach Warning Modal (5 Blinks + Glitch + Web Audio Synthesizer) */}
      <BreachWarningModal
        isOpen={showBreachModal}
        onDismiss={handleDismissBreach}
      />

      {/* ───────────────────────────────────────────────────────────
          VIEW 1: SCROLLYTELLING ENGINE & NARRATIVE ARCHITECTURE
      ─────────────────────────────────────────────────────────── */}
      {activeView === "landing" && (
        <main className="space-y-0 pb-20 relative">
          {/* Canvas Scrollytelling Engine: 300 WebP frames, sticky canvas */}
          <CanvasScrollytelling onLaunchWorkbench={handleLaunchWorkbench} />

          {/* Word Reveal Incident Narrative (skiper70) */}
          <WordRevealNarrative />

          {/* Liquid Glass Architecture Cards & Staggered Scroll */}
          <ForensicArchitecture onLaunch={handleLaunchWorkbench} />

          {/* Discrete Floating Attack Simulation Trigger Button */}
          <button
            onClick={triggerAttackDemo}
            className="fixed bottom-6 right-6 z-40 px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-700/60 rounded-full text-xs font-mono text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 transition cursor-pointer transform hover:scale-105 active:scale-95"
            title="Trigger Real-Time $42M Heist Simulation"
          >
            <span className="text-red-400">⚡</span>
            <span>SIMULATE $42M ATTACK</span>
          </button>
        </main>
      )}

      {/* ───────────────────────────────────────────────────────────
          VIEW 2: FORENSIC WORKBENCH (IDLE SCANNER VS LIVE ATTACK)
      ─────────────────────────────────────────────────────────── */}
      {activeView === "workbench" && (
        <main id="workbench" className="p-4 md:p-6 pt-24 md:pt-28 space-y-4">
          {/* Workbench Header Bar */}
          <div id="tour-telemetry" className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-zinc-800/80 text-xs gap-3 font-sans">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-100 text-sm">
                Forensic Investigation — Case #42M-DEFI-HEIST
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 text-xs">
                Active Genesis Target:{" "}
                <span className="font-mono text-zinc-200">
                  {hasAttackOccurred ? "0x7a1b...4e92" : "0x0000...0000 (IDLE)"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Latency Offset:</span>
                <span className="text-zinc-200 font-medium font-mono">
                  {hasAttackOccurred ? "840ms" : "12ms"}
                </span>
              </div>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Topology:</span>
                <span className="text-zinc-200 font-medium">
                  {hasAttackOccurred ? "38 Hop Matrix" : "0 Splitting Chains"}
                </span>
              </div>
              <span className="text-zinc-600">·</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Algorithm:</span>
                <span className="text-zinc-200 font-medium">Time-Delta Fusion Engine</span>
              </div>

              {hasAttackOccurred && (
                <button
                  onClick={handleResetToStandby}
                  className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-md transition cursor-pointer"
                  title="Reset to idle ledger monitoring"
                >
                  Reset Standby
                </button>
              )}

              <WorkbenchTour />
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              DATA GATE: IDLE SCANNER STATE VS ACTIVE 3-COLUMN WORKBENCH
          ─────────────────────────────────────────────────────────── */}
          {!hasAttackOccurred ? (
            /* IDLE SCANNER STATE */
            <div className="h-[calc(100vh-140px)] min-h-[580px] w-full bg-[#14161f] border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans select-none">
              {/* Ambient radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04)_0%,transparent_70%)] pointer-events-none" />

              {/* Pulsing Radar Ring Container */}
              <div className="relative mb-6 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-zinc-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-30" />
                  <div className="w-16 h-16 rounded-full border border-zinc-700/80 flex items-center justify-center">
                    <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Status Header */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-mono text-xs uppercase tracking-widest mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LEDGER MONITORING ACTIVE · IDLE SCANNER</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
                All 38 Monitored Bridges & Mixer Gateways Operating in Equilibrium
              </h2>

              <p className="text-zinc-400 text-sm max-w-lg mb-8 leading-relaxed font-sans">
                Zero abnormal liquidity drains or exploit signatures detected across watched protocol vaults.
                Trigger a live on-chain reentrancy attack simulation to observe real-time peel-chain fracturing and OSINT correlation.
              </p>

              {/* Action Trigger Button */}
              <button
                onClick={triggerAttackDemo}
                className="px-6 py-3 bg-red-950/80 hover:bg-red-900 border border-red-600/70 text-red-100 rounded-full text-xs font-mono tracking-wider flex items-center gap-2.5 shadow-[0_0_35px_rgba(239,68,68,0.35)] transition-all duration-200 cursor-pointer transform hover:scale-105"
              >
                <span className="text-red-400 text-sm">⚡</span>
                <span>SIMULATE $42M REENTRANCY ATTACK</span>
              </button>

              {/* Telemetry Ticker */}
              <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-500 font-mono border-t border-zinc-800/80 pt-4">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-zinc-400" /> CHAIN SYNC: 100%
                </span>
                <span>·</span>
                <span>LATENCY: 12ms</span>
                <span>·</span>
                <span>SURVEILLANCE AGENTS: 4 ONLINE</span>
                <span>·</span>
                <span>ACTIVE ANOMALIES: 0</span>
              </div>
            </div>
          ) : (
            /* ACTIVE 3-COLUMN WORKBENCH HIERARCHY */
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)] min-h-[640px]">
              {/* PANEL 1 (Left 25% - col-span-3): OSINT Stream */}
              <div
                id="tour-osint"
                className="col-span-12 lg:col-span-3 bg-[#14161f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs font-sans"
              >
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
                              <div className="flex gap-1">
                                {item.keywords_flagged.map((k) => (
                                  <span
                                    key={k}
                                    className="bg-zinc-800/60 text-zinc-300 border border-zinc-750 px-1.5 py-0.5 rounded text-[10px] font-medium font-sans"
                                  >
                                    {k}
                                  </span>
                                ))}
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
              <div
                id="tour-topology"
                className="col-span-12 lg:col-span-6 bg-[#14161f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs overflow-hidden"
              >
                <PeelChainFlow
                  activeWalletId={activeWalletId}
                  onSelectWallet={handleSelectWallet}
                />
              </div>

              {/* PANEL 3 (Right 25% - col-span-3): Target Attribution & Circadian Analysis */}
              <div className="col-span-12 lg:col-span-3 bg-[#14161f] border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs overflow-hidden">
                <SuspectDossier />
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}