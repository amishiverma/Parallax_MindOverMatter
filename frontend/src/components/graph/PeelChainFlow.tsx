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
  isCashout: boolean;
  mixerType?: string;
  timestamp: string;
  parentId: string | null;
  x: number;
  y: number;
}

const RAW_NODES: RawNodeDef[] = [
  // Hop 0: Leftmost Genesis Exploit
  {
    id: "0x7a1b...4e92",
    label: "Genesis Exploit Vault",
    walletId: "0x7a1b...4e92",
    amount: 42000000,
    hop: 0,
    isCashout: false,
    timestamp: "02:14:02 UTC",
    parentId: null,
    x: 40,
    y: 200,
  },
  // Hop 1: Three Intermediate Branches
  {
    id: "0x89f2...aa10",
    label: "Bridge Relay Alpha",
    walletId: "0x89f2...aa10",
    amount: 14200000,
    hop: 1,
    isCashout: false,
    timestamp: "02:15:33 UTC",
    parentId: "0x7a1b...4e92",
    x: 340,
    y: 70,
  },
  {
    id: "0x33b1...cc84",
    label: "Split Liquidity Pool Beta",
    walletId: "0x33b1...cc84",
    amount: 18500000,
    hop: 1,
    isCashout: false,
    timestamp: "02:16:11 UTC",
    parentId: "0x7a1b...4e92",
    x: 340,
    y: 200,
  },
  {
    id: "0x44d2...771e",
    label: "Hotfix Bypass Route",
    walletId: "0x44d2...771e",
    amount: 9300000,
    hop: 1,
    isCashout: false,
    timestamp: "02:16:48 UTC",
    parentId: "0x7a1b...4e92",
    x: 340,
    y: 330,
  },
  // Hop 2: Four Terminating Nodes / OTC Cashout Doors
  {
    id: "0x91d4...01ff",
    label: "Mixer Sub-Wallet C1",
    walletId: "0x91d4...01ff",
    amount: 9300000,
    hop: 2,
    isCashout: false,
    mixerType: "Tornado Cash Pool",
    timestamp: "02:17:15 UTC",
    parentId: "0x89f2...aa10",
    x: 640,
    y: 30,
  },
  {
    id: "0x66f0...99bb",
    label: "Bitzlato OTC Desk",
    walletId: "0x66f0...99bb",
    amount: 4900000,
    hop: 2,
    isCashout: true,
    mixerType: "Telegram OTC Broker",
    timestamp: "02:18:02 UTC",
    parentId: "0x89f2...aa10",
    x: 640,
    y: 140,
  },
  {
    id: "0x55c3...11ea",
    label: "Privacy Pool Hop D2",
    walletId: "0x55c3...11ea",
    amount: 9250000,
    hop: 2,
    isCashout: false,
    mixerType: "Railgun Shielded Pool",
    timestamp: "02:18:40 UTC",
    parentId: "0x33b1...cc84",
    x: 640,
    y: 260,
  },
  {
    id: "0x12a8...4409",
    label: "P2P Settlement Door",
    walletId: "0x12a8...4409",
    amount: 9250000,
    hop: 2,
    isCashout: true,
    mixerType: "P2P OTC Liquidity",
    timestamp: "02:22:05 UTC",
    parentId: "0x33b1...cc84",
    x: 640,
    y: 370,
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
        isCashout: n.isCashout,
        mixerType: n.mixerType,
        timestamp: n.timestamp,
        isSelected: activeWalletId === n.id,
        isInActivePath: activeBranch.branchNodes.has(n.id),
      },
    }));
  }, [activeWalletId, activeBranch]);

  // Construct React Flow Edges
  const edges: Edge[] = useMemo(() => {
    return RAW_NODES.filter((n) => n.parentId).map((n) => {
      const edgeKey = `${n.parentId}->${n.id}`;
      const isActive = activeBranch.branchEdges.has(edgeKey);

      return {
        id: edgeKey,
        source: n.parentId as string,
        target: n.id,
        type: "smoothstep",
        animated: isActive,
        style: {
          stroke: isActive ? "#dc2626" : "#334155",
          strokeWidth: isActive ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? "#dc2626" : "#475569",
          width: 14,
          height: 14,
        },
      };
    });
  }, [activeBranch]);

  return (
    <div className="flex flex-col h-full justify-between select-none font-sans">
      {/* Topology Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-semibold text-xs tracking-tight">
            Peel-Chain Topology
          </span>
          <span className="text-[11px] text-slate-500">
            Directed Acyclic Graph · 3 Hops · 38 Micro-Splits
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Intermediary Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> OTC Gateway
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> Active Trace
          </span>
        </div>
      </div>

      {/* React Flow Graph Surface */}
      <div className="relative flex-1 bg-[#0d0e12] border border-slate-800/80 rounded-lg overflow-hidden min-h-[380px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => onSelectWallet(node.id)}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.5}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#1e2230" gap={20} size={1} />
          <Controls position="top-right" showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Exploit Replay Controller */}
      <div className="border border-slate-800/80 bg-[#14161f] rounded-lg p-2.5 mt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition text-xs font-medium cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-slate-300" />
            )}
            {isPlaying ? "Pause Replay" : "Replay Exploit"}
          </button>
          <button
            onClick={() => setReplayOffset(0)}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Reset Scrubber"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Step {Math.floor(replayOffset / 60)} of 10
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
            className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-red-600"
          />
          <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap text-right">
            {formatReplayTime(replayOffset)}
          </span>
        </div>
      </div>
    </div>
  );
}
