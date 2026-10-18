import { useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import { WalletNode } from "./WalletNode";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { BlockchainNode, BlockchainEdge } from "../../services/api";

interface PeelChainFlowProps {
  activeWalletId: string;
  onSelectWallet: (walletId: string) => void;
  nodes: BlockchainNode[];
  edges?: BlockchainEdge[];
  puppeteerClusters?: Record<string, string[]>;
}

const nodeTypes = {
  walletNode: WalletNode,
};

function FlowInner({
  activeWalletId,
  onSelectWallet,
  nodes,
  edges: customEdges = [],
}: PeelChainFlowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayOffset, setReplayOffset] = useState(192);
  const { fitView } = useReactFlow();

  // Re-fit graph whenever node count or identities change
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      fitView({ padding: 0.2, duration: 200 });
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

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

    const nodeMap = new Map<string, BlockchainNode>();
    nodes.forEach((n) => {
      const id = n.wallet_id || (n as any).walletId;
      if (id) nodeMap.set(id, n);
    });

    const edgeParentMap = new Map<string, string>();
    if (customEdges && customEdges.length > 0) {
      customEdges.forEach((e) => {
        if (!edgeParentMap.has(e.target)) edgeParentMap.set(e.target, e.source);
      });
    }

    let currentId: string | undefined = activeWalletId;
    let depth = 0;
    while (currentId && depth < 50) {
      branchNodes.add(currentId);
      const node = nodeMap.get(currentId);
      const parentId: string | null | undefined = node?.parent_wallet ?? edgeParentMap.get(currentId);
      if (parentId && parentId !== currentId) {
        branchEdges.add(`${parentId}->${currentId}`);
        currentId = parentId;
        depth++;
      } else {
        break;
      }
    }

    return { branchNodes, branchEdges };
  }, [activeWalletId, nodes, customEdges]);

  // Construct React Flow Nodes with guaranteed valid non-zero positions
  const rfNodes: Node[] = useMemo(() => {
    return nodes.map((n, idx) => {
      const id = String(n.wallet_id || (n as any).walletId || `node-${idx}`);
      const isSelected = activeWalletId === id;
      const isInActivePath = activeBranch.branchNodes.has(id);
      const hop = typeof n.hop_level === "number" ? n.hop_level : ((n as any).hop ?? 0);
      const isCashout = Boolean(n.is_cashout_door ?? (n as any).isCashout);
      const defaultLabel = hop === 0 ? "Genesis Exploit Root" : hop === 1 ? "Privacy Shield Pool" : "OTC Cashout Desk";

      // Deterministic column layout: hop * 300 + 60, index * 90 + 60 (strictly non-zero)
      const posX = (typeof n.x === "number" && n.x > 0) ? n.x : (hop * 300 + 60);
      const posY = (typeof n.y === "number" && n.y > 0) ? n.y : (idx * 90 + 60);

      return {
        id,
        type: "walletNode",
        position: { x: posX, y: posY },
        data: {
          label: n.label || defaultLabel,
          walletId: id,
          amount: (typeof n.amount === "number" && n.amount > 0) ? n.amount : 42000000,
          hop,
          isCashout,
          mixerType: n.mixerType,
          timestamp: n.timestamp || "02:14:02 UTC",
          puppeteer_clusters: n.puppeteer_clusters,
          isSelected,
          isInActivePath,
        },
      };
    });
  }, [activeWalletId, activeBranch, nodes]);

  // Construct React Flow Edges from customEdges or parent relationships
  const rfEdges: Edge[] = useMemo(() => {
    if (customEdges && customEdges.length > 0) {
      return customEdges.map((e) => {
        const edgeKey = `${e.source}->${e.target}`;
        const isActive = activeBranch.branchEdges.has(edgeKey);

        return {
          id: e.id || edgeKey,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          animated: isActive,
          style: {
            stroke: isActive ? "#dc2626" : "#475569",
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
    }

    return nodes
      .filter((n) => n.parent_wallet)
      .map((n) => {
        const id = n.wallet_id || (n as any).walletId;
        const edgeKey = `${n.parent_wallet}->${id}`;
        const isActive = activeBranch.branchEdges.has(edgeKey);

        return {
          id: edgeKey,
          source: n.parent_wallet as string,
          target: id,
          type: "smoothstep",
          animated: isActive,
          style: {
            stroke: isActive ? "#dc2626" : "#475569",
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
  }, [activeBranch, nodes, customEdges]);

  return (
    <div className="flex flex-col h-full justify-between select-none font-sans">
      {/* Topology Header */}
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2 mb-2 font-sans">
        <div className="flex items-center gap-2">
          <span className="text-zinc-100 font-semibold text-xs tracking-tight">
            Peel-Chain Topology
          </span>
          <span className="text-[11px] text-zinc-400">
            DAG · {nodes.length} Nodes · Branching Matrix
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
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_6px_rgba(239,68,68,0.8)]" /> Active Trace
          </span>
        </div>
      </div>

      {/* React Flow Graph Surface */}
      <div className="relative flex-1 bg-[#0d0e12] border border-zinc-800/80 rounded-lg overflow-hidden min-h-[380px]">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => onSelectWallet(node.id)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#1e2230" gap={24} size={1} />
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

export function PeelChainFlow(props: PeelChainFlowProps) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}
