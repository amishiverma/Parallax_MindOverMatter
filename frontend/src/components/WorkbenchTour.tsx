import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  positionClass: string; // Dynamic placement in dark negative space
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-osint",
    title: "OSINT Chatter Feed",
    description:
      "Public chats, darkweb posts, and GitHub commits scraped in real time. These are the hacker's digital breadcrumbs.",
    positionClass: "top-1/3 left-[28%] max-w-md text-left",
  },
  {
    targetId: "tour-topology",
    title: "Peel-Chain Topology",
    description:
      "The $42M split into 38 smaller wallets to hide the trail. This map connects parent wallets to cashout doors before funds hit fiat.",
    positionClass: "top-1/3 right-8 max-w-xs text-left",
  },
  {
    targetId: "tour-attribution",
    title: "Target Attribution",
    description:
      "Our mathematical fusion engine matches forum handles to on-chain wallets, calculating a single prime suspect guilt index.",
    positionClass: "top-1/3 right-[28%] max-w-md text-right",
  },
  {
    targetId: "tour-circadian",
    title: "Sleep-Cycle Match",
    description:
      "Hackers have to sleep. This chart compares when the suspect stopped posting against wallet dormancy to isolate their physical timezone.",
    positionClass: "top-1/3 right-[28%] max-w-md text-right",
  },
  {
    targetId: "tour-proof",
    title: "Correlated Proofs",
    description:
      "Hard forensic proofs linking compiler flags, Telegram announcement timestamps, and mixer payout destinations.",
    positionClass: "top-1/2 right-[28%] max-w-md text-right",
  },
  {
    targetId: "tour-telemetry",
    title: "Investigation Controls",
    description:
      "Top bar shows active target and latency offset. Bottom bar replays the heist minute by minute from 02:14 AM onward.",
    positionClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg text-center",
  },
];

export function WorkbenchTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const current = TOUR_STEPS[step];

  // Keyboard navigation: Arrows, Space, Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeTour();
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      }
      if (e.key === "ArrowLeft") {
        prevStep();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step]);

  // Spotlight active element
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
      closeTour();
    }
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
  }

  function closeTour() {
    setIsOpen(false);
    setStep(0);
  }

  return (
    <>
      {/* 1. TOP-RIGHT TRIGGER (?) WHEN TOUR IS CLOSED */}
      {!isOpen && (
        <button
          onClick={() => {
            setStep(0);
            setIsOpen(true);
          }}
          className="fixed top-5 right-6 z-40 w-7 h-7 rounded-full border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-sans transition shadow-sm cursor-pointer"
          title="Start Guided Tour"
        >
          ?
        </button>
      )}

      {/* 2. TOP-RIGHT CONTROLS (Back / Next / Skip) WHEN TOUR IS OPEN */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-5 right-6 z-[80] flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-2xl text-xs font-sans"
        >
          <button
            onClick={prevStep}
            disabled={step === 0}
            className={`transition cursor-pointer ${
              step === 0 ? "text-zinc-600 cursor-not-allowed" : "text-zinc-300 hover:text-white"
            }`}
          >
            ← Back
          </button>
          <span className="text-zinc-700">|</span>
          <button
            onClick={nextStep}
            className="text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer"
          >
            {step === TOUR_STEPS.length - 1 ? "Finish ✓" : "Next →"}
          </button>
          <span className="text-zinc-700">|</span>
          <button
            onClick={closeTour}
            className="text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            Skip ✕
          </button>
        </div>
      )}

      {/* Highlight glow style */}
      <style>{`
        .tour-highlight {
          position: relative !important;
          z-index: 60 !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.9), 0 0 50px rgba(245, 158, 11, 0.25) !important;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
      `}</style>

      {/* 3. DARK SPOTLIGHT LAYER & DYNAMIC FLOATING EXPLANATION */}
      <AnimatePresence>
        {isOpen && (
          <div
            onClick={nextStep}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-[2px] cursor-pointer"
          >
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`fixed ${current.positionClass} z-[70] px-4 select-none pointer-events-none`}
            >
              <span className="text-[11px] font-sans tracking-widest text-amber-400 uppercase block mb-1 font-medium">
                Step {step + 1} of {TOUR_STEPS.length} · {current.title}
              </span>

              <p className="text-white font-sans text-sm md:text-base leading-relaxed mb-2">
                {current.description}
              </p>

              <span className="text-xs text-zinc-500 font-sans tracking-wide block">
                Click anywhere or press [Space] to advance · [Esc] to exit
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
