import React, { useEffect, useRef } from "react";
import { Renderer, Camera, Transform, Plane, Mesh, Program, Texture } from "ogl";
import "./CircularGallery.css";

export interface GalleryItem {
  image: string;
  text: string;
  description?: string;
}

export interface CircularGalleryProps {
  items: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  scrollEase?: number;
  className?: string;
}

const vertexShader = `
attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uBend;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  // Apply smooth cylindrical horizontal bend
  pos.z -= (pos.x * pos.x) * (uBend * 0.08);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D tMap;
uniform float uBorderRadius;
uniform float uAlpha;

varying vec2 vUv;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + vec2(r);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
  vec4 color = texture2D(tMap, vUv);
  
  if (uBorderRadius > 0.0) {
    vec2 p = vUv - 0.5;
    float d = roundedBox(p, vec2(0.48), uBorderRadius);
    float alpha = 1.0 - smoothstep(0.0, 0.015, d);
    color.a *= alpha;
  }
  
  color.a *= uAlpha;
  gl_FragColor = color;
}
`;

export const CircularGallery: React.FC<CircularGalleryProps> = ({
  items,
  bend = 2,
  textColor = "#ffffff",
  borderRadius = 0.06,
  scrollEase = 0.05,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<{ current: number; target: number; last: number }>({
    current: 0,
    target: 0,
    last: 0,
  });
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !items || items.length === 0) return;

    // 1. Setup OGL Renderer
    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    // 2. Camera & Scene Graph
    const camera = new Camera(gl, { fov: 45 });
    camera.position.set(0, 0, 5.2);
    const scene = new Transform();

    const geometry = new Plane(gl, {
      width: 1.55,
      height: 2.1,
      widthSegments: 24,
      heightSegments: 12,
    });

    // 3. Create Offscreen Canvas Textures for each Forensic Item
    const totalItems = items.length;
    const meshes: Mesh[] = [];

    items.forEach((item, index) => {
      const cardCanvas = document.createElement("canvas");
      cardCanvas.width = 600;
      cardCanvas.height = 800;
      const ctx = cardCanvas.getContext("2d");

      if (ctx) {
        // Deep obsidian glass panel background
        ctx.fillStyle = "#0c0e15";
        ctx.fillRect(0, 0, 600, 800);

        // Specular inner border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, 588, 788);

        // Header telemetry bar
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.fillRect(24, 24, 552, 44);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.strokeRect(24, 24, 552, 44);

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 18px monospace";
        ctx.fillText(`FORENSIC EVIDENCE // FILE 0${index + 1}`, 40, 52);

        // Placeholder dark fill for photo
        ctx.fillStyle = "#151824";
        ctx.fillRect(24, 88, 552, 480);

        // Typography
        ctx.fillStyle = textColor;
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(item.text, 32, 630);

        if (item.description) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "20px monospace";
          ctx.fillText(item.description, 32, 675);
        }

        // Bottom forensic classification tag
        ctx.fillStyle = "#475569";
        ctx.font = "14px monospace";
        ctx.fillText("ATTRIBUTION TOPOLOGY VERIFIED · CHAIN OF CUSTODY VALID", 32, 745);
      }

      const texture = new Texture(gl, { generateMipmaps: false });
      texture.image = cardCanvas;

      // Asynchronously load actual photo into card canvas
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = item.image;
      img.onload = () => {
        if (!ctx) return;
        // Draw loaded image into center container maintaining aspect cover
        ctx.save();
        ctx.beginPath();
        ctx.rect(24, 88, 552, 480);
        ctx.clip();
        ctx.drawImage(img, 24, 88, 552, 480);
        ctx.restore();

        // Top subtle dark vignette over photo
        const grad = ctx.createLinearGradient(0, 88, 0, 568);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(12,14,21,0.7)");
        ctx.fillStyle = grad;
        ctx.fillRect(24, 88, 552, 480);

        texture.image = cardCanvas;
      };

      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          tMap: { value: texture },
          uBend: { value: bend },
          uBorderRadius: { value: borderRadius },
          uAlpha: { value: 1.0 },
        },
        transparent: true,
        depthTest: true,
      });

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      meshes.push(mesh);
    });

    // 4. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // 5. Interaction Listeners (Drag + Wheel)
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - startXRef.current;
      startXRef.current = e.clientX;
      scrollRef.current.target += deltaX * 0.005;
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      // Horizontal or vertical trackpad scroll
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      scrollRef.current.target -= delta * 0.002;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: true });

    // 6. 60 FPS Render Loop
    let animId: number;
    const radius = Math.max(2.6, (totalItems * 1.5) / (Math.PI * 2));

    const render = () => {
      animId = requestAnimationFrame(render);

      // Smooth inertia lerp
      scrollRef.current.current +=
        (scrollRef.current.target - scrollRef.current.current) * scrollEase;

      const currentScroll = scrollRef.current.current;

      meshes.forEach((mesh, index) => {
        // Arrange items on cylindrical radius
        const angle = (index / totalItems) * Math.PI * 2 + currentScroll;
        mesh.position.x = Math.sin(angle) * radius;
        mesh.position.z = Math.cos(angle) * radius - radius * 0.85;
        mesh.rotation.y = angle;

        // Fade cards as they rotate to the back
        const facing = Math.cos(angle);
        const alpha = Math.max(0.1, Math.min(1.0, (facing + 0.6) / 1.6));
        mesh.program.uniforms.uAlpha.value = alpha;
      });

      renderer.render({ scene, camera });
    };

    animId = requestAnimationFrame(render);

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      if (gl.canvas && gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas);
      }
    };
  }, [items, bend, textColor, borderRadius, scrollEase]);

  return <div ref={containerRef} className={`circular-gallery ${className}`} />;
};

export default CircularGallery;
