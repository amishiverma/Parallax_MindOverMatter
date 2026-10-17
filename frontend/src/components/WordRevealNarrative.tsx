import { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

const NARRATIVE = [
  "At", "02:14", "AM", "on", "a", "Tuesday,", "an", "automated", "alert", "wakes", "the", "core", "team.", 
  "$42,000,000", "in", "digital", "assets", "has", "been", "drained.", 
  "By", "02:17", "AM,", "the", "capital", "fractured", "into", "hundreds", "of", "micro-wallets", 
  "and", "privacy", "mixers.", "The", "blockchain", "paper", "trail", "was", "broken.", 
  "Our", "Quantitative", "OSINT", "Engine", "mathematically", "fuses", "unstructured", 
  "forum", "chatter,", "developer", "leaks,", "and", "on-chain", "latency", 
  "matrices", "to", "unmask", "the", "actor", "before", "fiat", "cashout."
];

export function WordRevealNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.25"],
  });

  return (
    <section 
      ref={containerRef} 
      className="min-h-[120vh] bg-[#0d0e12] py-24 px-6 flex items-center justify-center border-y border-slate-800/80 relative font-sans"
    >
      <div className="max-w-3xl mx-auto sticky top-36 text-center">
        <span className="font-sans text-xs font-medium text-slate-400 block mb-6">
          Incident Briefing · Initial Exploit Detection at <span className="font-mono text-slate-300">02:14 UTC</span>
        </span>
        
        <p className="flex flex-wrap justify-center gap-x-2 gap-y-2.5 text-2xl md:text-3xl font-sans font-medium leading-relaxed tracking-tight">
          {NARRATIVE.map((word, index) => {
            const start = index / NARRATIVE.length;
            const end = start + (1 / NARRATIVE.length);
            const isKeyword = 
              word.includes("$42,000,000") || 
              word.includes("fractured") || 
              word.includes("OSINT");
              
            return (
              <Word 
                key={`${word}-${index}`} 
                progress={scrollYProgress} 
                range={[start, end]} 
                isKeyword={isKeyword}
              >
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </section>
  );
}

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  isKeyword: boolean;
}

function Word({ children, progress, range, isKeyword }: WordProps) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const color = useTransform(progress, range, [
    "#52525b", // zinc-600
    isKeyword ? "#ef4444" : "#ffffff" // sharp #ef4444 for keywords, white for standard words
  ]);

  return (
    <motion.span 
      style={{ opacity, color }} 
      className={`inline-block transition-colors ${
        isKeyword ? "font-semibold" : ""
      }`}
    >
      {children}
    </motion.span>
  );
}
