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
      className={`relative w-56 rounded-lg p-3 transition-all duration-150 select-none shadow-md ${
        isSelected
          ? "bg-[#1a1c29] border-2 border-red-500 shadow-red-950/40"
          : isInActivePath
          ? "bg-[#181a24] border border-red-800/90"
          : nodeData.isCashout
          ? "bg-[#16161c] border border-amber-600/70 hover:border-amber-400"
          : "bg-[#14161f] border border-slate-800/90 hover:border-slate-700"
      }`}
    >
      {/* Input Handle (Left) - for Hop > 0 */}
      {nodeData.hop > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-slate-500 !border-2 !border-[#0d0e12] -ml-1 hover:!bg-red-400"
        />
      )}

      {/* Header: Hop badge and Timestamp */}
      <div className="flex items-center justify-between mb-1.5 font-sans">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded tracking-wide ${
            nodeData.hop === 0
              ? "bg-red-950/80 text-red-300 border border-red-800/60"
              : nodeData.isCashout
              ? "bg-amber-950/80 text-amber-300 border border-amber-800/60"
              : "bg-slate-800/80 text-slate-300"
          }`}
        >
          {nodeData.hop === 0 ? "Genesis Root" : `Hop ${nodeData.hop}`}
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          {nodeData.timestamp}
        </span>
      </div>

      {/* Title / Label */}
      <div className="font-sans font-semibold text-xs text-slate-100 truncate mb-1">
        {nodeData.label}
      </div>

      {/* Raw Wallet Hash strictly in monospace */}
      <div className="font-mono text-[11px] text-slate-400 truncate mb-2">
        {nodeData.walletId}
      </div>

      {/* Bottom Row: Amount & Tags */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-sans">
        <span className="font-semibold text-xs text-slate-100">
          {formattedAmount}
        </span>
        {nodeData.isCashout && (
          <span className="text-[10px] font-medium text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50">
            OTC Gateway
          </span>
        )}
      </div>

      {/* Output Handle (Right) - unless final terminal cashout */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-slate-500 !border-2 !border-[#0d0e12] -mr-1 hover:!bg-red-400"
      />
    </div>
  );
}
