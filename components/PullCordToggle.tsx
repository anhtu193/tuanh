"use client";

import { useCallback, useEffect, useState } from "react";
import { PullCord } from "pullcord";

const THEME_KEY = "theme";
const HINT_KEY = "pullcord-hint-dismissed";

function isDarkClass() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  const commit = () => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* ignore quota / private mode */
    }
  };

  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(commit);
    return;
  }

  commit();
}

export default function PullCordToggle() {
  const [dark, setDark] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setDark(isDarkClass());
    try {
      setShowHint(sessionStorage.getItem(HINT_KEY) !== "1");
    } catch {
      setShowHint(true);
    }
  }, []);

  const onPull = useCallback(() => {
    const next = !isDarkClass();
    applyTheme(next);
    setDark(next);
    try {
      sessionStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowHint(false);
  }, []);

  return (
    <>
      <PullCord
        onPull={onPull}
        pulled={!dark}
        ariaLabel="Toggle theme"
      />
      {showHint ? (
        <div className="cord-hint font-script" aria-hidden="true">
          <p className="text-right text-[1.35rem] leading-[1.05] italic">
            pull the
            <br />
            cord!
          </p>
          <svg viewBox="0 0 42 28" fill="none" aria-hidden="true">
            <path
              d="M4 22C10 22 16 20 22 14C27 9 31 6 38 7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M31 3.5L38.5 7L32 13"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </>
  );
}
