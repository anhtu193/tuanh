"use client";

import {
    useEffect,
    useId,
    useRef,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react";

export type HologramPattern =
  | "rainbow"
  | "cosmos"
  | "linear"
  | "rays"
  | "tinsel";

export type HologramParticles =
  | "embers"
  | "bubbles"
  | "motes"
  | "psychic"
  | "snow";

export type HologramProps = {
  src: string;
  depth?: string;
  width?: number;
  aspect?: string;
  radius?: number;
  pattern?: HologramPattern;
  tint?: string;
  foil?: number;
  glitter?: number;
  glare?: number;
  shine?: number;
  blend?: CSSProperties["mixBlendMode"];
  particles?: false | HologramParticles;
  mask?: "window" | "full" | string;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
};

const PARTICLE_PAD = 30;
const WINDOW_MASK =
  "linear-gradient(to bottom, transparent 3.5%, #000 7.5%, #000 40%, transparent 46%)";
const LIGHT_RADIAL =
  "radial-gradient(circle at calc(var(--px) * 1%) calc(var(--py) * 1%),";

const FILL_VALUES = `0 0 0 0 1
  0 0 0 0 1
  0 0 0 0 1
  0.299 0.587 0.114 0 0`;

const BUMP_VALUES = `0 0 0 0 0
  0 0 0 0 0
  0 0 0 0 0
  -0.299 -0.587 -0.114 1 0.1`;

function foilStyle(pattern: HologramPattern, tint: string): CSSProperties {
  switch (pattern) {
    case "cosmos":
      return {
        backgroundImage: `${LIGHT_RADIAL} rgba(255,255,255,0.3), rgba(255,255,255,0) 50%),conic-gradient(from calc(var(--px) * 3.6deg) at 50% 45%, ${tint}, #c79bff, #ff6b8b, #ffd86b, #7bffb2, ${tint})`,
        backgroundSize: "150% 150%, 200% 200%",
        backgroundPosition: "calc(var(--px) * 1%) calc(var(--py) * 1%), center",
        backgroundBlendMode: "overlay",
        filter: "saturate(1.1) brightness(0.95)",
        mixBlendMode: "soft-light",
      };
    case "linear":
      return {
        backgroundImage: `repeating-linear-gradient(112deg, transparent 0 14px, rgba(255,255,255,0.28) 15px, ${tint} 16px, rgba(255,255,255,0.28) 17px, transparent 18px 32px)`,
        backgroundSize: "200% 200%",
        backgroundPosition: "calc(var(--px) * 2.4%) calc(var(--py) * 2.4%)",
        filter: "saturate(1.15) hue-rotate(calc((var(--px) - 50) * 0.9deg))",
        mixBlendMode: "soft-light",
      };
    case "rays":
      return {
        backgroundImage: `${LIGHT_RADIAL} rgba(255,255,255,0.28), rgba(255,255,255,0) 58%),repeating-conic-gradient(from calc(var(--px) * 1.8deg) at 50% 44%, transparent 0deg, ${tint} 4.5deg, rgba(255,255,255,0.4) 6deg, ${tint} 7.5deg, transparent 16deg)`,
        backgroundSize: "170% 170%, 240% 240%",
        backgroundPosition: "calc(var(--px) * 1%) calc(var(--py) * 1%), center",
        backgroundBlendMode: "overlay",
        filter: "saturate(1.1)",
        mixBlendMode: "soft-light",
      };
    case "tinsel":
      return {
        backgroundImage: `${LIGHT_RADIAL} ${tint}, rgba(0,0,0,0) 60%)`,
        backgroundSize: "170% 170%",
        backgroundPosition: "calc(var(--px) * 1%) calc(var(--py) * 1%)",
        filter: "saturate(1.2) brightness(1.05)",
        mixBlendMode: "soft-light",
      };
    default:
      return {
        backgroundImage: `${LIGHT_RADIAL} rgba(255,255,255,0.35), rgba(255,255,255,0) 55%),repeating-linear-gradient(110deg, #ff6b8b 0%, #ffd86b 14%, #7bffb2 28%, #5cc8ff 42%, #c79bff 56%, #ff6b8b 70%)`,
        backgroundSize: "180% 180%, 320% 320%",
        backgroundPosition:
          "calc(var(--px) * 1%) calc(var(--py) * 1%), calc(var(--px) * -1.2%) calc(var(--py) * 1%)",
        backgroundBlendMode: "overlay",
        filter: "saturate(1.15) hue-rotate(calc((var(--px) - 50) * 1.3deg))",
        mixBlendMode: "soft-light",
      };
  }
}

function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const n = Number.parseInt(value, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Particle = Record<string, number | boolean>;

function HologramParticles({
  kind,
  tint,
}: {
  kind: HologramParticles;
  tint: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [r, g, b] = hexToRgb(tint);
    const pad = PARTICLE_PAD;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const left = () => pad;
    const top = () => pad;
    const right = () => width - pad;
    const bottom = () => height - pad;
    const innerW = () => width - 2 * pad;
    const innerH = () => height - 2 * pad;

    const spawn = (p: Particle, scatter: boolean) => {
      switch (kind) {
        case "embers":
          p.x = left() + innerW() * rand(0.1, 0.9);
          p.y = scatter ? top() + innerH() * rand(0.2, 1) : bottom() - rand(0, innerH() * 0.12);
          p.vx = rand(-10, 10);
          p.vy = -rand(16, 40);
          p.size = rand(1, 3.4);
          p.max = rand(2.4, 5);
          p.life = scatter ? rand(0, Number(p.max)) : Number(p.max);
          p.seed = rand(0, 6.28);
          p.sway = rand(6, 16);
          break;
        case "bubbles":
          p.bx = left() + innerW() * rand(0.08, 0.92);
          p.x = p.bx;
          p.y = scatter ? top() + innerH() * rand(0.1, 1) : bottom() + rand(0, 22);
          p.vy = -rand(10, 26);
          p.size = rand(2, 7);
          p.seed = rand(0, 6.28);
          p.sway = rand(5, 14);
          p.freq = rand(0.6, 1.6);
          break;
        case "motes":
          p.bx = left() + innerW() * rand(0.05, 0.95);
          p.x = p.bx;
          p.y = scatter ? top() + innerH() * rand(0, 1) : bottom() - rand(0, innerH() * 0.1);
          p.vy = -rand(4, 11);
          p.size = rand(0.8, 2.2);
          p.max = rand(3, 6);
          p.life = scatter ? rand(0, Number(p.max)) : Number(p.max);
          p.seed = rand(0, 6.28);
          p.sway = rand(8, 20);
          break;
        case "psychic":
          p.ang = rand(0, 6.28);
          p.orbit = rand(0.16, 0.46) * Math.min(innerW(), innerH());
          p.spin = rand(0.08, 0.26) * (Math.random() < 0.5 ? -1 : 1);
          p.size = rand(1, 3);
          p.bob = rand(3, 8);
          p.seed = rand(0, 6.28);
          p.cy = top() + innerH() * rand(0.34, 0.5);
          break;
        case "snow":
          p.bx = left() + innerW() * rand(-0.05, 1.05);
          p.x = p.bx;
          p.y = scatter ? top() + innerH() * rand(0, 1) : top() - rand(0, 24);
          p.vy = rand(12, 30);
          p.size = rand(1, 3.2);
          p.seed = rand(0, 6.28);
          p.sway = rand(6, 16);
          p.freq = rand(0.4, 1.1);
          p.spin = rand(-1, 1);
          p.star = Math.random() < 0.32;
          break;
      }
    };

    const counts: Record<HologramParticles, number> = {
      embers: 42,
      bubbles: 30,
      motes: 16,
      psychic: 12,
      snow: 50,
    };
    const particles: Particle[] = [];
    for (let i = 0; i < counts[kind]; i++) {
      const p: Particle = {};
      spawn(p, true);
      particles.push(p);
    }

    let last = performance.now();
    let t = 0;
    let frame = 0;

    const tick = () => {
      const now = performance.now();
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      t += dt;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        switch (kind) {
          case "embers": {
            p.life = Number(p.life) - dt;
            p.vy = Number(p.vy) - 8 * dt;
            p.x =
              Number(p.x) +
              (Number(p.vx) + Math.sin(t * 1.5 + Number(p.seed)) * Number(p.sway)) *
                dt;
            p.y = Number(p.y) + Number(p.vy) * dt;
            if (Number(p.life) <= 0 || Number(p.y) < top() - pad) spawn(p, false);
            const life = Math.max(0, Number(p.life) / Number(p.max));
            const alpha = life * (0.6 + 0.4 * Math.sin(t * 12 + Number(p.seed)));
            const size = Number(p.size) * (1 + (1 - life) * 1.4);
            ctx.globalCompositeOperation = "lighter";
            const grad = ctx.createRadialGradient(
              Number(p.x),
              Number(p.y),
              0,
              Number(p.x),
              Number(p.y),
              size * 4,
            );
            grad.addColorStop(0, `rgba(255,244,206,${0.9 * alpha})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.5 * alpha})`);
            grad.addColorStop(1, `rgba(${r},${(g * 0.35) | 0},0,0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(Number(p.x), Number(p.y), size * 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "bubbles": {
            p.y = Number(p.y) + Number(p.vy) * dt;
            p.x =
              Number(p.bx) +
              Math.sin(t * Number(p.freq) + Number(p.seed)) * Number(p.sway);
            if (Number(p.y) < top() - 6) spawn(p, false);
            const fade = (Number(p.y) - top()) / innerH();
            const alpha = fade < 0.14 ? Math.max(0, fade / 0.14) : 1;
            ctx.globalCompositeOperation = "source-over";
            ctx.beginPath();
            ctx.arc(Number(p.x), Number(p.y), Number(p.size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${0.1 * alpha})`;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(228,246,255,${0.55 * alpha})`;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(
              Number(p.x) - Number(p.size) * 0.32,
              Number(p.y) - Number(p.size) * 0.32,
              Math.max(0.5, Number(p.size) * 0.22),
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = `rgba(255,255,255,${0.85 * alpha})`;
            ctx.fill();
            break;
          }
          case "motes": {
            p.life = Number(p.life) - dt;
            p.y = Number(p.y) + Number(p.vy) * dt;
            p.x =
              Number(p.bx) + Math.sin(t * 0.6 + Number(p.seed)) * Number(p.sway);
            if (Number(p.life) <= 0 || Number(p.y) < top() - pad) spawn(p, false);
            const life = Math.max(0, Number(p.life) / Number(p.max));
            const alpha =
              Math.sin(Math.PI * life) *
              (0.45 + 0.4 * Math.sin(t * 2 + Number(p.seed))) *
              0.5;
            const size = Number(p.size);
            ctx.globalCompositeOperation = "lighter";
            const grad = ctx.createRadialGradient(
              Number(p.x),
              Number(p.y),
              0,
              Number(p.x),
              Number(p.y),
              size * 4,
            );
            grad.addColorStop(0, `rgba(255,250,235,${0.7 * alpha})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.4 * alpha})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(Number(p.x), Number(p.y), size * 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "psychic": {
            p.ang = Number(p.ang) + Number(p.spin) * dt;
            const x =
              (left() + right()) / 2 + Math.cos(Number(p.ang)) * Number(p.orbit);
            const y =
              Number(p.cy) +
              Math.sin(Number(p.ang)) * Number(p.orbit) * 0.62 +
              Math.sin(t + Number(p.seed)) * Number(p.bob);
            const alpha = 0.16 + 0.2 * Math.abs(Math.sin(t * 0.6 + Number(p.seed)));
            const size = Number(p.size);
            ctx.globalCompositeOperation = "lighter";
            const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
            grad.addColorStop(0, `rgba(238,224,255,${0.6 * alpha})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.35 * alpha})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size * 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "snow": {
            p.y = Number(p.y) + Number(p.vy) * dt;
            p.x =
              Number(p.bx) +
              Math.sin(t * Number(p.freq) + Number(p.seed)) * Number(p.sway);
            if (Number(p.y) > bottom() + pad) spawn(p, false);
            ctx.globalCompositeOperation = "source-over";
            const twinkle = 0.6 + 0.4 * Math.sin(t * 5 + Number(p.seed));
            if (p.star) {
              const arm = Number(p.size) * 1.9 * (0.7 + 0.3 * twinkle);
              ctx.strokeStyle = `rgba(236,248,255,${0.9 * twinkle})`;
              ctx.lineWidth = 1;
              ctx.save();
              ctx.translate(Number(p.x), Number(p.y));
              ctx.rotate(t * Number(p.spin) * 0.5 + Number(p.seed));
              for (let i = 0; i < 3; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(-arm, 0);
                ctx.lineTo(arm, 0);
                ctx.stroke();
              }
              ctx.restore();
            } else {
              ctx.fillStyle = `rgba(240,250,255,${0.85 * twinkle})`;
              ctx.beginPath();
              ctx.arc(Number(p.x), Number(p.y), Number(p.size), 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
        }
      }

      ctx.globalCompositeOperation = "source-over";
      if (!reduceMotion) frame = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [kind, tint]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: -PARTICLE_PAD,
        width: `calc(100% + ${2 * PARTICLE_PAD}px)`,
        height: `calc(100% + ${2 * PARTICLE_PAD}px)`,
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}

export default function Hologram({
  src,
  depth,
  width = 320,
  aspect = "733 / 1024",
  radius = 18,
  pattern = "rainbow",
  tint = "#7cc5ff",
  foil = 0.28,
  glitter = 0.24,
  glare = 0.3,
  shine = 0.62,
  blend = "overlay",
  particles = false,
  mask = "window",
  className,
  style,
  interactive = true,
}: HologramProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const organLightRef = useRef<SVGFEPointLightElement>(null);
  const borderLightRef = useRef<SVGFEPointLightElement>(null);
  const uid = useId().replace(/:/g, "");
  const organId = `organ-${uid}`;
  const borderId = `border-${uid}`;
  const light = useRef({ x: width / 2, y: width * 0.7 });
  const lightTarget = useRef({ x: width / 2, y: width * 0.7 });
  const glarePos = useRef({ x: 50, y: 50 });
  const glareTarget = useRef({ x: 50, y: 50 });
  const active = useRef(0);
  const activeTarget = useRef(0);
  const hovering = useRef(false);

  useEffect(() => {
    let frame = 0;
    let idle = 0;
    let last = 0;
    const loop = (now: number) => {
      const dt = last
        ? Math.min(0.05, Math.max(0.004, (now - last) / 1000))
        : 1 / 60;
      last = now;
      const scaled = dt * 60;
      const card = cardRef.current;
      if (card) {
        const rect = card.getBoundingClientRect();
        if (!hovering.current) {
          idle += 0.012 * scaled;
          const wave = (1 - Math.cos(idle / 2)) / 2;
          lightTarget.current.x = rect.width / 2;
          lightTarget.current.y = rect.height + 80 - wave * (rect.height + 160);
          glareTarget.current.x = 50 + Math.sin(idle / 3) * 18;
          glareTarget.current.y = 100 - wave * 100;
          activeTarget.current = 0.12;
        }
        const follow = 1 - Math.pow(1 - 0.15, scaled);
        const ease = 1 - Math.pow(1 - 0.1, scaled);
        light.current.x += (lightTarget.current.x - light.current.x) * follow;
        light.current.y += (lightTarget.current.y - light.current.y) * follow;
        glarePos.current.x += (glareTarget.current.x - glarePos.current.x) * follow;
        glarePos.current.y += (glareTarget.current.y - glarePos.current.y) * follow;
        active.current += (activeTarget.current - active.current) * ease;
        const lx = String(light.current.x);
        const ly = String(light.current.y);
        organLightRef.current?.setAttribute("x", lx);
        organLightRef.current?.setAttribute("y", ly);
        borderLightRef.current?.setAttribute("x", lx);
        borderLightRef.current?.setAttribute("y", ly);
        card.style.setProperty("--px", glarePos.current.x.toFixed(2));
        card.style.setProperty("--py", glarePos.current.y.toFixed(2));
        card.style.setProperty("--active", active.current.toFixed(3));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (interactive) return;
    hovering.current = false;
    activeTarget.current = 0.12;
    const root = rootRef.current;
    const card = cardRef.current;
    if (root) {
      root.style.transform =
        "perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)";
      root.style.transition = "transform 420ms ease-out";
    }
    if (card) card.style.boxShadow = "0 24px 60px rgba(0,0,0,0.35)";
  }, [interactive]);

  const onPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const root = rootRef.current;
    if (!interactive || !card || !root) return;
    const rect = card.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotY = -(event.clientX - cx) / 18;
    const rotX = (event.clientY - cy) / 18;
    lightTarget.current.x = rect.width / 2 + rotY * 90;
    lightTarget.current.y = rect.height + -rotX * 70;
    glareTarget.current.x = Math.max(0, Math.min(100, nx * 100));
    glareTarget.current.y = Math.max(0, Math.min(100, ny * 100));
    activeTarget.current = 1;
    root.style.transition = "transform 80ms ease-out";
    root.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.045)`;
    card.style.boxShadow = `${-rotY * 1.5}px ${rotX * 1.5 + 24}px 50px rgba(0,0,0,0.4)`;
    hovering.current = true;
  };

  const onLeave = () => {
    if (!interactive) return;
    hovering.current = false;
    activeTarget.current = 0.12;
    const root = rootRef.current;
    const card = cardRef.current;
    if (root) {
      root.style.transform =
        "perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)";
      root.style.transition = "transform 500ms ease-out";
    }
    if (card) card.style.boxShadow = "0 24px 60px rgba(0,0,0,0.35)";
  };

  const layer: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };
  const maskImage = mask === "full" ? undefined : mask === "window" ? WINDOW_MASK : mask;
  const maskStyle: CSSProperties = maskImage
    ? { WebkitMaskImage: maskImage, maskImage }
    : {};

  return (
    <div
      ref={rootRef}
      className={className}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={onLeave}
      onPointerUp={onLeave}
      onPointerCancel={onLeave}
      style={{
        transform: "perspective(1100px) rotateX(0deg) rotateY(0deg)",
        transition: "transform 500ms ease-out",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div style={{ position: "relative", width, aspectRatio: aspect }}>
        <div
          ref={cardRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            ["--px" as string]: "50",
            ["--py" as string]: "50",
            ["--active" as string]: "0",
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            style={{ ...layer, objectFit: "cover" }}
          />
          <div
            style={{
              ...layer,
              ...maskStyle,
              opacity: `calc(var(--active) * ${foil})`,
              ...foilStyle(pattern, tint),
            }}
          />
          <div
            style={{
              ...layer,
              ...maskStyle,
              opacity: `calc(var(--active) * ${glitter})`,
              backgroundImage:
                "radial-gradient(circle at calc(var(--px) * 1%) calc(var(--py) * 1%), #fff, #000 45%),url(/cards/sparkle.png)",
              backgroundSize: "200% 200%, 168px 168px",
              backgroundPosition:
                "center, calc(var(--px) * 0.5%) calc(var(--py) * 0.5%)",
              backgroundBlendMode: "multiply",
              filter: "brightness(1.02) contrast(1.05)",
              mixBlendMode: "screen",
            }}
          />
          <svg
            width="0"
            height="0"
            style={{ position: "absolute", pointerEvents: "none" }}
            aria-hidden
          >
            <filter id={borderId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="b" />
              <feDiffuseLighting
                in="b"
                surfaceScale="20"
                diffuseConstant="2.2"
                lightingColor="white"
                result="lit"
              >
                <fePointLight
                  ref={borderLightRef}
                  x={width / 2}
                  y={width * 0.7}
                  z="50"
                />
              </feDiffuseLighting>
              <feColorMatrix
                in="lit"
                type="matrix"
                values={FILL_VALUES}
                result="litAlpha"
              />
              <feComposite in="litAlpha" in2="SourceGraphic" operator="in" />
            </filter>
            <filter id={organId} x="0" y="0" width="100%" height="100%">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values={BUMP_VALUES}
                result="bumpRaw"
              />
              <feGaussianBlur in="bumpRaw" stdDeviation="1.5" result="bump" />
              <feDiffuseLighting
                in="bump"
                surfaceScale="15"
                diffuseConstant="0.5"
                lightingColor="white"
                result="lit"
              >
                <fePointLight
                  ref={organLightRef}
                  x={width * 0.5}
                  y={width * 0.7}
                  z="60"
                />
              </feDiffuseLighting>
              <feColorMatrix
                in="lit"
                type="matrix"
                values={FILL_VALUES}
                result="litAlpha"
              />
              <feComposite in="litAlpha" in2="bumpRaw" operator="in" />
            </filter>
          </svg>
          <div
            style={{
              ...layer,
              filter: `url(#${organId})`,
              mixBlendMode: blend,
              opacity: shine,
            }}
          >
            <img
              src={depth ?? src}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              ...layer,
              opacity: `calc(0.04 + var(--active) * ${glare})`,
              background:
                "radial-gradient(circle at calc(var(--px) * 1%) calc(var(--py) * 1%), rgba(255,255,255,0.2), rgba(255,255,255,0) 72%)",
              mixBlendMode: "soft-light",
            }}
          />
          <div
            style={{
              ...layer,
              borderRadius: radius,
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 5px rgba(255,255,255,0.16), inset 0 -8px 22px rgba(0,0,0,0.2)",
            }}
          />
        </div>
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            mixBlendMode: "soft-light",
            overflow: "visible",
            pointerEvents: "none",
          }}
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx={radius}
            ry={radius}
            fill="none"
            stroke="white"
            strokeWidth={2}
            style={{ filter: `url(#${borderId})` }}
          />
        </svg>
        {particles ? <HologramParticles kind={particles} tint={tint} /> : null}
      </div>
    </div>
  );
}
