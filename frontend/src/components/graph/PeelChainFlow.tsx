import { useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import { WalletNode } from "./WalletNode";
import { Play, Pause, RotateCcw } from "lucide-react";

const nodeTypes = {
  walletNode: WalletNode,
};

interface PeelChainFlowProps {
  activeWalletId: string;
  onSelectWallet: (walletId: string) => void;
}

interface RawNodeDef {
  id: string;
  label: string;
  walletId: string;
  amount: number;
  hop: number;
  stage: string;
  isCashout: boolean;
  parentId: string | null;
  x: number;
  y: number;
}

const RAW_NODES: RawNodeDef[] = [
  // Stage 1 (Left): Genesis Exploit Vault ($42M)
  {
    id: "0x7a1b...4e92",
    label: "Genesis Exploit Vault",
    walletId: "0x7a1b...4e92",
    amount: 42000000,
    hop: 0,
    stage: "Genesis Root",
    isCashout: false,
    parentId: null,
    x: 30,
    y: 160,
  },
  // Stage 2 (Center): 3 Hop 1 Split Nodes
  {
    id: "0x89f2...aa10",
    label: "Bridge Relay Alpha",
    walletId: "0x89f2...aa10",
    amount: 14200000,
    hop: 1,
    stage: "Hop 1",
    isCashout: false,
    parentId: "0x7a1b...4e92",
    x: 330,
    y: 40,
  },
  {
    id: "0x33b1...cc84",
    label: "Split Liquidity Pool",
    walletId: "0x33b1...cc84",
    amount: 18500000,
    hop: 1,
    stage: "Hop 1",
    isCashout: false,
    parentId: "0x7a1b...4e92",
    x: 330,
    y: 160,
  },
  {
    id: "0x44d2...771e",
    label: "Hotfix Bypass Route",
    walletId: "0x44d2...771e",
    amount: 9300000,
    hop: 1,
    stage: "Hop 1",
    isCashout: false,
    parentId: "0x7a1b...4e92",
    x: 330,
    y: 280,
  },
  // Stage 3 (Right): 3 Hop 2 Off-Ramp Nodes
  {
    id: "0x91d4...01ff",
    label: "Mixer Sub-Wallet C1",
    walletId: "0x91d4...01ff",
    amount: 9300000,
    hop: 2,
    stage: "Hop 2",
    isCashout: false,
    parentId: "0x89f2...aa10",
    x: 630,
    y: 40,
  },
  {
    id: "0x66f0...99bb",
    label: "Bitzlato OTC Gateway",
    walletId: "0x66f0...99bb",
    amount: 4900000,
    hop: 2,
    stage: "Hop 2",
    isCashout: true,
    parentId: "0x89f2...aa10",
    x: 630,
    y: 160,
  },
  {
    id: "0x12a8...4409",
    label: "P2P Settlement Door",
    walletId: "0x12a8...4409",
    amount: 9250000,
    hop: 2,
    stage: "Hop 2",
    isCashout: true,
    parentId: "0x33b1...cc84",
    x: 630,
    y: 280,
  },
];

export function PeelChainFlow({ activeWalletId, onSelectWallet }: PeelChainFlowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayOffset, setReplayOffset] = useState(192);

  // Exploit Replay Scrubber
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setReplayOffset((prev: number) => (prev >= 600 ? 0 : prev + 2));
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatReplayTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `+${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s (02:17:${s
      .toString()
      .padStart(2, "0")} UTC)`;
  };

  // Find active node path to Genesis Root
  const activeBranch = useMemo(() => {
    const branchNodes = new Set<string>();
    const branchEdges = new Set<string>();

    let current = RAW_NODES.find((n) => n.id === activeWalletId);
    while (current) {
      branchNodes.add(current.id);
      if (current.parentId) {
        branchEdges.add(`${current.parentId}->${current.id}`);
      }
      current = RAW_NODES.find((n) => n.id === current?.parentId);
    }

    return { branchNodes, branchEdges };
  }, [activeWalletId]);

  // Construct React Flow Nodes
  const nodes: Node[] = useMemo(() => {
    return RAW_NODES.map((n) => ({
      id: n.id,
      type: "walletNode",
      position: { x: n.x, y: n.y },
      data: {
        label: n.label,
        walletId: n.walletId,
        amount: n.amount,
        hop: n.hop,
        stage: n.stage,
        isCashout: n.isCashout,
        isSelected: activeWalletId === n.id,
        isInActivePath: activeBranch.branchNodes.has(n.id),
      },
    }));
  }, [activeWalletId, activeBranch]);

  // Construct React Flow Edges with smooth SVG bezier curves and animated amber running arrows
  const edges: Edge[] = useMemo(() => {
    return RAW_NODES.filter((n) => n.parentId).map((n) => {
      const edgeKey = `${n.parentId}->${n.id}`;
      const isActive = activeBranch.branchEdges.has(edgeKey);

      return {
        id: edgeKey,
        source: n.parentId as string,
        target: n.id,
        type: "default",
        animated: isActive,
        style: {
          stroke: isActive ? "#f59e0b" : "#334155",
          strokeWidth: isActive ? 2 : 1.5,
          strokeDasharray: isActive ? "6,4" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? "#f59e0b" : "#475569",
          width: isActive ? 14 : 12,
          height: isActive ? 14 : 12,
        },
      };
    });
  }, [activeBranch]);

  return (
    <div className="flex flex-col h-full justify-between select-none font-sans">
      {/* Topology Header & Clean Legend */}
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2 mb-2 font-sans">
        <div className="flex items-center gap-2">
          <span className="text-zinc-100 font-semibold text-xs tracking-tight">
            Peel-Chain Topology
          </span>
          <span className="text-[11px] text-zinc-400">
            · 3 Hops (38 Splits)
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-[11px] text-zinc-400 font-sans">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-zinc-500 inline-block" /> Intermediary Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_rgba(245,158,11,0.6)]" /> OTC Gateway (Amber)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 inline-block" /> Active Path
          </span>
        </div>
      </div>

      {/* React Flow Graph Surface */}
      <div className="relative flex-1 bg-[#0d0e12] border border-zinc-800/80 rounded-lg overflow-hidden min-h-[380px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => onSelectWallet(node.id)}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.5}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: "default" }}
        >
          <Background color="#1e2230" gap={20} size={1} />
          <Controls position="top-right" showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Exploit Replay Controller */}
      <div className="border border-zinc-800/80 bg-[#14161f] rounded-lg p-2.5 mt-2 flex flex-col sm:flex-row justify-between items-center gap-3 font-sans">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition text-xs font-medium cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-zinc-300" />
            )}
            {isPlaying ? "Pause Replay" : "Replay Exploit"}
          </button>
          <button
            onClick={() => setReplayOffset(0)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="Reset Scrubber"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Step {Math.floor(replayOffset / 60)} of 10
          </span>
        </div>

        {/* Scrub Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-sm font-sans">
          <input
            type="range"
            min="0"
            max="600"
            value={replayOffset}
            onChange={(e) => setReplayOffset(Number(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-amber-500"
          />
          <span className="font-mono text-[11px] text-zinc-400 whitespace-nowrap text-right">
            {formatReplayTime(replayOffset)}
          </span>
        </div>
      </div>
    </div>
  );
}
