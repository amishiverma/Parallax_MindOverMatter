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

// Backend node shape (from /api/v1/blockchain/nodes endpoint)
interface BackendNode {
  wallet_id: string;
  amount: number;
  timestamp: string;
  hop_level: number;
  parent_wallet: string | null;
  is_cashout_door: boolean;
  label?: string;
  mixerType?: string;
  puppeteer_clusters?: string[];
}

interface PeelChainFlowProps {
  activeWalletId: string;
  onSelectWallet: (walletId: string) => void;
  nodes: BackendNode[];
  puppeteerClusters?: Record<string, string[]>;
}

// Convert a backend node into a positional node for the React Flow canvas
const buildPositionalNode = (backendNode: BackendNode, index: number) => {
  const hopLevel = backendNode.hop_level || 0;
  const x = hopLevel * 300 + 30; // Horizontal spacing per hop
  const y = (index % 4) * 140 + (hopLevel === 0 ? 190 : 30); // Stagger within hop level
  return {
    id: backendNode.wallet_id,
    label: backendNode.label || `Wallet ${backendNode.wallet_id.slice(0, 6)}`,
    walletId: backendNode.wallet_id,
    amount: backendNode.amount,
    hop: hopLevel,
    isCashout: backendNode.is_cashout_door || false,
    mixerType: backendNode.mixerType,
    timestamp: backendNode.timestamp,
    parentId: backendNode.parent_wallet || null,
    puppeteer_clusters: backendNode.puppeteer_clusters || [],
    x,
    y,
  };
};

const nodeTypes = {
  walletNode: WalletNode,
};

export function PeelChainFlow({ activeWalletId, onSelectWallet, nodes, puppeteerClusters }: PeelChainFlowProps) {
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

  // Compute positional nodes from backend data
  const positionalNodes = useMemo(() => {
    return nodes.map((n, idx) => buildPositionalNode(n, idx));
  }, [nodes]);

  // Find active node path to Genesis Root
  const activeBranch = useMemo(() => {
    const branchNodes = new Set<string>();
    const branchEdges = new Set<string>();

    const nodeMap = new Map(positionalNodes.map((n) => [n.id, n]));
    let current = nodeMap.get(activeWalletId);

    while (current) {
      branchNodes.add(current.id);
      if (current.parentId) {
        branchEdges.add(`${current.parentId}->${current.id}`);
      }
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }

    return { branchNodes, branchEdges };
  }, [activeWalletId, positionalNodes]);

  // Construct React Flow Nodes
  const rfNodes: Node[] = useMemo(() => {
    return positionalNodes.map((n) => ({
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
        puppeteer_clusters: n.puppeteer_clusters,
        isSelected: activeWalletId === n.id,
        isInActivePath: activeBranch.branchNodes.has(n.id),
      },
    }));
  }, [activeWalletId, activeBranch, positionalNodes]);

  // Construct React Flow Edges from parent_wallet relationships
  const edges: Edge[] = useMemo(() => {
    return positionalNodes
      .filter((n) => n.parentId)
      .map((n) => {
        const edgeKey = `${n.parentId}->${n.id}`;
        const isActive = activeBranch.branchEdges.has(edgeKey);

        return {
          id: edgeKey,
          source: n.parentId as string,
          target: n.id,
          type: "default",
          animated: isActive,
          style: {
            stroke: isActive ? "#f59e0b" : "#475569",
            strokeWidth: isActive ? 2 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? "#f59e0b" : "#475569",
            width: 12,
            height: 12,
          },
        };
      });
  }, [activeBranch, positionalNodes]);

  return (
    <div className="flex flex-col h-full justify-between select-none font-sans">
      {/* Topology Header */}
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2 mb-2 font-sans">
        <div className="flex items-center gap-2">
          <span className="text-zinc-100 font-semibold text-xs tracking-tight">
            Peel-Chain Topology
          </span>
          <span className="text-[11px] text-zinc-400">
            DAG · {nodes.length} Hops · {nodes.length} Nodes
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-[11px] text-zinc-400 font-sans">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" /> Intermediary Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" /> OTC Gateway
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_rgba(245,158,11,0.6)]" /> Active Trace
          </span>
        </div>
      </div>

      {/* React Flow Graph Surface */}
      <div className="relative flex-1 bg-[#0d0e12] border border-zinc-800/80 rounded-lg overflow-hidden min-h-[380px]">
        <ReactFlow
          nodes={rfNodes}
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
