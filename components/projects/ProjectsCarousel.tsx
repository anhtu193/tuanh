"use client";

import ProjectCard from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/types";
import {
  motion,
  useMotionValue,
  type PanInfo,
} from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";

function subscribeMedia(query: string, onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function mediaMatches(query: string) {
  return window.matchMedia(query).matches;
}

const GAP = 18;
const DRAG_BUFFER = 40;
const VELOCITY_THRESHOLD = 500;
const AUTOPLAY_MS = 8000;
const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

export default function ProjectsCarousel({ projects }: { projects: Project[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
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
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(() => (projects.length > 1 ? 1 : 0));
  const [jumping, setJumping] = useState(false);
  const [animating, setAnimating] = useState(false);
  const x = useMotionValue(0);

  const loop = projects.length > 1;
  const items = useMemo(() => {
    if (!loop) return projects;
    return [projects[projects.length - 1], ...projects, projects[0]];
  }, [loop, projects]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const itemWidth = width === 0 ? 0 : wide ? Math.round(width * 0.72) : width;
  const stride = itemWidth + GAP;
  const centerPad = width === 0 ? 0 : Math.max(0, (width - itemWidth) / 2);
  const activeIndex =
    projects.length === 0
      ? 0
      : loop
        ? (position - 1 + projects.length) % projects.length
        : Math.min(position, projects.length - 1);

  useEffect(() => {
    if (!loop || projects.length < 2 || paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setPosition((current) => current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [loop, paused, projects.length, reduceMotion]);

  const finishJump = (target: number) => {
    setJumping(true);
    setPosition(target);
    x.set(centerPad - target * stride);
    requestAnimationFrame(() => {
      setJumping(false);
      setAnimating(false);
    });
  };

  const onAnimationComplete = () => {
    if (!loop || items.length <= 1) {
      setAnimating(false);
      return;
    }
    if (position === items.length - 1) {
      finishJump(1);
      return;
    }
    if (position === 0) {
      finishJump(projects.length);
      return;
    }
    setAnimating(false);
  };

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    const direction =
      info.offset.x < -DRAG_BUFFER || info.velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : info.offset.x > DRAG_BUFFER || info.velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;
    if (direction === 0) return;
    setPosition((current) => {
      const next = current + direction;
      return Math.max(0, Math.min(next, items.length - 1));
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (projects.length < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((current) => Math.min(current + 1, items.length - 1));
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((current) => Math.max(current - 1, 0));
    }
  };

  const transition = jumping || reduceMotion ? { duration: 0 } : SPRING;
  const targetX = centerPad - position * stride;

  return (
    <div
      className="mt-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        ref={containerRef}
        className="carousel-stage cursor-grab overflow-hidden outline-none active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/40"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Projects"
        onKeyDown={onKeyDown}
      >
        {itemWidth === 0 ? (
          <div className="w-full md:w-[72%]">
            <ProjectCard project={projects[0]} />
          </div>
        ) : (
          <motion.div
            className="flex touch-pan-y"
            drag={projects.length > 1 && !animating ? "x" : false}
            dragConstraints={
              loop
                ? undefined
                : {
                    left: centerPad - stride * Math.max(items.length - 1, 0),
                    right: centerPad,
                  }
            }
            dragElastic={0.12}
            style={{ x, gap: GAP }}
            animate={{ x: targetX }}
            transition={transition}
            onDragEnd={onDragEnd}
            onAnimationStart={() => setAnimating(true)}
            onAnimationComplete={onAnimationComplete}
          >
            {items.map((project, index) => (
              <div
                key={`${project.id}-${index}`}
                className="shrink-0"
                style={{ width: itemWidth }}
                aria-hidden={index !== position}
              >
                <ProjectCard project={project} active={index === position} />
              </div>
            ))}
          </motion.div>
        )}
      </div>
      {projects.length > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {projects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              aria-label={`Go to ${project.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 ${
                activeIndex === index
                  ? "w-4 bg-foreground/55"
                  : "w-1.5 bg-foreground/18"
              }`}
              onClick={() => setPosition(loop ? index + 1 : index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
