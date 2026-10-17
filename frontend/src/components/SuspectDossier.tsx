import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Shield, MapPin, Clock, Fingerprint, ExternalLink } from "lucide-react";

interface SleepHourData {
  hour: number;
  posts: number;
  txs: number;
}

// 24-hour cycle where 04:00 - 11:00 UTC is zero activity (Moscow 07:00 - 14:00 sleep cycle)
const HOURLY_METRICS: SleepHourData[] = Array.from({ length: 24 }, (_, hour) => {
  const isDormant = hour >= 4 && hour <= 10;
  return {
    hour,
    posts: isDormant ? 0 : Math.floor(Math.sin((hour + 2) / 3) * 5 + 6),
    txs: isDormant ? 0 : Math.floor(Math.cos((hour - 1) / 3.5) * 7 + 8),
  };
});

export function SuspectDossier() {
  const [hoveredHour, setHoveredHour] = useState<SleepHourData | null>(null);

  return (
    <div className="flex flex-col h-full justify-between font-sans text-xs select-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
        <span className="text-slate-200 font-semibold text-xs tracking-tight flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" /> Target Attribution & Circadian Analysis
        </span>
        <span className="text-[11px] text-slate-400 font-medium">Confidence: High</span>
      </div>

      {/* Main Dossier Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* Suspect Target Card */}
        <div className="bg-[#14161f] border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Primary Operator Identified
              </span>
              <h2 className="text-base font-bold text-slate-100 mt-0.5 tracking-tight font-sans">
                Aleksei Voronin
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-sans">
                <span className="text-red-400 font-medium">@0x_Alek</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3" /> Moscow, UTC+3
                </span>
              </div>
            </div>

            {/* Guilt Score Index */}
            <div className="text-right bg-[#1b1e2a] border border-red-900/60 px-2.5 py-1.5 rounded">
              <span className="text-[10px] text-slate-400 font-medium block">
                Guilt Index
              </span>
              <span className="text-lg font-bold text-red-500 font-sans">
                <NumberFlow value={94.8} locales="en-US" />%
              </span>
            </div>
          </div>

          {/* Target Attributes Table */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2.5 border-t border-slate-800/80 text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px]">Solidity Compiler:</span>
              <span className="font-mono text-slate-200 text-[10px]">0.8.20+commit.a1b7</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Primary Bridge:</span>
              <span className="text-slate-200">Railgun / Stargate</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PGP Fingerprint:</span>
              <span className="font-mono text-slate-200 text-[10px] truncate block">9B2A 74E1 81CD...</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Temporal Latency:</span>
              <span className="text-red-400 font-medium">840ms correlation</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Circadian Dormancy Histogram (SVG Dual-Series) */}
        <div className="bg-[#14161f] border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Circadian Dormancy Match
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 bg-slate-500 inline-block rounded-xs" /> Forum Posts
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 bg-red-600 inline-block rounded-xs" /> On-Chain TXs
              </span>
            </div>
          </div>

          {/* Dormancy Window Banner */}
          <div className="bg-red-950/20 border border-red-900/40 rounded px-2.5 py-1.5 mb-2 text-[11px] flex justify-between items-center text-red-400">
            <span className="font-medium">Dormancy Window (UTC+3 Moscow Sync)</span>
            <span className="text-[10px] text-slate-400 font-mono">04:00 - 11:00 UTC</span>
          </div>

          {/* SVG 24-Column Bar Chart */}
          <div className="relative h-24 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 80" preserveAspectRatio="none">
              <defs>
                <pattern id="crosshatch-dormancy" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="1.2" opacity="0.3" />
                </pattern>
              </defs>

              {/* Shaded Dormant Window: Hours 4 through 10 -> (4/24 * 240) = 40 to (11/24 * 240) = 110 */}
              <rect x="40" y="0" width="70" height="70" fill="url(#crosshatch-dormancy)" rx="2" />
              <rect x="40" y="0" width="70" height="70" fill="#ef4444" fillOpacity="0.04" />
              <line x1="40" y1="0" x2="40" y2="70" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
              <line x1="110" y1="0" x2="110" y2="70" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />

              {/* Baseline */}
              <line x1="0" y1="70" x2="240" y2="70" stroke="#334155" strokeWidth="1" />

              {/* 24 Columns */}
              {HOURLY_METRICS.map((d) => {
                const colSpacing = 10;
                const x = d.hour * colSpacing + 1.5;

                const postHeight = (d.posts / 15) * 58;
                const txHeight = (d.txs / 18) * 60;

                const isDormant = d.hour >= 4 && d.hour <= 10;

                return (
                  <g
                    key={d.hour}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredHour(d)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Hover hit target */}
                    <rect x={x - 1.5} y="0" width="10" height="75" fill="transparent" />

                    {/* Suspect forum post bar (muted slate) */}
                    <rect
                      x={x}
                      y={70 - postHeight}
                      width="3"
                      height={postHeight}
                      fill={isDormant ? "#475569" : "#64748b"}
                      rx="0.5"
                    />

                    {/* Blockchain transaction bar (crimson) */}
                    <rect
                      x={x + 3.5}
                      y={70 - txHeight}
                      width="3"
                      height={txHeight}
                      fill={isDormant ? "#7f1d1d" : "#dc2626"}
                      rx="0.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hour Markers strictly in font-mono */}
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 px-0.5">
              <span>00:00</span>
              <span className="text-red-400 font-medium">04:00 (Sleep)</span>
              <span className="text-red-400 font-medium">11:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Interactive Hour Tooltip */}
          {hoveredHour && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-300 font-sans">
              <span className="font-semibold text-slate-200">{hoveredHour.hour.toString().padStart(2, "0")}:00 UTC:</span>
              <span>Posts: <strong className="text-slate-100">{hoveredHour.posts}</strong></span>
              <span>On-Chain TXs: <strong className="text-red-400">{hoveredHour.txs}</strong></span>
            </div>
          )}
        </div>

        {/* Forensic Evidence Logs with Clean Bullet Points */}
        <div className="bg-[#14161f] border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5 mb-1">
            <Fingerprint className="w-3.5 h-3.5 text-red-500" /> Correlated Proof Vectors
          </span>
          <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>
                <strong>Temporal Delta:</strong> 840ms latency match between Telegram exploit announcement and genesis transaction block timestamp.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>
                <strong>Circadian Silence:</strong> Zero recorded blockchain transactions or developer forum activity between 04:00 and 11:00 UTC (100% dormancy sync with Moscow local timezone).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>
                <strong>Compiler Fingerprint:</strong> Solidity v0.8.20 compiler optimization flags identical to 0x_Alek testnet contract deployer.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>
                <strong>Mixer Settlement:</strong> Railgun shielding pool cashout traced directly to Bitzlato OTC broker desk.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 mt-2 flex justify-between items-center font-sans">
        <span>Attribution Status</span>
        <span className="text-red-400 font-semibold flex items-center gap-1">
          Target Flagged for Freezing <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
