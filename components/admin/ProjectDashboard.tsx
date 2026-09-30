"use client";

import type { Project } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const actionClass =
  "text-sm text-foreground/55 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 disabled:opacity-50";

export default function ProjectDashboard({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  async function refreshProjects() {
    const response = await fetch("/api/projects");
    if (!response.ok) return;
    const payload = (await response.json()) as { projects: Project[] };
    setProjects(payload.projects);
    router.refresh();
  }

  async function remove(id: string) {
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Could not delete project");
        return;
      }
      setConfirmId(null);
      await refreshProjects();
    } catch {
      setError("Could not delete project");
    } finally {
      setPendingId(null);
    }
  }

  async function duplicate(id: string) {
    setPendingId(id);
    setError("");
    setConfirmId(null);
    try {
      const response = await fetch(`/api/projects/${id}/duplicate`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Could not duplicate project");
        return;
      }
      await refreshProjects();
    } catch {
      setError("Could not duplicate project");
    } finally {
      setPendingId(null);
    }
  }

  async function toggleVisibility(project: Project) {
    setPendingId(project.id);
    setError("");
    setConfirmId(null);
    const nextVisible = !project.visible;
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, visible: nextVisible } : item,
      ),
    );
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setProjects((current) =>
          current.map((item) =>
            item.id === project.id
              ? { ...item, visible: project.visible }
              : item,
          ),
        );
        setError(payload?.error ?? "Could not update visibility");
        return;
      }
      router.refresh();
    } catch {
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? { ...item, visible: project.visible } : item,
        ),
      );
      setError("Could not update visibility");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-foreground/55">
            {projects.length === 0
              ? "Nothing here yet"
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button type="button" onClick={logout} className={actionClass}>
          Logout
        </button>
      </header>

      <Link
        href="/add-project"
        className="inline-flex w-fit items-center rounded-lg border border-foreground/15 px-4 py-2 text-sm transition-colors hover:border-foreground/30 hover:bg-foreground/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
      >
        + Add project
      </Link>

      {error ? (
        <p className="rounded-lg border border-foreground/10 bg-foreground/2 px-3 py-2 text-sm text-foreground/70">
          {error}
        </p>
      ) : null}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/15 px-5 py-10 text-center">
          <p className="text-sm text-foreground/60">No projects yet.</p>
          <Link
            href="/add-project"
            className="mt-3 inline-block text-sm text-foreground/70 underline-offset-4 hover:underline"
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => {
            const busy = pendingId === project.id;
            return (
              <li
                key={project.id}
                className={`rounded-xl border border-foreground/10 bg-background/50 p-3 transition-colors hover:border-foreground/20 ${
                  project.visible ? "" : "opacity-60"
                }`}
              >
                <div className="flex gap-3.5">
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/3 sm:w-32">
                    {project.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 self-center">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[0.95rem] font-medium tracking-tight">
                        {project.title}
                      </p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide ${
                          project.visible
                            ? "bg-foreground/8 text-foreground/60"
                            : "bg-foreground/5 text-foreground/40"
                        }`}
                      >
                        {project.visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    {project.technologies.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-foreground/50">
                        {project.technologies.join(" · ")}
                      </p>
                    ) : null}

                    {confirmId === project.id ? (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="text-foreground/60">Delete this project?</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove(project.id)}
                          className={actionClass}
                        >
                          {busy ? "Deleting..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmId(null)}
                          className={actionClass}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/add-project?id=${project.id}`}
                          className={actionClass}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleVisibility(project)}
                          className={actionClass}
                        >
                          {project.visible ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => duplicate(project.id)}
                          className={actionClass}
                        >
                          {busy ? "Working..." : "Duplicate"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmId(project.id)}
                          className={actionClass}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
