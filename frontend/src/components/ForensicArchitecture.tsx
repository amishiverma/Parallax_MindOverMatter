import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import TextType from "./reactbits/TextType";
import { Zap, Layers, Cpu, ArrowRight } from "lucide-react";

const cards = [
  {
    icon: Zap,
    step: "1. The Exploit",
    desc: "$42M in digital assets was drained from liquidity smart contracts at 2:14 AM and instantly fractured into 38 peel-chain micro-wallets and cross-chain privacy bridges.",
    stats: [
      { label: "Initial Loss", val: "$42,000,000" },
      { label: "Peel Depth", val: "3 Hops" },
    ],
  },
  {
    icon: Layers,
    step: "2. The Conflict",
    desc: "OSINT investigators drown in unstructured Telegram leaks and developer chatter, while on-chain analysts stare at anonymous wallet strings without identity provenance.",
    stats: [
      { label: "Unstructured Signals", val: "High Velocity" },
      { label: "Siloed Analysts", val: "0 Bridge" },
    ],
  },
  {
    icon: Cpu,
    step: "3. The Fusion Engine",
    desc: "Statistical time-delta latency matching and topological DAG clustering mathematically fuse forum personas with on-chain hops to deanonymize actors before fiat off-ramps.",
    stats: [
      { label: "Latency Delta", val: "840ms" },
      { label: "Dormancy Match", val: "100%" },
    ],
  },
];

export function ForensicArchitecture({ onLaunch }: { onLaunch: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });
  const [animKey, setAnimKey] = useState(0);

  // Increment key whenever scrolled into view to re-run the animation every single time
  useEffect(() => {
    if (isInView) {
      setAnimKey((prev) => prev + 1);
    }
  }, [isInView]);

  return (
    <section ref={containerRef} className="relative py-28 px-6 bg-[#090a0f] overflow-hidden">
      {/* Seamless Top Blend Mask into Narrative Section */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-t from-transparent to-[#090a0f] pointer-events-none z-10" />

      <div className="max-w-6xl mx-auto relative z-20">
        {/* Animated Header & Subtext (Re-triggers every time on entry) */}
        <div className="text-center mb-16">
          <span className="text-[11px] font-sans tracking-widest text-zinc-400 uppercase bg-zinc-900/80 px-3.5 py-1 rounded-full border border-zinc-800">
            Forensic Architecture
          </span>

          <div className="mt-4 mb-3 min-h-[56px] flex items-center justify-center">
            <TextType
              key={`header-${animKey}`}
              as="h2"
              text={["Connecting Chatter to the Blockchain Ledger"]}
              typingSpeed={30}
              showCursor={false}
              className="text-3xl md:text-5xl font-bold tracking-tight text-white font-sans inline-block"
            />
          </div>

          <div className="min-h-[48px] flex items-center justify-center">
            <TextType
              key={`sub-${animKey}`}
              as="p"
              text={["How Parallax mathematically correlates forum disclosures with fragmented wallet transactions."]}
              typingSpeed={22}
              initialDelay={900}
              showCursor
              cursorColor="#f59e0b"
              className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* 3 Liquid Glass Cards with Hover Glow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl p-6 bg-slate-900/30 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:border-white/30 hover:shadow-[0_0_35px_rgba(255,255,255,0.12)] transition-all duration-300 flex flex-col justify-between cursor-default"
              >
                {/* Top Specular Rim Light (Intensifies on hover) */}
                <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:via-white/70 transition-all duration-300 pointer-events-none" />

                <div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-5 group-hover:border-zinc-500 transition-colors">
                    <Icon className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>

                  <h3 className="text-lg font-semibold text-white tracking-tight mb-2.5 font-sans">
                    {card.step}
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-sans mb-6">
                    {card.desc}
                  </p>
                </div>

                <div className="border-t border-white/[0.06] pt-4 grid grid-cols-2 gap-2 text-xs font-sans">
                  {card.stats.map((s, idx) => (
                    <div key={idx}>
                      <span className="text-[10px] text-zinc-500 uppercase block">{s.label}</span>
                      <span className="text-zinc-200 font-semibold">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Launch Button */}
        <div className="text-center">
          <button
            onClick={onLaunch}
            className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-zinc-100 hover:bg-white text-black text-sm font-semibold tracking-wide shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.25)] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            Launch Forensic Workbench
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
