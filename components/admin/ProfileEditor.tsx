"use client";

import StackIconInput from "@/components/admin/StackIconInput";
import type { FindMeLink, SiteProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const fieldClass =
  "w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

const buttonClass =
  "inline-flex w-fit items-center rounded-lg border border-foreground/15 px-4 py-2 text-sm transition-colors hover:border-foreground/30 hover:bg-foreground/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 disabled:opacity-50";

const linkActionClass =
  "text-sm text-foreground/55 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 disabled:opacity-50";

type EditableLink = FindMeLink & { id: string };

function withIds(links: FindMeLink[]): EditableLink[] {
  return links.map((link) => ({
    ...link,
    id: crypto.randomUUID(),
  }));
}

function reorderLinks(list: EditableLink[], from: number, to: number) {
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

export default function ProfileEditor({
  initialProfile,
}: {
  initialProfile: SiteProfile;
}) {
  const router = useRouter();
  const [stack, setStack] = useState(initialProfile.stack);
  const [links, setLinks] = useState<EditableLink[]>(() =>
    withIds(initialProfile.links),
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  function updateLink(index: number, patch: Partial<FindMeLink>) {
    setLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index));
  }

  function addLink() {
    setLinks((current) => [
      ...current,
      { id: crypto.randomUUID(), label: "", url: "" },
    ]);
  }

  function indexFromPoint(clientY: number) {
    for (let i = 0; i < rowRefs.current.length; i += 1) {
      const el = rowRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
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

  function onHandlePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    dragIndexRef.current = index;
    setDraggingIndex(index);
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    const from = dragIndexRef.current;
    if (from == null) return;

    const over = indexFromPoint(event.clientY);
    if (over == null || over === from) return;

    setLinks((current) => reorderLinks(current, from, over));
    dragIndexRef.current = over;
    setDraggingIndex(over);
  }

  function onHandlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    endDrag();
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payloadLinks = links.map(({ label, url }) => ({ label, url }));
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack, links: payloadLinks }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        profile?: SiteProfile;
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? "Could not save profile");
        return;
      }
      if (payload?.profile) {
        setStack(payload.profile.stack);
        setLinks(withIds(payload.profile.links));
      }
      setMessage("Saved");
      router.refresh();
    } catch {
      setError("Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-foreground/55">
          Stack and find me links on the homepage
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-foreground/70">Stack</label>
        <StackIconInput value={stack} onChange={setStack} />
        <p className="text-xs text-foreground/45">
          Search Simple Icons from react-icons, then drag to reorder
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-foreground/70">Find me</label>
          <button type="button" onClick={addLink} className={linkActionClass}>
            + Add link
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-foreground/50">No links yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {links.map((link, index) => (
              <li
                key={link.id}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                className={`flex flex-col gap-2 sm:flex-row sm:items-center ${
                  draggingIndex === index ? "opacity-70" : ""
                }`}
              >
                <button
                  type="button"
                  aria-label={`Drag to reorder link ${index + 1}`}
                  title="Drag to reorder"
                  className="inline-flex h-9 w-8 shrink-0 touch-none select-none items-center justify-center self-start rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/70 sm:self-center cursor-grab active:cursor-grabbing"
                  onPointerDown={(event) => onHandlePointerDown(event, index)}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onHandlePointerUp}
                  onPointerCancel={onHandlePointerUp}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 16"
                    className="h-4 w-3 fill-current"
                  >
                    <circle cx="3" cy="3" r="1.4" />
                    <circle cx="9" cy="3" r="1.4" />
                    <circle cx="3" cy="8" r="1.4" />
                    <circle cx="9" cy="8" r="1.4" />
                    <circle cx="3" cy="13" r="1.4" />
                    <circle cx="9" cy="13" r="1.4" />
                  </svg>
                </button>
                <input
                  className={`${fieldClass} sm:w-32 sm:shrink-0`}
                  value={link.label}
                  placeholder="label"
                  aria-label={`Link ${index + 1} label`}
                  onChange={(event) =>
                    updateLink(index, { label: event.target.value })
                  }
                />
                <input
                  className={fieldClass}
                  value={link.url}
                  placeholder="https://… or mailto:…"
                  aria-label={`Link ${index + 1} URL`}
                  onChange={(event) =>
                    updateLink(index, { url: event.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className={`${linkActionClass} self-start sm:self-center`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="rounded-lg border border-foreground/10 bg-foreground/2 px-3 py-2 text-sm text-foreground/70">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-foreground/55">{message}</p>
      ) : null}

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className={buttonClass}
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </section>
  );
}
