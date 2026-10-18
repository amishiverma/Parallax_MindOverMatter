import { useState } from "react";
import { Terminal, Skull, ShieldAlert, Cpu, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

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

import { BASE_URL } from "../services/api";

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
      peel_chain_depth: fractureDepth,
    };

    try {
      await fetch(`${BASE_URL}/api/v1/attack/launch`, {
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
    <div className="min-h-screen bg-[#07080b] text-zinc-300 font-sans p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-red-950/60 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-center">
              <Skull className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                EXPLOIT INJECTION CONSOLE <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded font-mono">BLACK-HAT SIMULATOR</span>
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">Target: Gravitas Vault Contract (Mainnet Ethereum)</p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 rounded transition"
          >
            ← Exit to Main App
          </a>
        </div>

        {/* SECTION 1: IDENTITY & OPSEC PROFILE */}
        <div className="bg-[#0e1017] border border-zinc-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 pb-2">
            <Terminal className="w-4 h-4 text-red-400" /> 1. Adversary Identity & OpSec Footprint
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">Attacker Handle / Forum Alias</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-[#08090d] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setAlias("@Judge_Smith")}
                className="text-[11px] text-zinc-500 hover:text-red-400 font-mono mt-1 underline cursor-pointer"
              >
                + Quick-fill: @Judge_Smith
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">Circadian Sleep Schedule (UTC Hours)</label>
              <div className="space-y-1.5">
                {SLEEP_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSleepPreset(idx)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border font-mono transition cursor-pointer ${
                      sleepPreset === idx
                        ? "bg-red-950/30 border-red-600/70 text-red-200"
                        : "bg-[#08090d] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5">Intercepted Boast / Leak Payload</label>
            <textarea
              rows={2}
              value={boastMsg}
              onChange={(e) => setBoastMsg(e.target.value)}
              className="w-full bg-[#08090d] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 font-mono focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 2 & 3: EXPLOIT & MIXER TOPOLOGY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Exploit Vector */}
          <div className="bg-[#0e1017] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> 2. Smart Contract Breach
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">Vulnerability Target</label>
              <select
                value={exploitType}
                onChange={(e) => setExploitType(e.target.value)}
                className="w-full bg-[#08090d] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
              >
                {EXPLOIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">Capital Drained (USD)</label>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(Number(e.target.value))}
                className="w-full bg-[#08090d] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-2 mt-2 font-mono text-xs">
                {[10000000, 42000000, 100000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountUsd(amt)}
                    className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ${amt / 1000000}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Laundering Strategy */}
          <div className="bg-[#0e1017] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 pb-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> 3. Laundering & Mixer Route
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">Obfuscation Protocol</label>
              <div className="space-y-1.5">
                {MIXER_ROUTES.map((route) => (
                  <button
                    key={route}
                    type="button"
                    onClick={() => setMixerRoute(route)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border font-mono transition cursor-pointer ${
                      mixerRoute === route
                        ? "bg-cyan-950/20 border-cyan-600/60 text-cyan-200"
                        : "bg-[#08090d] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {route}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                <span>Peel-Chain Fracture Depth</span>
                <span className="text-white font-bold">{fractureDepth} Wallets</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={fractureDepth}
                onChange={(e) => setFractureDepth(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* SECTION 4: THE EXECUTION TRIGGER */}
        <div className="pt-4">
          {status === "breached" ? (
            <div className="bg-red-950/30 border border-red-700/60 rounded-2xl p-6 text-center space-y-3 animate-pulse">
              <div className="inline-flex items-center gap-2 text-red-400 font-mono text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-red-500 animate-bounce" /> Exploit broadcasted. Telemetry live.
              </div>
              <p className="text-xs text-zinc-300 font-mono max-w-md mx-auto">
                BREACH CONFIRMED // ${amountUsd.toLocaleString()} DRAINED BY {alias}
              </p>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                Funds fractured into {fractureDepth} burner wallets. Injected into OSINT feeds and on-chain ledger.
              </p>
              <div className="pt-2">
                <a
                  href="/?breach=true"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  Inspect Live Countermeasures in War Room <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={status === "broadcasting"}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono text-sm font-bold tracking-wider uppercase shadow-[0_0_35px_rgba(239,68,68,0.45)] hover:shadow-[0_0_50px_rgba(239,68,68,0.7)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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
