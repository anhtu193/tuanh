"use client";

import type { Project } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectDashboard({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
    setPending(true);
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
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-foreground/60 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          Logout
        </button>
      </div>

      <div>
        <Link
          href="/add-project"
          className="inline-flex rounded-md border border-foreground/20 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          + Add project
        </Link>
      </div>

      {error ? <p className="text-sm text-foreground/70">{error}</p> : null}

      {projects.length === 0 ? (
        <p className="text-sm text-foreground/60">No projects yet.</p>
      ) : (
        <ul className="flex flex-col">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex gap-3 border-t border-foreground/10 py-3"
            >
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded border border-foreground/10 bg-foreground/5">
                {project.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{project.title}</p>
                <p className="truncate text-xs text-foreground/55">
                  {project.technologies.join(" · ")}
                </p>
                {confirmId === project.id ? (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    Delete this project?
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(project.id)}
                      className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="text-foreground/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                    >
                      Cancel
                    </button>
                  </p>
                ) : (
                  <div className="mt-2 flex gap-3 text-xs">
                    <Link
                      href={`/add-project?id=${project.id}`}
                      className="text-foreground/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmId(project.id)}
                      className="text-foreground/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
