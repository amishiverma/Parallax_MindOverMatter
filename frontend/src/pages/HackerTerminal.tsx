import { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Skull,
  ShieldAlert,
  Cpu,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const SLEEP_PRESETS = [
  { label: "Moscow / UTC+3 (04:00 – 11:00 UTC)", start: 4, end: 11 },
  { label: "New York / UTC-5 (23:00 – 06:00 UTC)", start: 23, end: 6 },
  { label: "Tokyo / UTC+9 (14:00 – 21:00 UTC)", start: 14, end: 21 },
];

const EXPLOIT_OPTIONS = [
  "VaultV2: Unchecked Reentrancy Exploit",
  "BridgeRelay: Flash Loan Oracle Manipulation",
  "TreasuryDAO: Multisig Signature Bypass",
];

const MIXER_ROUTES = [
  "Railgun Shielded Pool → Bitzlato OTC Desk",
  "Tornado Cash (100 ETH Pools) → P2P Off-Ramp",
  "Cross-Chain Hop (Ethereum → Arbitrum → Monero)",
];

export default function HackerTerminal() {
  // 1. Form States
  const [alias, setAlias] = useState("@Phantom_0x");
  const [sleepPreset, setSleepPreset] = useState(0);
  const [boastMsg, setBoastMsg] = useState(
    "Drained the vault in 4 blocks. Fractured across mixers. Good luck tracing this lmao."
  );
  const [exploitType, setExploitType] = useState(EXPLOIT_OPTIONS[0]);
  const [amountUsd, setAmountUsd] = useState(42000000);
  const [mixerRoute, setMixerRoute] = useState(MIXER_ROUTES[0]);
  const [fractureDepth, setFractureDepth] = useState(38);

  // 2. Execution State
  const [status, setStatus] = useState<"idle" | "broadcasting" | "breached">("idle");

  const handleLaunch = async () => {
    setStatus("broadcasting");

    const payload = {
      attacker_alias: alias,
      amount_usd: amountUsd,
      sleep_start_hour: SLEEP_PRESETS[sleepPreset].start,
      sleep_end_hour: SLEEP_PRESETS[sleepPreset].end,
      exploit_type: exploitType,
      boast_message: boastMsg,
      mixer_route: mixerRoute,
      fracture_depth: fractureDepth,
    };

    try {
      await fetch("/api/v1/attack/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Backend offline fallback handled gracefully
    }

    setTimeout(() => {
      setStatus("breached");
    }, 1200);
  };

  return (
    <div className="relative min-h-screen text-zinc-300 font-sans p-6 md:p-12 flex justify-center selection:bg-red-500/20">
      {/* 1. ANIMATED MOVING RED GRADIENT BACKGROUND */}
      <div className="-z-10 fixed inset-0 overflow-hidden pointer-events-none bg-[#07080b]">
        {/* Orb 1 (Top-Left) */}
        <motion.div
          className="absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full bg-red-600/15 blur-[140px]"
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Orb 2 (Bottom-Right) */}
        <motion.div
          className="absolute -bottom-32 -right-32 w-[700px] h-[700px] rounded-full bg-rose-700/15 blur-[160px]"
          animate={{
            x: [0, -70, 50, 0],
            y: [0, 50, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        
        {/* Glassmorphic Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 backdrop-blur-md border border-red-500/25 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <Skull className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  EXPLOIT INJECTION CONSOLE
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono tracking-wider text-red-300 bg-red-500/10 backdrop-blur-md border border-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                  BLACK-HAT SIMULATOR
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Target: Gravitas Vault Contract (Mainnet Ethereum)
              </p>
            </div>
          </div>
          <a
            href="/"
            className="self-start sm:self-center rounded-full px-4 py-1.5 bg-white/[0.04] backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-all hover:bg-white/[0.08] flex items-center gap-1.5 cursor-pointer"
          >
            ← Exit to Main App
          </a>
        </div>

        {/* SECTION 1: IDENTITY & OPSEC PROFILE (LIQUID GLASS) */}
        <div className="relative rounded-3xl p-6 md:p-8 bg-slate-900/30 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden space-y-6">
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-300 uppercase tracking-wider border-b border-white/[0.06] pb-3">
            <Terminal className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-zinc-200">1. Adversary Identity & OpSec Footprint</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">
                Attacker Handle / Forum Alias
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 text-white font-mono text-sm focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setAlias("@Judge_Smith")}
                className="text-[11px] text-zinc-400 hover:text-red-300 font-mono mt-1.5 underline cursor-pointer transition-colors"
              >
                + Quick-fill: @Judge_Smith
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">
                Circadian Sleep Schedule (UTC Hours)
              </label>
              <div className="space-y-2">
                {SLEEP_PRESETS.map((p, idx) => {
                  const isSelected = sleepPreset === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSleepPreset(idx)}
                      className={`w-full text-left text-xs px-3.5 py-2.5 font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-red-500/[0.08] backdrop-blur-md border border-red-500/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.12)] rounded-xl"
                          : "bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-zinc-200 rounded-xl"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-2">
              Intercepted Boast / Leak Payload
            </label>
            <textarea
              rows={2}
              value={boastMsg}
              onChange={(e) => setBoastMsg(e.target.value)}
              className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 text-white font-mono text-sm focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all outline-none resize-none"
            />
          </div>
        </div>

        {/* SECTION 2 & 3: EXPLOIT & MIXER TOPOLOGY (LIQUID GLASS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 2: Smart Contract Breach */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-slate-900/30 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden space-y-5">
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-300 uppercase tracking-wider border-b border-white/[0.06] pb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-zinc-200">2. Smart Contract Breach</span>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">
                Vulnerability Target
              </label>
              <select
                value={exploitType}
                onChange={(e) => setExploitType(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 text-xs text-white font-mono focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all outline-none cursor-pointer"
              >
                {EXPLOIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0e1017] text-zinc-200">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">
                Capital Drained (USD)
              </label>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(Number(e.target.value))}
                className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 text-white font-mono text-sm focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all outline-none"
              />
              <div className="flex gap-2 mt-2.5 font-mono text-xs">
                {[10000000, 42000000, 100000000].map((amt) => {
                  const isSelected = amountUsd === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountUsd(amt)}
                      className={`px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-red-500/[0.08] backdrop-blur-md border border-red-500/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.12)] rounded-xl"
                          : "bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-zinc-200 rounded-xl"
                      }`}
                    >
                      ${amt / 1000000}M
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Laundering & Mixer Route */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-slate-900/30 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden space-y-5">
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-300 uppercase tracking-wider border-b border-white/[0.06] pb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-zinc-200">3. Laundering & Mixer Route</span>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">
                Obfuscation Protocol
              </label>
              <div className="space-y-2">
                {MIXER_ROUTES.map((route) => {
                  const isSelected = mixerRoute === route;
                  return (
                    <button
                      key={route}
                      type="button"
                      onClick={() => setMixerRoute(route)}
                      className={`w-full text-left text-xs px-3.5 py-2.5 font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-red-500/[0.08] backdrop-blur-md border border-red-500/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.12)] rounded-xl"
                          : "bg-white/[0.02] backdrop-blur-md border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-zinc-200 rounded-xl"
                      }`}
                    >
                      {route}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>Peel-Chain Fracture Depth</span>
                <span className="text-red-300 font-bold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                  {fractureDepth} Wallets
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={fractureDepth}
                onChange={(e) => setFractureDepth(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
              />
            </div>
          </div>

        </div>

        {/* SECTION 4: THE EXECUTION TRIGGER */}
        <div className="pt-2">
          {status === "breached" ? (
            <div className="relative rounded-3xl p-6 md:p-8 bg-slate-900/40 backdrop-blur-2xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-4 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              <div className="inline-flex items-center gap-2 text-red-400 font-mono text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-red-500" /> BREACH CONFIRMED: ${amountUsd.toLocaleString()} DRAINED
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Funds fractured into {fractureDepth} burner wallets. Attack injected into OSINT feeds and on-chain ledger.
              </p>
              <div className="pt-2">
                <a
                  href="/?breach=true"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl text-sm transition shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  Inspect Live Countermeasures in War Room <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={status === "broadcasting"}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono text-sm font-bold tracking-wider uppercase shadow-[0_0_35px_rgba(239,68,68,0.35)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {status === "broadcasting" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> BROADCASTING EXPLOIT TX TO MEMPOOL...
                </>
              ) : (
                <>🚨 EXECUTE SMART CONTRACT EXPLOIT</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
