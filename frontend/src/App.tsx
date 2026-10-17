import { useState, useEffect } from "react";
import NumberFlow from "@number-flow/react";
import { WordRevealNarrative } from "./components/WordRevealNarrative";
import { PeelChainFlow } from "./components/graph/PeelChainFlow";
import { SuspectDossier } from "./components/SuspectDossier";
import { useForensicData } from "./services/api";
import {
  ArrowRight,
  ShieldAlert,
  Search,
  Database,
  GitBranch,
  Radio,
} from "lucide-react";

export default function App() {
  const { osint, correlations, isLiveBackend, isLoading } = useForensicData();
  const [activeView, setActiveView] = useState<"landing" | "workbench">("landing");
  const [activeCorr, setActiveCorr] = useState<string>("osint-101");
  const [activeWalletId, setActiveWalletId] = useState<string>("0x66f0...99bb");
  const [drainedAmount, setDrainedAmount] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDrainedAmount(42000000);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-slate-200 font-sans antialiased selection:bg-slate-800">
      {/* Global Navigation Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-[#10121a]/90 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span className="font-semibold text-slate-100 text-sm tracking-tight">
            Project RedString
          </span>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-slate-400 text-xs">Forensic Ledger Intelligence</span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#161822] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveView("landing")}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              activeView === "landing"
                ? "bg-slate-700/80 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView("workbench")}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "workbench"
                ? "bg-slate-700/80 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Live Workbench
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveBackend ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </button>
        </div>

        {/* Telemetry Status */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="text-slate-400">
            Case Reference: <span className="font-mono text-slate-200 text-xs">42M-DEFI-HEIST</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
              isLiveBackend
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/80"
                : "bg-slate-800/80 text-slate-400 border-slate-700/80"
            }`}
          >
            {isLiveBackend ? "Live Engine" : "Local Telemetry"}
          </span>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────
          VIEW 1: NARRATIVE LANDING PAGE
      ─────────────────────────────────────────────────────────── */}
      {activeView === "landing" && (
        <main className="space-y-16 pb-20">
          {/* Hero Section */}
          <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-900/60 bg-red-950/30 text-red-400 text-xs font-medium mb-6">
              <ShieldAlert className="w-3.5 h-3.5" />
              Autonomous Threat Actor Deanonymization
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
              Quantitative Blockchain Forensics
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Fusing unstructured OSINT signals with mathematical ledger topology to deanonymize exploit cashouts in real time.
            </p>

            {/* Financial Counter Banner */}
            <div className="mt-8 inline-flex items-center gap-4 bg-[#14161f] border border-slate-800 rounded-xl px-6 py-4 shadow-xl">
              <div className="text-left">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Active Stolen Capital Traced
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-baseline gap-1.5">
                  <span>$</span>
                  <NumberFlow
                    value={drainedAmount}
                    locales="en-US"
                    format={{ useGrouping: true }}
                  />
                  <span className="text-sm font-normal text-slate-400">USD</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800 mx-2" />

              <div className="text-left">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Attribution Certainty
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-red-500 tracking-tight">
                  <NumberFlow value={94.8} locales="en-US" />%
                </div>
              </div>
            </div>

            {/* Launch Primary CTA */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setActiveView("workbench")}
                className="flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm px-6 py-3 rounded-lg transition shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Launch Forensic Workbench
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Key Problem / Solution Cards (3-Column Grid) */}
          <section className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-100 tracking-tight">
                Forensic Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                How Project RedString Bridges The Gap Between Chatter and On-Chain Movement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: The Exploit */}
              <div className="bg-[#14161f] border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
                <div className="w-9 h-9 rounded-lg bg-red-950/50 border border-red-900/60 flex items-center justify-center text-red-400 mb-4">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">
                  1. The Exploit
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  $42M in digital assets was drained from liquidity smart contracts at 2:14 AM and instantly fractured into 38 peel-chain micro-wallets and cross-chain privacy bridges.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                  <span>Initial Loss: $42,000,000</span>
                  <span>Hop Depth: 3 Hops</span>
                </div>
              </div>

              {/* Card 2: The Conflict */}
              <div className="bg-[#14161f] border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
                <div className="w-9 h-9 rounded-lg bg-amber-950/50 border border-amber-900/60 flex items-center justify-center text-amber-400 mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">
                  2. The Conflict
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  OSINT investigators drown in unstructured Telegram leaks and developer chatter, while on-chain analysts stare at anonymous wallet strings without identity provenance.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                  <span>Unstructured Data</span>
                  <span>Siloed Analysts</span>
                </div>
              </div>

              {/* Card 3: The Fusion Engine */}
              <div className="bg-[#14161f] border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
                <div className="w-9 h-9 rounded-lg bg-blue-950/50 border border-blue-900/60 flex items-center justify-center text-blue-400 mb-4">
                  <GitBranch className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">
                  3. The Fusion Engine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Statistical Poisson-latency matching and topological DAG clustering mathematically fuse forum personas with on-chain hops to deanonymize actors before fiat off-ramps.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                  <span>Latency Delta: 840ms</span>
                  <span>Dormancy Sync</span>
                </div>
              </div>
            </div>
          </section>

          {/* Word Reveal Briefing Section (skiper70) */}
          <WordRevealNarrative />
        </main>
      )}

      {/* ───────────────────────────────────────────────────────────
          VIEW 2: DE-CONGESTED FORENSIC WORKBENCH (25% / 50% / 25%)
      ─────────────────────────────────────────────────────────── */}
      {activeView === "workbench" && (
        <main className="p-4 md:p-6 space-y-4">
          {/* Workbench Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800/80 text-xs gap-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-100 text-sm">
                Interactive Forensic Workbench
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-xs">
                Active Target: <span className="font-mono text-slate-200">0x7a1b...4e92</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Correlation Engine:</span>
                <span className="text-slate-200 font-medium">Poisson-Latency v2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Latency Delta:</span>
                <span className="text-red-400 font-medium">840ms</span>
              </div>
            </div>
          </div>

          {/* 3-Column Stepped Workbench Hierarchy: 25% | 50% | 25% */}
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)] min-h-[640px]">
            {/* PANEL 1 (Left 25% - col-span-3): OSINT Stream */}
            <div className="col-span-12 lg:col-span-3 bg-[#14161f] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between text-xs">
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
                                  className="bg-slate-800 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-medium"
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
                  <Radio className="w-3 h-3 text-emerald-400" /> Feed Active
                </span>
                <span className="font-mono text-[10px]">/api/v1/osint/feed</span>
              </div>
            </div>

            {/* PANEL 2 (Middle 50% - col-span-6): Topological Peel-Chain Graph */}
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