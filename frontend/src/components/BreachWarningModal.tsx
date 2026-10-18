import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { playSecurityAlarm, stopSecurityAlarm } from "../utils/alertAudio";

interface BreachWarningModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function BreachWarningModal({ isOpen, onDismiss }: BreachWarningModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Trigger 5-cycle alarm audio and auto-dismiss after completion
    playSecurityAlarm(5, onDismiss);

    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      stopSecurityAlarm();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  const handleManualInvestigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSecurityAlarm();
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleManualInvestigate}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer select-none"
        >
          {/* Scanline CRT Texture */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-40" />

          {/* Glitch & Blink CSS Animations */}
          <style>{`
            @keyframes breachBlink {
              0%, 18%, 22%, 38%, 42%, 58%, 62%, 78%, 82%, 98% {
                opacity: 1;
              }
              20%, 40%, 60%, 80%, 100% {
                opacity: 0.15;
              }
            }
            @keyframes glitchText {
              0%, 100% { transform: translate(0); text-shadow: 0 0 20px #ef4444; }
              15% { transform: translate(-3px, 1.5px); text-shadow: -3px 0 #ef4444, 3px 0 #3b82f6; }
              30% { transform: translate(3px, -1.5px); text-shadow: 3px 0 #ef4444, -3px 0 #10b981; }
              45% { transform: translate(-2px, 2px); text-shadow: -2px 0 #ef4444; }
              60% { transform: translate(2px, -1px); text-shadow: 2px 0 #ef4444; }
              75% { transform: translate(-1px, -1px); text-shadow: -1px 0 #ef4444; }
            }
            .animate-breach-blink {
              animation: breachBlink 4.5s ease-in-out infinite;
            }
            .animate-glitch {
              animation: glitchText 0.35s steps(2, end) infinite;
            }
          `}</style>

          {/* Central Breach Warning Graphic */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center p-8 md:p-12 border-2 border-red-500/80 bg-red-950/20 backdrop-blur-xl rounded-2xl shadow-[0_0_80px_rgba(239,68,68,0.35)] animate-breach-blink"
          >
            {/* Top Security Siren Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-300 font-mono text-xs uppercase tracking-widest mb-6">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Security Incident · Severity Critical</span>
            </div>

            {/* Giant Hazard Icon */}
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" />
            </div>

            {/* Glitch Headline */}
            <h1 className="text-4xl md:text-6xl font-black font-sans tracking-tight text-red-500 uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-glitch mb-2">
              WARNING
            </h1>

            {/* Sub-headline */}
            <h2 className="text-lg md:text-2xl font-bold font-mono tracking-wider text-red-200 uppercase mb-4">
              UNAUTHORIZED ACCESS DETECTED
            </h2>

            {/* Breach Details Card */}
            <div className="w-full bg-black/60 border border-red-500/30 rounded-lg p-4 mb-6 font-mono text-xs text-left text-red-300/90 space-y-1.5">
              <div className="flex justify-between border-b border-red-500/20 pb-1">
                <span className="text-red-400">TARGET PROTOCOL:</span>
                <span className="text-white">Aave / Curve Liquidity Pool</span>
              </div>
              <div className="flex justify-between border-b border-red-500/20 pb-1">
                <span className="text-red-400">EXPLOIT TYPE:</span>
                <span className="text-white">Unchecked Reentrancy Attack</span>
              </div>
              <div className="flex justify-between border-b border-red-500/20 pb-1">
                <span className="text-red-400">FUNDS SIPHONED:</span>
                <span className="text-red-400 font-bold">$42,000,000 USD (38 Splits)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">TELEMETRY STATUS:</span>
                <span className="text-emerald-400 font-bold animate-pulse">LIVE PEEL-CHAIN DETECTED</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleManualInvestigate}
              className="group px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-sm rounded-full shadow-[0_0_35px_rgba(239,68,68,0.7)] transition-all duration-200 flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <span>INVESTIGATE NOW</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <span className="text-[11px] font-mono text-zinc-400 mt-4 tracking-wide">
              Click anywhere or press [Space] to investigate · Auto-routing in 4.5s
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
