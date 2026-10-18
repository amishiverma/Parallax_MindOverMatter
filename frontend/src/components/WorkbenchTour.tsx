import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  placement: "right" | "left" | "bottom" | "top";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-osint",
    title: "OSINT Intercepts",
    description:
      "We scrape public chatrooms, dark web forums, and GitHub code leaks in real time. These are the hacker's digital breadcrumbs.",
    placement: "right",
  },
  {
    targetId: "tour-topology",
    title: "Peel-Chain Topology",
    description:
      "The $42M split into 38 smaller wallets to hide the trail. This map connects parent wallets to cashout doors before the money hits fiat banks.",
    placement: "bottom",
  },
  {
    targetId: "tour-attribution",
    title: "Target Attribution",
    description:
      "Our mathematical engine matches on-chain gas tips and forum timestamps to calculate a single guilt score for the prime suspect.",
    placement: "left",
  },
  {
    targetId: "tour-circadian",
    title: "Circadian Dormancy",
    description:
      "Hackers have to sleep. This chart compares when the suspect stopped posting online against when the wallet stopped moving. An exact match confirms the operator's timezone.",
    placement: "left",
  },
  {
    targetId: "tour-proof",
    title: "Correlated Proof Vectors",
    description:
      "Hard forensic evidence linking code signatures, IP relays, and Telegram announcements to specific transaction blocks.",
    placement: "left",
  },
  {
    targetId: "tour-telemetry",
    title: "Headers & Telemetry Controls",
    description:
      "Case telemetry at the top, and a step-by-step heist replay timeline at the bottom to watch the money move minute by minute.",
    placement: "bottom",
  },
];

export function WorkbenchTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const current = TOUR_STEPS[step];

  // Advance or exit with keyboard
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      }
      if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(0, s - 1));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step]);

  // Elevate active element above the dark overlay
  useEffect(() => {
    if (!isOpen) return;
    const target = document.getElementById(current.targetId);
    if (target) {
      target.classList.add("tour-highlight");
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return () => {
      target?.classList.remove("tour-highlight");
    };
  }, [isOpen, step, current]);

  function nextStep() {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setIsOpen(false);
      setStep(0);
    }
  }

  return (
    <>
      {/* Top-Right (?) Trigger Button */}
      <button
        onClick={() => {
          setStep(0);
          setIsOpen(true);
        }}
        className="w-7 h-7 rounded-full border border-white/20 hover:border-white/40 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-sans transition shadow-sm cursor-pointer"
        title="Start Guided Tour"
      >
        ?
      </button>

      {/* Global Tour Styles for Highlight */}
      <style>{`
        .tour-highlight {
          position: relative !important;
          z-index: 60 !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.8), 0 0 50px rgba(245, 158, 11, 0.25) !important;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
      `}</style>

      {/* Dark Spotlight Backdrop & Floating Text */}
      <AnimatePresence>
        {isOpen && (
          <div
            onClick={nextStep}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-[2px] cursor-pointer"
          >
            {/* Plain Floating Text (No chunky boxes) */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 text-center max-w-xl px-6 pointer-events-none select-none"
            >
              <span className="text-[11px] font-sans tracking-widest text-amber-400 uppercase block mb-1.5 font-medium">
                Step {step + 1} of {TOUR_STEPS.length} · {current.title}
              </span>

              <p className="text-white font-sans text-base md:text-lg leading-relaxed mb-3">
                {current.description}
              </p>

              <span className="text-xs text-zinc-500 font-sans tracking-wide block">
                Click anywhere or press [Space] to advance · Step {step + 1} of {TOUR_STEPS.length} · [Esc to exit]
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
