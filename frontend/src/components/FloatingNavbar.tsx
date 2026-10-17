import { motion } from "framer-motion";

interface NavbarProps {
  activeTab: "overview" | "workbench";
  onTabChange: (tab: "overview" | "workbench") => void;
  isLiveBackend?: boolean;
}

export function FloatingNavbar({ activeTab, onTabChange, isLiveBackend }: NavbarProps) {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl pointer-events-auto"
    >
      {/* Liquid Glass Capsule */}
      <div className="relative flex items-center justify-between px-5 py-2.5 rounded-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Top Specular Gleam */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          <span className="text-sm font-semibold tracking-tight text-white font-sans">
            Project RedString
          </span>
        </div>

        {/* Segmented Glass Switcher */}
        <div className="flex items-center p-1 rounded-full bg-black/30 border border-white/[0.06]">
          <button
            onClick={() => onTabChange("overview")}
            className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === "overview"
                ? "bg-white/15 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Overview & Scrollytelling
          </button>
          <button
            onClick={() => onTabChange("workbench")}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === "workbench"
                ? "bg-white/15 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Forensic Workbench
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveBackend ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </button>
        </div>

        {/* Clean Live Status */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            {isLiveBackend ? "Live Engine" : "Local Telemetry"}
          </span>
        </div>
      </div>
    </motion.header>
  );
}
