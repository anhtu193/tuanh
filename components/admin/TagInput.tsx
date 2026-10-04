"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const fieldClass =
  "min-w-28 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-foreground/35";

function reorder(list: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

  function indexFromPoint(clientX: number, clientY: number) {
    for (let i = 0; i < tagRefs.current.length; i += 1) {
      const el = tagRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return i;
      }
    }
    return null;
  }

  function endDrag() {
    dragIndexRef.current = null;
    pointerIdRef.current = null;
    setDraggingIndex(null);
  }

  function onTagPointerDown(
    event: ReactPointerEvent<HTMLSpanElement>,
    index: number,
  ) {
    if (event.button !== 0) return;
    // Let the remove button handle its own click.
    if ((event.target as HTMLElement).closest("button")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    dragIndexRef.current = index;
    setDraggingIndex(index);
  }

  function onTagPointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    const from = dragIndexRef.current;
    if (from == null) return;

    const over = indexFromPoint(event.clientX, event.clientY);
    if (over == null || over === from) return;

    onChange(reorder(value, from, over));
    dragIndexRef.current = over;
    setDraggingIndex(over);
  }

  function onTagPointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    endDrag();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-foreground/15 px-2 py-1.5 focus-within:border-foreground/40">
      {value.map((tag, index) => (
        <span
          key={tag}
          ref={(el) => {
            tagRefs.current[index] = el;
          }}
          onPointerDown={(event) => onTagPointerDown(event, index)}
          onPointerMove={onTagPointerMove}
          onPointerUp={onTagPointerUp}
          onPointerCancel={onTagPointerUp}
          className={`inline-flex touch-none select-none items-center gap-1 rounded border border-foreground/15 px-1.5 py-0.5 text-xs text-foreground/70 ${
            draggingIndex === index
              ? "cursor-grabbing bg-foreground/8 opacity-80"
              : "cursor-grab"
          }`}
          title="Drag to reorder"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            className="cursor-pointer text-foreground/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
            onPointerDown={(event) => event.stopPropagation()}
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
