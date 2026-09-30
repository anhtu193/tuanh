"use client";

import { useState } from "react";

const fieldClass =
  "min-w-28 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-foreground/35";

export default function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const next = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    const merged = [...value];
    for (const tag of next) {
      if (!merged.some((item) => item.toLowerCase() === tag.toLowerCase())) {
        merged.push(tag);
      }
    }
    onChange(merged);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-foreground/15 px-2 py-1.5 focus-within:border-foreground/40">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded border border-foreground/15 px-1.5 py-0.5 text-xs text-foreground/70"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            className="text-foreground/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
            onClick={() => onChange(value.filter((item) => item !== tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className={fieldClass}
        value={draft}
        placeholder={value.length === 0 ? "Next.js, TypeScript" : ""}
        aria-label="Technologies"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft);
          }
          if (event.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => {
          if (draft.trim()) add(draft);
        }}
      />
    </div>
  );
}
