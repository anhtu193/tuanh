"use client";

/**
 * Shallow circular coverflow.
 * Drag, snap, and depth fade follow React Bits Circular Carousel
 * (MIT, https://github.com/DavidHDev/react-bits) — tuned to a 3-card
 * window so project text stays readable.
 */

import ProjectCard from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/types";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const DRAG_THRESHOLD = 40;
const DRAG_START = 6;
const VELOCITY_THRESHOLD = 500;
const SPRING = { type: "spring" as const, stiffness: 320, damping: 34 };
/**
 * Vertical room under the card for box-shadow. Needed inside `.carousel-stage`
 * because `perspective` clips 3D-transformed descendants to the stage box.
 */
const SHADOW_ROOM = 88;
/** Horizontal room so mobile overflow clip does not square-cut the card shadow. */
const SHADOW_X = 40;

function subscribeMedia(query: string, onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function mediaMatches(query: string) {
  return window.matchMedia(query).matches;
}

function mod(value: number, count: number) {
  return ((value % count) + count) % count;
}

function virtualIndices(count: number) {
  if (count <= 1) return [0];
  const indices: number[] = [];
  for (let index = -count - 2; index <= count + 2; index += 1) {
    indices.push(index);
  }
  return indices;
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M14.5 6.5 8.5 12l6 5.5" : "M9.5 6.5 15.5 12l-6 5.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DragHint() {
  return (
    <div
      className="pointer-events-none absolute right-[6%] top-0 z-10 hidden translate-y-[-120%] items-end gap-1 text-[#8b8680] md:flex dark:text-[#9a9590]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 48"
        className="h-5 w-7 shrink-0 overflow-visible"
        fill="none"
      >
        <path
          d="M56 8C40 10 28 20 16 36"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M32 30L14 38L22 18"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mb-1.5 font-script text-right text-[1.55rem] italic leading-none">
        drag / browse
      </p>
    </div>
  );
}

function CoverSlide({
  virtualIndex,
  project,
  cursor,
  strideMv,
  flatMv,
  mobileMv,
  active,
  cardWidth,
  onHeight,
  mobile,
}: {
  virtualIndex: number;
  project: Project;
  cursor: MotionValue<number>;
  strideMv: MotionValue<number>;
  flatMv: MotionValue<number>;
  mobileMv: MotionValue<number>;
  active: boolean;
  cardWidth: number;
  onHeight: (virtualIndex: number, height: number) => void;
  mobile: boolean;
}) {
  const x = useTransform([cursor, strideMv], (latest) => {
    const [value, stride] = latest as number[];
    return (virtualIndex - value) * stride;
  });
  const rotateY = useTransform([cursor, flatMv, mobileMv], (latest) => {
    const [value, flat, mobile] = latest as number[];
    if (flat > 0.5 || mobile > 0.5) return 0;
    return (virtualIndex - value) * 20;
  });
  const scale = useTransform([cursor, flatMv, mobileMv], (latest) => {
    const [value, flat, mobile] = latest as number[];
    if (flat > 0.5 || mobile > 0.5) return 1;
    const distance = Math.min(Math.abs(virtualIndex - value), 1);
    return 1 - distance * 0.08;
  });
  const opacity = useTransform([cursor, mobileMv], (latest) => {
    const [value, mobile] = latest as number[];
    const distance = Math.abs(virtualIndex - value);
    // Fade as soon as the slide leaves center. A hard cutoff at 1 kept the
    // outgoing card fully visible for the whole spring, then popped it off.
    if (mobile > 0.5) return Math.max(0, 1 - distance);
    if (distance >= 1.35) return 0;
    if (distance >= 1) return 0.55 * (1 - (distance - 1) / 0.35);
    return 1 - distance * 0.45;
  });
  const zIndex = useTransform(cursor, (value) => {
    return 20 - Math.round(Math.abs(virtualIndex - value) * 6);
  });
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const report = () => onHeight(virtualIndex, node.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onHeight, virtualIndex, cardWidth]);

  return (
    <motion.div
      className="absolute"
      style={{
        top: mobile ? 20 : 12,
        width: cardWidth,
        left: `calc(50% - ${cardWidth / 2}px)`,
        x,
        rotateY,
        scale,
        opacity,
        zIndex,
        pointerEvents: active ? "auto" : "none",
      }}
      aria-hidden={!active}
      inert={!active}
    >
      <div ref={nodeRef}>
        <ProjectCard project={project} active={active} />
      </div>
    </motion.div>
  );
}

export default function ProjectsCarousel({ projects }: { projects: Project[] }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [center, setCenter] = useState(0);
  const wide = useSyncExternalStore(
    (onChange) => subscribeMedia("(min-width: 768px)", onChange),
    () => mediaMatches("(min-width: 768px)"),
    () => false,
  );
  const reduceMotion = useSyncExternalStore(
    (onChange) => subscribeMedia("(prefers-reduced-motion: reduce)", onChange),
    () => mediaMatches("(prefers-reduced-motion: reduce)"),
    () => false,
  );

  const count = projects.length;
  const mobile = !wide;
  const flat = mobile || reduceMotion;
  const cardWidth =
    containerWidth === 0
      ? 0
      : mobile
        ? Math.max(0, containerWidth - 112)
        : Math.min(340, Math.max(220, Math.round(containerWidth * 0.36)));
  const stride = mobile ? cardWidth : cardWidth * (reduceMotion ? 0.86 : 0.78);

  const cursor = useMotionValue(0);
  const strideMv = useMotionValue(stride);
  const flatMv = useMotionValue(flat ? 1 : 0);
  const mobileMv = useMotionValue(mobile ? 1 : 0);
  const countRef = useRef(count);
  const reduceRef = useRef(reduceMotion);
  const originRef = useRef(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const tracking = useRef(false);
  const moved = useRef(false);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const heightsRef = useRef(new Map<number, number>());
  const animating = useRef(false);

  countRef.current = count;
  reduceRef.current = reduceMotion;

  const slides = useMemo(() => virtualIndices(count), [count]);

  const normalizeCursor = useCallback(() => {
    const total = countRef.current;
    if (total <= 1) return;
    const value = cursor.get();
    // Stay inside the rendered clones. Wrapping earlier (for example 1 → -1
    // with 2 projects) swaps the centered DOM node and flashes the card.
    if (Math.abs(value) < total + 1) return;
    const shift = Math.trunc(value / total) * total;
    if (shift !== 0) cursor.set(value - shift);
  }, [cursor]);

  const snapTo = useCallback(
    (target: number) => {
      animRef.current?.stop();
      if (reduceRef.current) {
        cursor.set(target);
        normalizeCursor();
        animating.current = false;
        return;
      }
      animating.current = true;
      animRef.current = animate(cursor, target, {
        ...SPRING,
        onComplete: () => {
          animating.current = false;
          normalizeCursor();
        },
      });
    },
    [cursor, normalizeCursor],
  );

  const step = useCallback(
    (delta: number) => {
      if (countRef.current < 2 || animating.current) return;
      normalizeCursor();
      snapTo(Math.round(cursor.get()) + delta);
    },
    [cursor, normalizeCursor, snapTo],
  );

  useEffect(() => {
    strideMv.set(stride);
    flatMv.set(flat ? 1 : 0);
    mobileMv.set(mobile ? 1 : 0);
  }, [flat, flatMv, mobile, mobileMv, stride, strideMv]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return cursor.on("change", (value) => {
      const next = Math.round(value);
      setCenter((current) => (current === next ? current : next));
    });
  }, [cursor]);

  const onHeight = useCallback((virtualIndex: number, height: number) => {
    if (height <= 0) return;
    if (heightsRef.current.get(virtualIndex) === height) return;
    heightsRef.current.set(virtualIndex, height);
    const max = Math.max(...heightsRef.current.values());
    setCardHeight((current) => (current === max ? current : max));
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (count < 2 || event.button !== 0) return;
    animRef.current?.stop();
    animating.current = false;
    normalizeCursor();
    tracking.current = true;
    moved.current = false;
    pointerId.current = event.pointerId;
    originRef.current = cursor.get();
    startX.current = event.clientX;
    lastX.current = event.clientX;
    lastT.current = performance.now();
    velocity.current = 0;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!tracking.current || event.pointerId !== pointerId.current) return;
    const dx = event.clientX - startX.current;
    if (!moved.current) {
      const startAt = mobileMv.get() > 0.5 ? 16 : DRAG_START;
      if (Math.abs(dx) < startAt) return;
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) {
      velocity.current = ((event.clientX - lastX.current) / dt) * 1000;
    }
    lastX.current = event.clientX;
    lastT.current = now;
    const width = strideMv.get() || 1;
    cursor.set(originRef.current - dx / width);
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!tracking.current || event.pointerId !== pointerId.current) return;
    tracking.current = false;
    pointerId.current = null;
    if (!moved.current) return;
    const dx = event.clientX - startX.current;
    const speed = velocity.current;
    let delta = 0;
    if (dx < -DRAG_THRESHOLD || speed < -VELOCITY_THRESHOLD) delta = 1;
    else if (dx > DRAG_THRESHOLD || speed > VELOCITY_THRESHOLD) delta = -1;
    snapTo(Math.round(originRef.current) + delta);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!moved.current) return;
    event.preventDefault();
    event.stopPropagation();
    moved.current = false;
  };

  const activeProject = count === 0 ? 0 : mod(center, count);
  const stagePadTop = mobile ? 20 : 12;
  // Shadow must sit inside the stage box — perspective clips anything past it.
  const stageHeight =
    cardHeight > 0 ? cardHeight + stagePadTop + SHADOW_ROOM : 480;

  return (
    <div
      ref={frameRef}
      className="relative mt-5 max-md:-mx-4 max-md:px-4 sm:max-md:-mx-6 sm:max-md:px-6"
      // style={{ overflowX: "clip" }}
    >
      {count > 1 ? <DragHint /> : null}
      <div className="relative">
        <div
          className={`carousel-stage relative outline-none select-none ${
            count > 1 ? "cursor-grab active:cursor-grabbing" : ""
          } focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40`}
          style={{
            height: stageHeight,
            perspective: flat ? undefined : 2000,
            ...(mobile && cardWidth > 0
              ? {
                  width: cardWidth + SHADOW_X * 2,
                  marginLeft: "auto",
                  marginRight: "auto",
                  overflow: "hidden" as const,
                }
              : {}),
          }}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Projects"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onClickCapture={onClickCapture}
        >
          {cardWidth > 0
            ? slides.map((virtualIndex) => {
                const project = projects[mod(virtualIndex, count)];
                if (!project) return null;
                return (
                  <CoverSlide
                    key={virtualIndex}
                    virtualIndex={virtualIndex}
                    project={project}
                    cursor={cursor}
                    strideMv={strideMv}
                    flatMv={flatMv}
                    mobileMv={mobileMv}
                    active={virtualIndex === center}
                    cardWidth={cardWidth}
                    onHeight={onHeight}
                    mobile={mobile}
                  />
                );
              })
            : null}
        </div>
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous project"
              className="absolute z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white text-foreground/80 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 dark:border-white/10 dark:bg-[#2a2a2a] dark:shadow-[0_10px_28px_rgba(0,0,0,0.65)]"
              style={{
                left: mobile
                  ? 12
                  : `max(0px, calc(50% - ${stride + cardWidth / 2 + 20}px))`,
                // Center on the card, not the shadow room under it.
                top: cardHeight > 0 ? stagePadTop + cardHeight / 2 : "50%",
              }}
              onClick={() => step(-1)}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              aria-label="Next project"
              className="absolute z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white text-foreground/80 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 dark:border-white/10 dark:bg-[#2a2a2a] dark:shadow-[0_10px_28px_rgba(0,0,0,0.65)]"
              style={{
                right: mobile
                  ? 12
                  : `max(0px, calc(50% - ${stride + cardWidth / 2 + 20}px))`,
                top: cardHeight > 0 ? stagePadTop + cardHeight / 2 : "50%",
              }}
              onClick={() => step(1)}
            >
              <Chevron dir="right" />
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {projects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              aria-label={`Go to ${project.title}`}
              aria-current={activeProject === index ? "true" : undefined}
              className={`h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 ${
                activeProject === index
                  ? "w-4 bg-foreground/55"
                  : "w-1.5 bg-foreground/18"
              }`}
              onClick={() => {
                const current = mod(Math.round(cursor.get()), count);
                let delta = index - current;
                if (delta > count / 2) delta -= count;
                if (delta < -count / 2) delta += count;
                step(delta);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
