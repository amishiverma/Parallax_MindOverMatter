import { useRef } from "react";
import { useScroll, useTransform, motion, type MotionValue } from "framer-motion";

const NARRATIVE = [
  "At", "02:14", "AM", "on", "a", "Tuesday,", "an", "automated", "alert", "wakes", 
  "the", "core", "team.", "$42,000,000", "in", "digital", "assets", "has", "been", 
  "drained.", "By", "02:17", "AM,", "the", "capital", "fractured", "into", "hundreds", 
  "of", "micro-wallets", "and", "privacy", "mixers.", "The", "blockchain", "paper", 
  "trail", "was", "broken.", "Our", "Quantitative", "OSINT", "Engine", "mathematically", 
  "fuses", "unstructured", "forum", "chatter,", "developer", "leaks,", "and", 
  "on-chain", "latency", "matrices", "to", "unmask", "the", "actor", "before", 
  "fiat", "cashout."
];

export function WordRevealNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll through the expanded container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative h-[240vh] bg-[#090a0f]">
      {/* Sticky Viewport */}
      <div className="sticky top-0 h-screen flex flex-col justify-center items-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 block mb-6">
            Incident Briefing · Initial Exploit Detection at 02:14 UTC
          </span>

          <p className="flex flex-wrap justify-center gap-x-2.5 gap-y-3.5 text-2xl md:text-4xl font-sans font-medium leading-relaxed tracking-tight">
            {NARRATIVE.map((word, index) => {
              // Calibrated to finish 100% illumination by progress = 0.85
              const start = 0.05 + (index / NARRATIVE.length) * 0.78;
              const end = start + (0.78 / NARRATIVE.length);
              const isRed = word.includes("$42,000,000") || word.includes("fractured") || word.includes("OSINT");

              return (
                <RevealWord
                  key={`${word}-${index}`}
                  word={word}
                  progress={scrollYProgress}
                  range={[start, end]}
                  isRed={isRed}
                />
              );
            })}
          </p>
        </div>
      </div>

      {/* Atmospheric Gradient Blend into Next Page */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#090a0f]/80 to-[#090a0f] pointer-events-none z-20" />
    </div>
  );
}

function RevealWord({
  word,
  progress,
  range,
  isRed,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  isRed: boolean;
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const color = useTransform(progress, range, [
    "#27272a", // Dim dark slate when inactive
    isRed ? "#ef4444" : "#ffffff", // Sharp red or bright white when active
  ]);

  return (
    <motion.span style={{ opacity, color }} className="transition-colors duration-100">
      {word}
    </motion.span>
  );
}
