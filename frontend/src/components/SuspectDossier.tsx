import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Shield, MapPin, Clock, Fingerprint, ExternalLink } from "lucide-react";
import type { SuspectLeaderboardItem } from "../services/api";

interface HourlyBin {
  hour: number;
  suspect_posts: number;
  wallet_txs: number;
}

interface SuspectDossierProps {
  suspects: SuspectLeaderboardItem[];
}

export function SuspectDossier({ suspects }: SuspectDossierProps) {

  // Top suspect from leaderboard (index 0)
  const topSuspect = suspects[0];

  const suspectAlias = topSuspect?.suspect_alias || "Aleksei Voronin";
  const suspectShortId = topSuspect?.suspect_alias?.match(/\((.*)\)/)?.[1] || "@0x_Alek";
  const guiltScore = topSuspect?.guilt_score_percentage ?? 94.8;
  const hourlyBins: HourlyBin[] = topSuspect?.matched_bedtime_chart ?? [];
  const evidenceLog = topSuspect?.evidence_log ?? [];

  const sleepWindow = topSuspect?.matched_bedtime_chart?.filter((b) => b.suspect_posts === 0 && b.wallet_txs === 0);
  const sleepStart = sleepWindow?.[0]?.hour;
  const sleepEnd = sleepWindow?.[sleepWindow.length - 1]?.hour;

  const [hoveredHour, setHoveredHour] = useState<HourlyBin | null>(null);

  return (
    <div className="flex flex-col h-full justify-between font-sans text-xs select-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2 mb-2 font-sans">
        <span className="text-zinc-100 font-semibold text-xs tracking-tight flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-zinc-400" /> Target Attribution & Circadian Analysis
        </span>
        <span className="text-[11px] text-zinc-400 font-medium">Confidence: High</span>
      </div>

      {/* Main Dossier Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* Suspect Target Card */}
        <div className="bg-[#14161f] border border-zinc-800/80 rounded-lg p-3.5 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <span className="text-[11px] text-zinc-400 font-medium block">
                Primary Operator Identified
              </span>
              <h2 className="text-base font-bold text-zinc-100 mt-0.5 tracking-tight font-sans">
                {suspectAlias}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-sans">
                <span className="text-zinc-300 font-mono font-medium">{suspectShortId}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <MapPin className="w-3 h-3" /> {sleepStart != null && sleepEnd != null
                    ? `${sleepStart}:00 - ${sleepEnd}:00 Sleep Cycle`
                    : "Moscow, UTC+3"
                  }
                </span>
              </div>
            </div>

            {/* Guilt Score Index - Bone White Institutional Badge */}
            <div className="text-right bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-md">
              <span className="text-[10px] text-zinc-400 font-medium block font-sans">
                Guilt Index
              </span>
              <span className="text-lg font-bold text-zinc-100 font-sans tracking-tight">
                <NumberFlow value={guiltScore} locales="en-US" />%
              </span>
            </div>
          </div>

          {/* Target Attributes Table */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2.5 border-t border-zinc-800/80 text-zinc-300 font-sans">
            <div>
              <span className="text-zinc-400 block text-[10px]">Solidity Compiler:</span>
              <span className="font-mono text-zinc-200 text-[10px]">0.8.20+commit.a1b7</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">Primary Bridge:</span>
              <span className="text-zinc-200">Railgun / Stargate</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">PGP Fingerprint:</span>
              <span className="font-mono text-zinc-200 text-[10px] truncate block">9B2A 74E1 81CD...</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">Temporal Latency:</span>
              <span className="text-zinc-200 font-mono text-[10px] font-medium">840ms correlation</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Circadian Dormancy Histogram (SVG Dual-Series) */}
        <div className="bg-[#14161f] border border-zinc-800/80 rounded-lg p-3.5 hover:border-zinc-700 transition-colors duration-200">
          <div className="flex justify-between items-center mb-1.5 font-sans">
            <span className="text-xs text-zinc-100 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" /> Circadian Dormancy Match
            </span>
            <div className="flex items-center gap-3 text-[10px] font-sans">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2 h-2 bg-zinc-500 inline-block rounded-xs" /> Forum Posts
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2 h-2 bg-amber-500/80 inline-block rounded-xs" /> On-Chain TXs
              </span>
            </div>
          </div>

          {/* Dormancy Window Banner - Warm Amber Tone */}
          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded px-2.5 py-1.5 mb-2 text-[11px] flex justify-between items-center text-zinc-300 font-sans">
            <span className="font-medium text-zinc-200">
              Dormancy Window {sleepStart != null && sleepEnd != null ? `(${sleepStart}:00 - ${sleepEnd}:00 UTC)` : "(04:00 - 11:00 UTC)"}
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono font-medium">Moscow UTC+3 Sync</span>
          </div>

          {/* SVG 24-Column Bar Chart */}
          <div className="relative h-24 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 80" preserveAspectRatio="none">
              <defs>
                <pattern id="crosshatch-dormancy" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
                </pattern>
              </defs>

              {/* Shaded Dormant Window */}
              {sleepStart != null && sleepEnd != null && (
                <>
                  <rect x={(sleepStart / 24) * 240} y="0" width={(((sleepEnd - sleepStart) / 24) * 240)} height="70" fill="url(#crosshatch-dormancy)" rx="2" />
                  <rect x={(sleepStart / 24) * 240} y="0" width={(((sleepEnd - sleepStart) / 24) * 240)} height="70" fill="#f59e0b" fillOpacity="0.03" />
                  <line x1={(sleepStart / 24) * 240} y1="0" x2={(sleepStart / 24) * 240} y2="70" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.35" />
                  <line x1={(sleepEnd / 24) * 240} y1="0" x2={(sleepEnd / 24) * 240} y2="70" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.35" />
                </>
              )}

              {/* Baseline */}
              <line x1="0" y1="70" x2="240" y2="70" stroke="#3f3f46" strokeWidth="1" />

              {/* 24 Columns from live hourly bins */}
              {hourlyBins.map((d) => {
                const colSpacing = 10;
                const x = d.hour * colSpacing + 1.5;

                const postHeight = (d.suspect_posts / 15) * 58;
                const txHeight = (d.wallet_txs / 18) * 60;

                const isDormant = d.suspect_posts === 0 && d.wallet_txs === 0;

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
                      fill={isDormant ? "#3f3f46" : "#71717a"}
                      rx="0.5"
                    />

                    {/* Blockchain transaction bar (warm amber) */}
                    <rect
                      x={x + 3.5}
                      y={70 - txHeight}
                      width="3"
                      height={txHeight}
                      fill={isDormant ? "#78350f" : "#d97706"}
                      rx="0.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hour Markers strictly in font-mono */}
            <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-1 px-0.5">
              <span>00:00</span>
              <span className="text-amber-400/90 font-medium">{sleepStart != null ? `${String(sleepStart).padStart(2, "0")}:00 (Sleep)` : "04:00 (Sleep)"}</span>
              <span className="text-amber-400/90 font-medium">{sleepEnd != null ? `${String(sleepEnd).padStart(2, "0")}:00` : "11:00"}</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Interactive Hour Tooltip */}
          {hoveredHour && (
            <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] flex justify-between text-zinc-300 font-sans">
              <span className="font-semibold text-zinc-200">{hoveredHour.hour.toString().padStart(2, "0")}:00 UTC:</span>
              <span>Posts: <strong className="text-zinc-100 font-mono">{hoveredHour.suspect_posts}</strong></span>
              <span>On-Chain TXs: <strong className="text-amber-400 font-mono">{hoveredHour.wallet_txs}</strong></span>
            </div>
          )}
        </div>

        {/* Forensic Evidence Logs with Clean Neutral Bullet Points */}
        <div className="bg-[#14161f] border border-zinc-800/80 rounded-lg p-3.5 space-y-2 hover:border-zinc-700 transition-colors duration-200 font-sans">
          <span className="text-xs text-zinc-100 font-semibold flex items-center gap-1.5 mb-1">
            <Fingerprint className="w-3.5 h-3.5 text-zinc-400" /> Correlated Proof Vectors
          </span>
          <ul className="space-y-2 text-[11px] text-zinc-300 leading-relaxed font-sans">
            {evidenceLog.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5 mt-2 flex justify-between items-center font-sans">
        <span>Attribution Status</span>
        <span className="text-amber-400/90 font-medium flex items-center gap-1">
          Target Flagged · Under Sanctions Review <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
