import { useEffect, useRef } from "react";

export function VaultFractureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 500;
    };
    resize();
    window.addEventListener("resize", resize);

    // 3D Nodes representing vault core and fracturing fragments
    const numNodes = 28;
    const nodes = Array.from({ length: numNodes }, (_, i) => {
      const isCore = i < 6;
      const radius = isCore ? Math.random() * 60 + 20 : Math.random() * 160 + 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      return {
        isCore,
        radius,
        theta,
        phi,
        speed: (Math.random() * 0.008 + 0.004) * (i % 2 === 0 ? 1 : -1),
        size: isCore ? 4 : 2,
        color: isCore ? "#ef4444" : Math.random() > 0.6 ? "#f59e0b" : "#71717a",
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      angle += 0.006;

      // Project 3D to 2D
      const projected = nodes.map((node) => {
        const curTheta = node.theta + angle * (node.isCore ? 1 : 1.5);
        const x3d = node.radius * Math.cos(curTheta) * Math.cos(node.phi);
        const y3d = node.radius * Math.sin(node.phi);
        const z3d = node.radius * Math.sin(curTheta) * Math.cos(node.phi);

        // Perspective
        const scale = 320 / (320 + z3d);
        const x2d = cx + x3d * scale;
        const y2d = cy + y3d * scale;

        return { x: x2d, y: y2d, z: z3d, scale, node };
      });

      // Sort by depth
      projected.sort((a, b) => a.z - b.z);

      // Draw connecting fracture lines
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 85) {
            const alpha = (1 - dist / 85) * 0.35;
            ctx.strokeStyle = p1.node.isCore || p2.node.isCore 
              ? `rgba(239, 68, 68, ${alpha})` 
              : `rgba(82, 82, 91, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      projected.forEach((p) => {
        ctx.fillStyle = p.node.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.node.size * p.scale, 0, Math.PI * 2);
        ctx.fill();

        if (p.node.isCore) {
          ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, (p.node.size + 4) * p.scale, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
