"use client";

/**
 * Local PullCord (based on pullcord@0.1.0).
 * Upstream disables pan + drop bounce when OS "Reduce Motion" is on
 * (common on iOS Safari), so the cord drops and freezes. Physics stays on here.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { motion, type PanInfo } from "motion/react";

type Node = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  fixed: boolean;
};

export type PullCordConfig = {
  gravity: number;
  damping: number;
  iterations: number;
  stretchMax: number;
  stretchToggle: number;
  maxVelocity: number;
  sleepVelocity: number;
};

const DEFAULT_CONFIG: PullCordConfig = {
  gravity: 1250,
  damping: 0.94,
  iterations: 20,
  stretchMax: 26,
  stretchToggle: 20,
  maxVelocity: 22,
  sleepVelocity: 0.15,
};

const W = 64;
const ANCHOR_X = W / 2;
const REST_Y = 176;
const SVG_H = 340;
const SEGMENTS = 16;
const REST_SEG = REST_Y / SEGMENTS;
const KNOB_R = 6.5;
const HIT = 46;
/** Extra paint room so the swinging rope is not clipped (esp. iOS Safari). */
const PAD = 120;
const BOX_W = W + PAD * 2;

function buildPath(p: Node[]) {
  let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const xc = (p[i].x + p[i + 1].x) / 2;
    const yc = (p[i].y + p[i + 1].y) / 2;
    d += ` Q ${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
  }
  const n = p.length - 1;
  d += ` L ${p[n].x.toFixed(1)} ${p[n].y.toFixed(1)}`;
  return d;
}

function makeNodes(): Node[] {
  const arr: Node[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const y = REST_SEG * i;
    arr.push({ x: ANCHOR_X, y, ox: ANCHOR_X, oy: y, fixed: i === 0 });
  }
  return arr;
}

const INITIAL_PATH = buildPath(makeNodes());

type PullCordProps = {
  onPull?: () => void;
  pulled?: boolean;
  ariaLabel?: string;
  noEntrance?: boolean;
  config?: Partial<PullCordConfig>;
  className?: string;
};

export function PullCord({
  onPull,
  pulled = false,
  ariaLabel = "Pull the cord",
  noEntrance = false,
  config,
  className,
}: PullCordProps) {
  const uid = useId().replace(/:/g, "");
  const knobGradId = `pc-knob-${uid}`;
  const knobShadowId = `pc-knob-sh-${uid}`;

  const cfgRef = useRef({ ...DEFAULT_CONFIG });
  Object.assign(cfgRef.current, DEFAULT_CONFIG, config);

  const knobRef = useRef<HTMLButtonElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const clicked = useRef(false);
  const target = useRef({ x: ANCHOR_X, y: REST_Y });
  const wake = useRef(() => {});
  const onPullRef = useRef(onPull);
  onPullRef.current = onPull;

  const nodesRef = useRef<Node[] | null>(null);
  if (nodesRef.current === null) nodesRef.current = makeNodes();

  const [drop, setDrop] = useState(!noEntrance);
  const dropDone = useRef(noEntrance);

  useEffect(() => {
    const pts = nodesRef.current!;
    const last = pts.length - 1;
    let raf = 0;
    let running = false;
    let prevT = 0;
    let prevDt = 0;

    const render = () => {
      cordRef.current?.setAttribute("d", buildPath(pts));
      groupRef.current?.setAttribute(
        "transform",
        `translate(${(pts[last].x - ANCHOR_X).toFixed(2)} ${(pts[last].y - REST_Y).toFixed(2)})`,
      );
    };

    const step = (now: number) => {
      const { gravity, damping, iterations, sleepVelocity } = cfgRef.current;
      const dt = prevT
        ? Math.min(0.04, Math.max(4e-3, (now - prevT) / 1e3))
        : 1 / 60;
      prevT = now;
      const tc = prevDt > 0 ? dt / prevDt : 1;
      const velCoef = tc * Math.pow(damping, dt * 60);
      const accCoef = dt * dt;

      pts[last].fixed = dragging.current;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p.fixed) continue;
        const vx = p.x - p.ox;
        const vy = p.y - p.oy;
        p.ox = p.x;
        p.oy = p.y;
        p.x += vx * velCoef;
        p.y += vy * velCoef + gravity * accCoef;
      }

      pts[0].x = ANCHOR_X;
      pts[0].y = 0;

      if (dragging.current) {
        pts[last].ox = pts[last].x;
        pts[last].oy = pts[last].y;
        pts[last].x = target.current.x;
        pts[last].y = target.current.y;
      }

      for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < last; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1e-4;
          const diff = ((REST_SEG - dist) / dist) * 0.5;
          const ox = dx * diff;
          const oy = dy * diff;
          if (!a.fixed) {
            a.x -= ox;
            a.y -= oy;
          }
          if (!b.fixed) {
            b.x += ox;
            b.y += oy;
          }
        }
      }

      prevDt = dt;
      render();

      let speed = 0;
      for (let i = 1; i < pts.length; i++) {
        speed +=
          Math.abs(pts[i].x - pts[i].ox) + Math.abs(pts[i].y - pts[i].oy);
      }

      if (!dragging.current && speed < sleepVelocity * dt * 60) {
        render();
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    wake.current = () => {
      if (running) return;
      running = true;
      prevT = 0;
      prevDt = 0;
      raf = requestAnimationFrame(step);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  const doToggle = () => onPullRef.current?.();

  const scriptedPull = () => {
    doToggle();
    const pts = nodesRef.current;
    if (!pts) return;
    pts[pts.length - 1].oy -= 22;
    wake.current();
  };

  const onPanStart = () => {
    dragging.current = true;
    didDrag.current = true;
    clicked.current = false;
    wake.current();
  };

  const onPan = (_e: PointerEvent, info: PanInfo) => {
    const { stretchMax, stretchToggle } = cfgRef.current;
    const rx = info.offset.x;
    const ry = REST_Y + info.offset.y;
    const dist = Math.hypot(rx, ry) || 1e-4;
    const maxD = REST_Y + stretchMax;
    const k = dist > maxD ? maxD / dist : 1;
    target.current = { x: ANCHOR_X + rx * k, y: ry * k };
    const clickAt = Math.min(stretchToggle, stretchMax - 1);
    if (!clicked.current && dist - REST_Y >= clickAt) {
      clicked.current = true;
      doToggle();
    }
  };

  const onPanEnd = () => {
    const { maxVelocity } = cfgRef.current;
    dragging.current = false;
    const pts = nodesRef.current!;
    const p = pts[pts.length - 1];
    const vx = p.x - p.ox;
    const vy = p.y - p.oy;
    const v = Math.hypot(vx, vy);
    if (v > maxVelocity) {
      const scale = maxVelocity / v;
      p.ox = p.x - vx * scale;
      p.oy = p.y - vy * scale;
    }
    wake.current();
    requestAnimationFrame(() => {
      didDrag.current = false;
    });
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (didDrag.current) return;
    if (e.detail === 0) return;
    scriptedPull();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
      e.preventDefault();
      scriptedPull();
    }
  };

  const endDrop = useCallback(() => {
    if (dropDone.current) return;
    dropDone.current = true;
    setDrop(false);
    const pts = nodesRef.current;
    if (!pts) return;
    pts[pts.length - 1].oy -= 13;
    pts[pts.length - 1].ox -= 6;
    wake.current();
  }, []);

  useEffect(() => {
    if (noEntrance) return;
    const fb = window.setTimeout(endDrop, 1700);
    return () => window.clearTimeout(fb);
  }, [endDrop, noEntrance]);

  const onDropEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    endDrop();
  };

  return (
    <div
      className={className ? `pullcord ${className}` : "pullcord"}
      style={{
        position: "fixed",
        top: "var(--pullcord-top, 0px)",
        // Shift right so the cord stays at the same place after widening
        right: `calc(var(--pullcord-right, 7rem) - ${PAD}px)`,
        zIndex: "var(--pullcord-z, 5)",
        width: BOX_W,
        height: SVG_H,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <div
        className={
          drop ? "pullcord-inner pullcord-inner--drop" : "pullcord-inner"
        }
        onAnimationEnd={onDropEnd}
        style={{ overflow: "visible" }}
      >
        <svg
          viewBox={`0 0 ${W} ${SVG_H}`}
          width={W}
          height={SVG_H}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: PAD,
            top: 0,
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id={knobGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e7e7ec" />
            </linearGradient>
            <filter
              id={knobShadowId}
              x="-70%"
              y="-70%"
              width="240%"
              height="240%"
            >
              <feDropShadow
                dx="0"
                dy="1.4"
                stdDeviation="1.5"
                floodColor="rgba(0,0,0,0.32)"
              />
            </filter>
          </defs>
          <path
            ref={cordRef}
            d={INITIAL_PATH}
            stroke="var(--pullcord-ink, rgba(127, 127, 127, 0.45))"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          <g ref={groupRef}>
            <g filter={`url(#${knobShadowId})`}>
              <circle
                cx={ANCHOR_X}
                cy={REST_Y}
                r={KNOB_R}
                fill={`url(#${knobGradId})`}
                stroke="rgba(0,0,0,0.10)"
                strokeWidth={0.5}
              />
            </g>
          </g>
        </svg>
        <motion.button
          ref={knobRef}
          type="button"
          className="pullcord-knob"
          aria-label={ariaLabel}
          aria-pressed={pulled}
          title={ariaLabel}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
          onClick={onClick}
          onKeyDown={onKeyDown}
          style={{
            position: "absolute",
            left: PAD + ANCHOR_X - HIT / 2,
            top: REST_Y - HIT / 2,
            width: HIT,
            height: HIT,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "grab",
            touchAction: "none",
            pointerEvents: "auto",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        />
      </div>
    </div>
  );
}
