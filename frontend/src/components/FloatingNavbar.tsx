import { motion } from "framer-motion";

interface NavbarProps {
  activeTab: "overview" | "workbench";
  onTabChange: (tab: "overview" | "workbench") => void;
  isLiveBackend?: boolean;
}

export function FloatingNavbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <>
      {/* Brand Logo - Top Left Corner */}
      <div className="fixed top-6 left-6 md:left-10 z-50 pointer-events-auto">
        <button
          onClick={() => onTabChange("overview")}
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-85 group"
          title="Parallax"
        >
          <img
            src="/logo1.png"
            alt="Parallax Logo"
            className="h-8 md:h-9 w-auto object-contain brightness-110 drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-transform duration-200 group-hover:scale-105"
          />
        </button>
      </div>

      {/* Minimalist Floating Underline Navigation - Zero Background Container */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <nav className="flex items-center gap-8 px-4 py-1 font-sans">
          {/* Tab 1: Overview */}
          <button
            onClick={() => onTabChange("overview")}
            className={`relative pb-1 text-sm font-medium transition-colors cursor-pointer ${
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
            className={`relative pb-1 text-sm font-medium transition-colors cursor-pointer ${
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
    </>
  );
}
