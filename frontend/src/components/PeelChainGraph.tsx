import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, ShieldAlert } from "lucide-react";

export interface GraphNode {
  id: string;
  label: string;
  amount: number;
  hop: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  parentId: string | null;
  isCashout: boolean;
  mixerType?: string;
  txHash: string;
  timestamp: string;
}

const NODES: GraphNode[] = [
  // Hop 0: Root Exploit
  {
    id: "0x7a1b...4e92",
    label: "ROOT EXPLOIT",
    amount: 42000000,
    hop: 0,
    x: 8,
    y: 50,
    parentId: null,
    isCashout: false,
    txHash: "0x9ef2...14a0",
    timestamp: "02:14:02 UTC",
  },
  // Hop 1: 3 Child Branches
  {
    id: "0x89f2...aa10",
    label: "BRIDGE RELAY A",
    amount: 14200000,
    hop: 1,
    x: 38,
    y: 22,
    parentId: "0x7a1b...4e92",
    isCashout: false,
    txHash: "0x3ab1...88c4",
    timestamp: "02:15:33 UTC",
  },
  {
    id: "0x33b1...cc84",
    label: "SPLIT POOL B",
    amount: 18500000,
    hop: 1,
    x: 38,
    y: 50,
    parentId: "0x7a1b...4e92",
    isCashout: false,
    txHash: "0x71d0...04ee",
    timestamp: "02:16:11 UTC",
  },
  {
    id: "0x44d2...771e",
    label: "UNCHECKED HOTFIX",
    amount: 9300000,
    hop: 1,
    x: 38,
    y: 78,
    parentId: "0x7a1b...4e92",
    isCashout: false,
    txHash: "0x129a...bb60",
    timestamp: "02:16:48 UTC",
  },
  // Hop 2: 4 Sub-wallets / Cashout Terminations
  {
    id: "0x91d4...01ff",
    label: "FRACTURE C-1",
    amount: 9300000,
    hop: 2,
    x: 75,
    y: 16,
    parentId: "0x89f2...aa10",
    isCashout: false,
    mixerType: "Tornado Cash (100 ETH)",
    txHash: "0xbb45...9912",
    timestamp: "02:17:15 UTC",
  },
  {
    id: "0x66f0...99bb",
    label: "OTC CASHOUT GATE",
    amount: 4900000,
    hop: 2,
    x: 75,
    y: 38,
    parentId: "0x89f2...aa10",
    isCashout: true,
    mixerType: "Bitzlato OTC Desk",
    txHash: "0x66cc...aa01",
    timestamp: "02:18:02 UTC",
  },
  {
    id: "0x55c3...11ea",
    label: "MIXER HOP D-2",
    amount: 9250000,
    hop: 2,
    x: 75,
    y: 62,
    parentId: "0x33b1...cc84",
    isCashout: false,
    mixerType: "Railgun Privacy Pool",
    txHash: "0x9921...33d8",
    timestamp: "02:18:40 UTC",
  },
  {
    id: "0x12a8...4409",
    label: "RAILGUN CASHOUT",
    amount: 9250000,
    hop: 2,
    x: 75,
    y: 84,
    parentId: "0x33b1...cc84",
    isCashout: true,
    mixerType: "P2P Liquidity Exit",
    txHash: "0x44aa...ef19",
    timestamp: "02:22:05 UTC",
  },
];

interface PeelChainGraphProps {
  activeWalletId: string | null;
  onSelectWallet: (walletId: string) => void;
}

export function PeelChainGraph({ activeWalletId, onSelectWallet }: PeelChainGraphProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayOffset, setReplayOffset] = useState(192); // seconds offset
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Play simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setReplayOffset((prev: number) => (prev >= 600 ? 0 : prev + 2));
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatReplayTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `+${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s (02:17:${s
      .toString()
      .padStart(2, "0")} UTC)`;
  };

  // Find active node path to Root for highlighted crimson route
  const getActiveBranchEdges = () => {
    if (!activeWalletId) return new Set<string>();
    const edges = new Set<string>();
    let current = NODES.find((n) => n.id === activeWalletId);
    while (current && current.parentId) {
      edges.add(`${current.parentId}->${current.id}`);
      current = NODES.find((n) => n.id === current?.parentId);
    }
    return edges;
  };

  const activeEdges = getActiveBranchEdges();

  return (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Topology Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
            2. Topological Peel-Chain Graph
          </span>
          <span className="text-[10px] text-zinc-600">/ 3 Hops · 38 Micro-Splits</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" /> Intermediate Node
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> OTC Cashout Gateway
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> Active Trace
          </span>
        </div>
      </div>

      {/* Main Interactive SVG Branching Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-[#090a0f] border border-zinc-800/80 rounded p-2 overflow-hidden min-h-[360px]"
      >
        {/* Subtle Chainalysis Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#52525b 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* SVG Bezier Branching Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="crimson-graph-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {NODES.filter((n) => n.parentId).map((node) => {
            const parent = NODES.find((p) => p.id === node.parentId);
            if (!parent) return null;

            const isEdgeActive = activeEdges.has(`${parent.id}->${node.id}`);

            const x1 = parent.x;
            const y1 = parent.y;
            const x2 = node.x;
            const y2 = node.y;
            const midX = (x1 + x2) / 2;

            return (
              <g key={`${parent.id}-${node.id}`}>
                {/* Background edge */}
                <path
                  d={`M ${x1}% ${y1}% C ${midX}% ${y1}%, ${midX}% ${y2}%, ${x2}% ${y2}%`}
                  fill="none"
                  stroke={isEdgeActive ? "#ef4444" : "#27272a"}
                  strokeWidth={isEdgeActive ? 2.5 : 1.5}
                  strokeDasharray={isEdgeActive ? "none" : "4 3"}
                  filter={isEdgeActive ? "url(#crimson-graph-glow)" : undefined}
                  className={isEdgeActive ? "transition-all" : ""}
                />

                {/* Animated pulse dot moving along active branch */}
                {isEdgeActive && (
                  <circle r="3" fill="#ef4444">
                    <animateMotion
                      path={`M ${x1 * 4} ${y1 * 3.6} C ${midX * 4} ${y1 * 3.6}, ${midX * 4} ${y2 * 3.6}, ${x2 * 4} ${y2 * 3.6}`}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Interactive Node Badges (HTML absolute positioned) */}
        {NODES.map((node) => {
          const isSelected = activeWalletId === node.id;
          const isInActivePath = activeEdges.has(`${node.parentId}->${node.id}`) || node.id === "0x7a1b...4e92";

          return (
            <div
              key={node.id}
              id={`node-${node.id}`}
              onClick={() => onSelectWallet(node.id)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute z-10 cursor-pointer transition-all duration-200 select-none ${
                node.hop === 0 ? "w-44" : "w-40"
              }`}
            >
              <div
                className={`p-2 rounded border font-mono text-[10px] shadow-lg backdrop-blur-md transition-all ${
                  isSelected
                    ? "bg-[#181a24] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] text-zinc-100 scale-105"
                    : node.isCashout
                    ? "bg-[#14120c] border-amber-600/80 hover:border-amber-400 text-zinc-300"
                    : isInActivePath
                    ? "bg-[#12141c] border-red-900/80 hover:border-red-600 text-zinc-300"
                    : "bg-[#0e1015]/90 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[8px] font-semibold px-1 rounded uppercase tracking-wider ${
                      node.hop === 0
                        ? "bg-red-950 text-red-400 border border-red-800"
                        : node.isCashout
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    Hop {node.hop}
                  </span>
                  <span className="text-[9px] text-zinc-500">{node.timestamp.slice(0, 5)}</span>
                </div>

                <div className="font-bold text-zinc-100 truncate text-[11px] mb-0.5">
                  {node.id}
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                  <span className="font-semibold text-zinc-200">
                    {formatCurrency(node.amount)}
                  </span>
                  {node.isCashout && (
                    <span className="text-[8px] text-amber-400 font-bold uppercase tracking-tighter">
                      OTC GATE
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Telemetry Hover Card */}
        {hoveredNode && (
          <div className="absolute top-3 right-3 bg-[#11131a] border border-zinc-700/80 rounded p-2.5 shadow-2xl font-mono text-[10px] w-56 z-20 pointer-events-none">
            <div className="text-zinc-500 text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" /> FORENSIC NODE TELEMETRY
            </div>
            <div className="text-zinc-200 font-bold text-xs truncate mb-1">
              {hoveredNode.id}
            </div>
            <div className="space-y-1 text-zinc-400 pt-1 border-t border-zinc-800">
              <div className="flex justify-between">
                <span>BALANCE:</span>
                <span className="text-zinc-200 font-semibold">{formatCurrency(hoveredNode.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>TX HASH:</span>
                <span className="text-zinc-300">{hoveredNode.txHash}</span>
              </div>
              {hoveredNode.mixerType && (
                <div className="flex justify-between">
                  <span>FACILITY:</span>
                  <span className="text-amber-400 font-medium">{hoveredNode.mixerType}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>STATUS:</span>
                <span className={hoveredNode.isCashout ? "text-amber-400" : "text-emerald-400"}>
                  {hoveredNode.isCashout ? "FLAGGED CASHOUT" : "ACTIVE HOP"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimalist Apple-Style Exploit Replay Scrubber (skiper3) */}
      <div className="border border-zinc-800 bg-[#0e1015] rounded p-2.5 mt-2 flex flex-col sm:flex-row justify-between items-center gap-2.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 rounded transition text-xs font-semibold cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-zinc-300" />
            )}
            {isPlaying ? "PAUSE REPLAY" : "REPLAY EXPLOIT"}
          </button>
          <button
            onClick={() => setReplayOffset(0)}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
            title="Reset Scrubber"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            | STEP {Math.floor(replayOffset / 60)} / 10
          </span>
        </div>

        {/* Scrub Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-sm">
          <input
            type="range"
            min="0"
            max="600"
            value={replayOffset}
            onChange={(e) => setReplayOffset(Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-red-600"
          />
          <span className="text-[11px] text-zinc-400 font-mono whitespace-nowrap text-right">
            {formatReplayTime(replayOffset)}
          </span>
        </div>
      </div>
    </div>
  );
}
