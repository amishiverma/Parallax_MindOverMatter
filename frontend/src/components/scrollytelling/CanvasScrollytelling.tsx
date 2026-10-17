import { useState, useEffect, useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { ShieldAlert, ChevronDown } from "lucide-react";

interface CanvasScrollytellingProps {
  onLaunchWorkbench?: () => void;
}

const TOTAL_FRAMES = 300;

export function CanvasScrollytelling({ onLaunchWorkbench }: CanvasScrollytellingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [drainedAmount, setDrainedAmount] = useState<number>(0);

  // Track scroll progress along the 500vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map 0 -> 1 progress to frame 0 -> 299
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  // Stage 1 Overlay Animations (Progress 0.0 -> 0.18)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.14, 0.18], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -35]);

  // Stage 2 Descent Indicator (Progress 0.20 -> 0.75)
  const descentOpacity = useTransform(scrollYProgress, [0.18, 0.22, 0.74, 0.78], [0, 1, 1, 0]);

  // Stage 3 Workbench CTA Button (Progress 0.80 -> 1.0)
  const ctaOpacity = useTransform(scrollYProgress, [0.78, 0.84, 1], [0, 1, 1]);
  const ctaY = useTransform(scrollYProgress, [0.78, 0.84], [30, 0]);

  // State to drive right-edge active stage indicator
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  // 1. Preload and cache all 300 frames
  useEffect(() => {
    let active = true;
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(3, "0");
      img.src = `/frames/frame_${paddedIndex}.webp`;

      img.onload = () => {
        if (!active) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded === TOTAL_FRAMES) {
          setIsCached(true);
        }
      };

      img.onerror = () => {
        if (!active) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded === TOTAL_FRAMES) {
          setIsCached(true);
        }
      };

      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      active = false;
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, []);

  // Number Flow trigger on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDrainedAmount(42000000);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // 2. Hardware-accelerated draw function with inner safety bounds cropping
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Clean direct render of processed frame (dual-cropped & watermark-shaded)
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, cw, ch);
  };

  // Render initial frame once cached
  useEffect(() => {
    if (isCached) {
      drawFrame(0);
    }
  }, [isCached]);

  // 3. Bind scroll changes to requestAnimationFrame for zero-lag performance
  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (val) => {
      const targetIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(val)));

      // Update right-rail stage indicator
      const progress = val / (TOTAL_FRAMES - 1);
      if (progress < 0.38) {
        setCurrentStage(1);
      } else if (progress < 0.62) {
        setCurrentStage(2);
      } else {
        setCurrentStage(3);
      }

      if (targetIndex !== currentFrameRef.current) {
        currentFrameRef.current = targetIndex;
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          drawFrame(targetIndex);
        });
      }
    });

    return () => {
      unsubscribe();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [frameIndex, isCached]);

  const scrollToWorkbench = () => {
    if (onLaunchWorkbench) {
      onLaunchWorkbench();
    } else {
      document.getElementById("workbench")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const progressPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <div ref={containerRef} className="relative h-[500vh] bg-[#090a0f]">
      {/* ───────────────────────────────────────────────────────────
          INITIAL CACHING PROGRESS BAR
      ─────────────────────────────────────────────────────────── */}
      {!isCached && (
        <div className="fixed inset-0 z-50 bg-[#090a0f] flex flex-col items-center justify-center font-sans p-6">
          <div className="w-full max-w-md space-y-4 text-center">
            <div className="inline-flex items-center gap-2 text-red-500 text-xs font-semibold uppercase tracking-widest">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              Caching Forensic Video Stream
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Project RedString Engine
            </h2>

            <p className="text-xs text-slate-400">
              Loading 300 telemetry frames for zero-lag hardware-accelerated scrollytelling...
            </p>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-150 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>{loadedCount} / {TOTAL_FRAMES} Frames</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          STICKY FULL-SCREEN VIEWPORT CONTAINER
      ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden relative bg-[#090a0f]">
        {/* HTML5 Canvas with Hardware Acceleration */}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full scale-100 object-cover origin-center opacity-90 block"
        />

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-[#090a0f]/40 to-[#090a0f] z-10" />
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(circle at center, transparent 35%, rgba(9, 10, 15, 0.45) 75%, #090a0f 100%)",
          }}
        />


        {/* ───────────────────────────────────────────────────────────
            STAGE 1: HERO OVERLAY (Progress 0.0 to 0.18 / Frames 0–55)
        ─────────────────────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="absolute top-12 left-8 md:top-20 md:left-16 z-30 max-w-xl pointer-events-none select-none"
        >
          {/* Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-950/40 border border-red-800/60 text-red-400 font-sans text-xs font-semibold tracking-wider mb-4 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            INCIDENT · 02:14 UTC EXPLOIT
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight font-sans mb-4 drop-shadow-md">
            Unmasking the Ghost <br />
            in the Ledger
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-md drop-shadow">
            Autonomous threat actor deanonymization fusing unstructured dark web intercepts with mathematical ledger topology.
          </p>

          {/* Ticker Box */}
          <div className="mt-6 bg-[#11131a]/80 backdrop-blur-md border border-slate-800 rounded-lg p-4 inline-block shadow-2xl">
            <span className="text-[11px] font-sans font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Active Liquid Capital Drained
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
              <span>$</span>
              <NumberFlow
                value={drainedAmount}
                locales="en-US"
                format={{ useGrouping: true }}
              />
              <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 animate-bounce">
            <ChevronDown className="w-4 h-4 text-red-500" />
            <span>Scroll down to initiate descent</span>
          </div>
        </motion.div>

        {/* ───────────────────────────────────────────────────────────
            STAGE 2: DESCENT INDICATOR (Progress 0.20 to 0.75 / Frames 60–225)
            Far-right screen edge (Center remains 100% CLEAR)
        ─────────────────────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: descentOpacity }}
          className="absolute top-1/2 -translate-y-1/2 right-6 md:right-10 z-20 pointer-events-none select-none flex items-center gap-4"
        >
          {/* Vertical Progress Rail */}
          <div className="flex flex-col items-end space-y-6">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              TELEMETRY DESCENT
            </span>

            <div className="space-y-4">
              <div
                className={`flex items-center gap-2.5 text-xs font-sans transition-all duration-200 ${
                  currentStage === 1
                    ? "text-red-400 font-semibold translate-x-0"
                    : "text-slate-500 translate-x-1"
                }`}
              >
                <span className="font-mono text-[11px]">[01 OSINT]</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStage === 1 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-slate-700"
                  }`}
                />
              </div>

              <div
                className={`flex items-center gap-2.5 text-xs font-sans transition-all duration-200 ${
                  currentStage === 2
                    ? "text-red-400 font-semibold translate-x-0"
                    : "text-slate-500 translate-x-1"
                }`}
              >
                <span className="font-mono text-[11px]">[02 MATRIX]</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStage === 2 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-slate-700"
                  }`}
                />
              </div>

              <div
                className={`flex items-center gap-2.5 text-xs font-sans transition-all duration-200 ${
                  currentStage === 3
                    ? "text-red-400 font-semibold translate-x-0"
                    : "text-slate-500 translate-x-1"
                }`}
              >
                <span className="font-mono text-[11px]">[03 CORRELATION]</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStage === 3 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-slate-700"
                  }`}
                />
              </div>
            </div>

            <div className="h-20 w-0.5 bg-slate-800 relative rounded-full overflow-hidden">
              <div
                className="w-full bg-red-500 transition-all duration-75"
                style={{
                  height: `${Math.min(100, Math.max(0, ((currentFrameRef.current - 60) / 165) * 100))}%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* ───────────────────────────────────────────────────────────
            STAGE 3: WORKBENCH CTA BUTTON (Progress 0.80 to 1.0 / Frames 240–300)
            Locked terminal stage -> High impact centered bottom button
        ─────────────────────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="absolute bottom-16 inset-x-0 z-30 flex flex-col items-center justify-center p-4 text-center pointer-events-auto"
        >
          <div className="mb-3 px-3 py-1 rounded bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans backdrop-blur inline-block">
            Target Deanonymized · Aleksei Voronin (<span className="text-red-400 font-mono">@0x_Alek</span>)
          </div>

          <button
            onClick={scrollToWorkbench}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-sans font-semibold rounded-lg shadow-2xl transition cursor-pointer flex items-center gap-2.5 text-sm sm:text-base tracking-wide uppercase hover:scale-105 active:scale-95 duration-150"
          >
            LAUNCH INVESTIGATION WORKBENCH ↓
          </button>
        </motion.div>
      </div>
    </div>
  );
}
