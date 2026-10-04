"use client";

import Hologram from "@/components/Hologram";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

const CARD_WIDTH = 248;
const PEEK = 6;

const hidden = { x: -(CARD_WIDTH - PEEK), rotate: 4 };
const shown = { x: 12, rotate: 0 };

export default function HologramPeek() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;

  return (
    <motion.aside
      className="holo-peek"
      aria-label="Pachirisu holographic card"
      tabIndex={0}
      initial={false}
      animate={open ? shown : hidden}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 220, damping: 26, mass: 0.9 }
      }
      style={{
        transformOrigin: "0% 60%",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => {
        setOpen(false);
        setInteractive(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => {
        setOpen(false);
        setInteractive(false);
      }}
      onAnimationComplete={() => {
        setInteractive(openRef.current);
      }}
    >
      <Hologram
        src="/cards/pachirisu.png"
        depth="/cards/pachirisu-depth.jpg"
        width={CARD_WIDTH}
        aspect="734 / 1024"
        radius={14}
        pattern="rainbow"
        tint="#7fe0ff"
        foil={0.26}
        glitter={0.26}
        glare={0.24}
        shine={0.55}
        particles="motes"
        interactive={interactive}
      />
    </motion.aside>
  );
}
