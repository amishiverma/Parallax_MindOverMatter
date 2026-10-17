import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Layers, Cpu, ArrowRight } from "lucide-react";
import { ShinyText } from "./reactbits/ShinyText";
import { TextType } from "./reactbits/TextType";

const cards = [
  {
    icon: Zap,
    iconColor: "text-red-400",
    iconBg: "bg-red-950/40 border-red-500/20",
    step: "1. The Exploit",
    desc: "$42M in digital assets was drained from liquidity smart contracts at 2:14 AM and instantly fractured into 38 peel-chain micro-wallets and cross-chain privacy bridges.",
    stats: [
      { label: "Initial Loss", val: "$42,000,000" },
      { label: "Peel Depth", val: "3 Hops" },
    ],
  },
  {
    icon: Layers,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-950/40 border-amber-500/20",
    step: "2. The Conflict",
    desc: "OSINT investigators drown in unstructured Telegram leaks and developer chatter, while on-chain analysts stare at anonymous wallet strings without identity provenance.",
    stats: [
      { label: "Unstructured Signals", val: "High Velocity" },
      { label: "Siloed Analysts", val: "0 Bridge" },
    ],
  },
  {
    icon: Cpu,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-950/40 border-cyan-500/20",
    step: "3. The Fusion Engine",
    desc: "Statistical Poisson-latency matching and topological DAG clustering mathematically fuse forum personas with on-chain hops to deanonymize actors before fiat off-ramps.",
    stats: [
      { label: "Latency Delta", val: "840ms" },
      { label: "Dormancy Match", val: "100%" },
    ],
  },
];

export function ForensicArchitecture({ onLaunch }: { onLaunch: () => void }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(headerRef, { amount: 0.4, once: true });

  return (
    <section className="relative py-28 px-6 bg-[#090a0f] overflow-hidden">
      {/* Seamless Top Blend Mask into Narrative Section */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-t from-transparent to-[#090a0f] pointer-events-none z-10" />

      <div className="max-w-6xl mx-auto relative z-20">
        {/* Animated Section Header with View Trigger */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-mono tracking-widest text-red-400 uppercase bg-red-950/30 px-3 py-1 rounded-full border border-red-800/40">
            Forensic Architecture
          </span>

          <div className="mt-4 mb-3">
            <ShinyText
              text="Connecting Chatter to the Blockchain Ledger"
              color="#e2e8f0"
              shineColor="#ffffff"
              speed={2.5}
              shineWidth={50}
              disabled={!isInView}
              className="text-3xl md:text-5xl font-bold tracking-tight font-sans inline-block"
            />
          </div>

          <div className="max-w-xl mx-auto min-h-[3rem]">
            <TextType
              text={["How Project RedString mathematically correlates forum disclosures with fragmented wallet transactions."]}
              typingSpeed={35}
              pauseDuration={4000}
              showCursor
              cursorColor="#ef4444"
              start={isInView}
              startOnVisible={true}
              className="text-zinc-400 text-sm md:text-base leading-relaxed"
            />
          </div>
        </motion.div>

        {/* 3 Liquid Glass Cards with Spring Hover Lift */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.16 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14"
        >
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 32 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="group relative rounded-2xl p-6 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.7)] flex flex-col justify-between overflow-hidden cursor-default"
              >
                {/* Top Specular Rim Light */}
                <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                <div>
                  {/* Card Icon */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-5 ${card.iconBg}`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>

                  <h3 className="text-lg font-semibold text-white tracking-tight mb-2.5 font-sans">
                    {card.step}
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-sans mb-6">
                    {card.desc}
                  </p>
                </div>

                {/* Footer Metrics */}
                <div className="border-t border-white/[0.06] pt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                  {card.stats.map((s, idx) => (
                    <div key={idx}>
                      <span className="text-[10px] text-zinc-500 uppercase block">{s.label}</span>
                      <span className="text-zinc-200 font-semibold">{s.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Launch Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <button
            onClick={onLaunch}
            className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-semibold tracking-wide shadow-[0_8px_25px_rgba(225,29,72,0.4)] hover:shadow-[0_12px_32px_rgba(225,29,72,0.6)] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            Launch Forensic Workbench
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
