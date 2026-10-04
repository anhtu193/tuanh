"use client";

import {
  getSimpleIcon,
  searchSimpleIcons,
  stackItemFromIconKey,
} from "@/lib/stack-icons";
import type { StackItem } from "@/lib/types";
import { useDeferredValue, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

function reorder(list: StackItem[], from: number, to: number) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function StackIconInput({
  value,
  onChange,
}: {
  value: StackItem[];
  onChange: (items: StackItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const results = useMemo(
    () => searchSimpleIcons(deferredQuery, 24),
    [deferredQuery],
  );

  const selected = useMemo(
    () => new Set(value.map((item) => item.icon)),
    [value],
  );

  function addIcon(key: string) {
    if (selected.has(key)) return;
    const item = stackItemFromIconKey(key);
    if (!item) return;
    onChange([...value, item]);
    setQuery("");
  }

  function indexFromPoint(clientX: number, clientY: number) {
    for (let i = 0; i < chipRefs.current.length; i += 1) {
      const el = chipRefs.current[i];
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

  function onChipPointerDown(
    event: ReactPointerEvent<HTMLSpanElement>,
    index: number,
  ) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    dragIndexRef.current = index;
    setDraggingIndex(index);
  }

  function onChipPointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    const from = dragIndexRef.current;
    if (from == null) return;
    const over = indexFromPoint(event.clientX, event.clientY);
    if (over == null || over === from) return;
    onChange(reorder(value, from, over));
    dragIndexRef.current = over;
    setDraggingIndex(over);
  }

  function onChipPointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    endDrag();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-foreground/15 px-2 py-1.5 focus-within:border-foreground/40">
        {value.map((item, index) => {
          const Icon = getSimpleIcon(item.icon);
          return (
            <span
              key={item.icon}
              ref={(el) => {
                chipRefs.current[index] = el;
              }}
              onPointerDown={(event) => onChipPointerDown(event, index)}
              onPointerMove={onChipPointerMove}
              onPointerUp={onChipPointerUp}
              onPointerCancel={onChipPointerUp}
              className={`inline-flex touch-none select-none items-center gap-1.5 rounded border border-foreground/15 px-1.5 py-0.5 text-xs text-foreground/70 ${
                draggingIndex === index
                  ? "cursor-grabbing bg-foreground/8 opacity-80"
                  : "cursor-grab"
              }`}
              title="Drag to reorder"
            >
              {Icon ? <Icon aria-hidden className="h-3.5 w-3.5" /> : null}
              <span>{item.title}</span>
              <button
                type="button"
                aria-label={`Remove ${item.title}`}
                className="cursor-pointer text-foreground/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() =>
                  onChange(value.filter((entry) => entry.icon !== item.icon))
                }
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          className="min-w-36 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-foreground/35"
          value={query}
          placeholder={value.length === 0 ? "Search icons (React, Next…)" : "Add more…"}
          aria-label="Search stack icons"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {deferredQuery.trim() ? (
        <ul className="max-h-56 overflow-auto rounded-md border border-foreground/15 bg-background">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-foreground/50">
              No icons found
            </li>
          ) : (
            results.map((result) => {
              const Icon = getSimpleIcon(result.key);
              const already = selected.has(result.key);
              return (
                <li key={result.key}>
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => addIcon(result.key)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/5 disabled:opacity-40"
                  >
                    {Icon ? (
                      <Icon aria-hidden className="h-4 w-4 shrink-0" />
                    ) : (
                      <span className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{result.title}</span>
                    <span className="shrink-0 text-xs text-foreground/40">
                      {already ? "Added" : result.key}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
