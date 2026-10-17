import { useState } from "react";
import { CanvasScrollytelling } from "./components/scrollytelling/CanvasScrollytelling";
import { WordRevealNarrative } from "./components/WordRevealNarrative";
import { PeelChainFlow } from "./components/graph/PeelChainFlow";
import { SuspectDossier } from "./components/SuspectDossier";
import { FloatingNavbar } from "./components/FloatingNavbar";
import { ForensicArchitecture } from "./components/ForensicArchitecture";
import { useForensicData } from "./services/api";
import {
  Search,
  Radio,
} from "lucide-react";

export default function App() {
  const { osint, correlations, isLiveBackend, isLoading } = useForensicData();
  const [activeView, setActiveView] = useState<"landing" | "workbench">("landing");
  const [activeCorr, setActiveCorr] = useState<string>("osint-101");
  const [activeWalletId, setActiveWalletId] = useState<string>("0x66f0...99bb");

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
    <div className="min-h-screen w-full bg-[#0d0e12] text-slate-200 font-sans antialiased selection:bg-slate-800">
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
        </main>
      )}

      {/* ───────────────────────────────────────────────────────────
          VIEW 2: DE-CONGESTED FORENSIC WORKBENCH (25% / 50% / 25%)
      ─────────────────────────────────────────────────────────── */}
      {activeView === "workbench" && (
        <main id="workbench" className="p-4 md:p-6 pt-24 md:pt-28 space-y-4">
          {/* Workbench Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800/80 text-xs gap-3 font-sans">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-100 text-sm">
                Interactive Forensic Workbench
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-xs">
                Active Genesis Target: <span className="font-mono text-slate-200">0x7a1b...4e92</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Correlation Algorithm:</span>
                <span className="text-slate-200 font-medium">Poisson-Latency v2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Latency Delta:</span>
                <span className="text-red-400 font-medium font-mono">840ms</span>
              </div>
              <button
                onClick={() => setActiveView("landing")}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer ml-2"
              >
                Back to Scrollytelling
              </button>
            </div>
          </div>

          {/* 3-Column Stepped Workbench Hierarchy: 25% | 50% | 25% */}
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)] min-h-[640px]">
            {/* PANEL 1 (Left 25% - col-span-3): OSINT Stream */}
            <div className="col-span-12 lg:col-span-3 bg-[#14161f] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs font-sans">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5 mb-3">
                  <span className="text-slate-200 font-semibold text-xs tracking-tight flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400" /> OSINT Intercepts
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {osint.length} Signals Captured
                  </span>
                </div>

                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-[#10121a] border border-slate-800/80 rounded-lg space-y-2">
                        <div className="h-2.5 bg-slate-700 rounded w-1/3" />
                        <div className="h-3 bg-slate-800 rounded w-full" />
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
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#1c1f2e] border-red-500 shadow-md shadow-red-950/20 text-slate-100"
                              : "bg-[#10121a] border-slate-800/90 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-sans">
                            <span className="font-semibold text-slate-200 capitalize">
                              {item.source}
                            </span>
                            <span className="font-mono text-[10px]">{item.timestamp}</span>
                          </div>

                          <p className="text-xs leading-relaxed mb-2 text-slate-200 font-sans">
                            "{item.text}"
                          </p>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                            <span className="font-mono text-[10px] text-slate-400">{item.author_id}</span>
                            <div className="flex gap-1">
                              {item.keywords_flagged.map((k) => (
                                <span
                                  key={k}
                                  className="bg-slate-800 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-medium font-sans"
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
              <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 mt-3 flex justify-between items-center font-sans">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400" /> Sensor Feed Active
                </span>
                <span className="font-mono text-[10px]">/api/v1/osint/feed</span>
              </div>
            </div>

            {/* PANEL 2 (Middle 50% - col-span-6): Topological Peel-Chain Graph (@xyflow/react) */}
            <div className="col-span-12 lg:col-span-6 bg-[#14161f] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs overflow-hidden">
              <PeelChainFlow
                activeWalletId={activeWalletId}
                onSelectWallet={handleSelectWallet}
              />
            </div>

            {/* PANEL 3 (Right 25% - col-span-3): Target Attribution & Circadian Analysis */}
            <div className="col-span-12 lg:col-span-3 bg-[#14161f] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs overflow-hidden">
              <SuspectDossier />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}