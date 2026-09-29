"use client";

import { useCallback } from "react";
import { PullCord } from "@/components/PullCord";

const THEME_KEY = "theme";

function isDarkClass() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    /* ignore quota / private mode */
  }
}

export default function PullCordToggle() {
  const onPull = useCallback(() => {
    applyTheme(!isDarkClass());
  }, []);

  return (
    <>
      <PullCord onPull={onPull} ariaLabel="Toggle theme" />
      <div className="cord-hint font-script" aria-hidden="true">
        <p>
          pull the
          <br />
          cord!
        </p>
        <svg viewBox="0 0 64 48" fill="none">
          <path
            d="M4 38C16 38 26 32 36 22C44 14 50 9 60 12"
            stroke="currentColor"
            strokeWidth="5.25"
            strokeLinecap="round"
          />
          <path
            d="M46 5L60 12L48 26"
            stroke="currentColor"
            strokeWidth="5.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}
