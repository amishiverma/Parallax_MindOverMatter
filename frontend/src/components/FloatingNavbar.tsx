import { motion } from "framer-motion";

interface NavbarProps {
  activeTab: "overview" | "workbench";
  onTabChange: (tab: "overview" | "workbench") => void;
  isLiveBackend?: boolean;
}

export function FloatingNavbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-7 px-5 py-2 rounded-full bg-[#0d0e12]/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      {/* Brand Logo */}
      <button
        onClick={() => onTabChange("overview")}
        className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-85 group pr-1"
        title="Parallax"
      >
        <img
          src="/logo1.png"
          alt="Parallax Logo"
          className="h-8 w-auto object-contain brightness-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] transition-transform duration-200 group-hover:scale-105"
        />
      </button>

      {/* Subtle Hairline Separator */}
      <div className="h-4 w-[1px] bg-zinc-800" />

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-7 font-sans">
        {/* Tab 1: Overview */}
        <button
          onClick={() => onTabChange("overview")}
          className={`relative pb-0.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "overview" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Overview & Scrollytelling
          {activeTab === "overview" && (
            <motion.div
              layoutId="tabUnderline"
              className="absolute -bottom-1 inset-x-0 h-[2px] bg-white rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>

        {/* Tab 2: Workbench */}
        <button
          onClick={() => onTabChange("workbench")}
          className={`relative pb-0.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "workbench" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Forensic Workbench
          {activeTab === "workbench" && (
            <motion.div
              layoutId="tabUnderline"
              className="absolute -bottom-1 inset-x-0 h-[2px] bg-white rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      </nav>
    </header>
  );
}
