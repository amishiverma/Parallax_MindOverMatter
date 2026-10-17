import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface WalletNodeData {
  label: string;
  walletId: string;
  amount: number;
  hop: number;
  stage?: string;
  isCashout: boolean;
  mixerType?: string;
  isSelected?: boolean;
  isInActivePath?: boolean;
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

  const isHighlighted = isSelected || isInActivePath;

  return (
    <div
      className={`group relative rounded-xl p-4 min-w-[210px] backdrop-blur-xl transition-all duration-300 select-none ${
        isHighlighted
          ? "border border-amber-500/50 bg-gradient-to-br from-amber-500/[0.08] via-slate-900/60 to-slate-950/80 shadow-[0_0_25px_rgba(245,158,11,0.18)]"
          : "bg-slate-900/40 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:border-white/20 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
      }`}
    >
      {/* Top Specular Rim Light */}
      <div
        className={`absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none ${
          isHighlighted ? "via-amber-400/40" : ""
        }`}
      />

      {/* Input Handle (Left) */}
      {nodeData.hop > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-zinc-500 !border !border-[#0d0e12] -ml-1 hover:!bg-amber-400 transition-colors"
        />
      )}

      {/* Element 1: Stage & Label */}
      <div className="flex items-center justify-between gap-2 mb-1.5 font-sans">
        <span className="text-[10px] text-zinc-400 tracking-wide uppercase font-medium">
          {nodeData.stage || (nodeData.hop === 0 ? "Genesis Root" : `Hop ${nodeData.hop}`)}
        </span>
        {nodeData.isCashout && (
          <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full font-medium tracking-tight">
            OTC Off-Ramp
          </span>
        )}
      </div>

      <div className="text-xs font-semibold text-zinc-100 tracking-tight font-sans truncate mb-2">
        {nodeData.label}
      </div>

      {/* Element 2: Bold Financial Amount */}
      <div className="text-base font-bold text-white tracking-tight font-sans">
        {formattedAmount}
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-zinc-500 !border !border-[#0d0e12] -mr-1 hover:!bg-amber-400 transition-colors"
      />
    </div>
  );
}
