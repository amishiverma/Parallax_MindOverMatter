import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface WalletNodeData {
  label: string;
  walletId: string;
  amount: number;
  hop: number;
  isCashout: boolean;
  mixerType?: string;
  isSelected?: boolean;
  isInActivePath?: boolean;
  timestamp: string;
  [key: string]: unknown;
}

export function WalletNode({ data }: NodeProps) {
  const nodeData = data as unknown as WalletNodeData;
  const isSelected = Boolean(nodeData.isSelected);
  const isInActivePath = Boolean(nodeData.isInActivePath);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(nodeData.amount);

  return (
    <div
      className={`relative w-[232px] rounded-lg p-3 transition-all duration-200 select-none shadow-md ${
        isSelected
          ? "bg-[#181924] border border-amber-500/70 ring-1 ring-amber-500/40 shadow-black/60 text-zinc-100"
          : isInActivePath
          ? "bg-[#151722] border border-amber-500/35 text-zinc-200"
          : nodeData.isCashout
          ? "bg-[#13141d] border border-zinc-700/80 hover:border-zinc-500 text-zinc-200"
          : nodeData.hop === 0
          ? "bg-[#161824] border border-zinc-700 hover:border-zinc-500 text-zinc-100"
          : "bg-[#12141c] border border-zinc-800/90 hover:border-zinc-600 text-zinc-300"
      }`}
    >
      {/* Input Handle (Left) - for Hop > 0 */}
      {nodeData.hop > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-zinc-600 !border !border-[#0d0e12] -ml-1 hover:!bg-amber-400"
        />
      )}

      {/* Header: Hop badge and Timestamp */}
      <div className="flex items-center justify-between mb-1.5 font-sans">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded tracking-wide ${
            nodeData.hop === 0
              ? "bg-zinc-800 text-zinc-200 border border-zinc-750"
              : nodeData.isCashout
              ? "bg-amber-950/30 text-amber-300/90 border border-amber-800/40"
              : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40"
          }`}
        >
          {nodeData.hop === 0 ? "Genesis Root" : `Hop ${nodeData.hop}`}
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          {nodeData.timestamp}
        </span>
      </div>

      {/* Title / Label */}
      <div className="font-sans font-semibold text-xs text-zinc-100 truncate mb-1">
        {nodeData.label}
      </div>

      {/* Raw Wallet Hash strictly in monospace */}
      <div className="font-mono text-[11px] text-zinc-400 truncate mb-2">
        {nodeData.walletId}
      </div>

      {/* Bottom Row: Amount & Tags */}
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80 font-sans">
        <span className={`font-semibold text-xs ${nodeData.hop === 0 ? "text-zinc-100 text-[13px] font-bold" : "text-zinc-200"}`}>
          {formattedAmount}
        </span>
        {nodeData.isCashout && (
          <span className="text-[10px] font-medium text-amber-300 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-600/40">
            OTC Off-Ramp
          </span>
        )}
      </div>

      {/* Output Handle (Right) - unless final terminal cashout */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-zinc-600 !border !border-[#0d0e12] -mr-1 hover:!bg-amber-400"
      />
    </div>
  );
}
