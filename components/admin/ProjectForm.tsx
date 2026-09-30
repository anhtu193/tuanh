"use client";

import TagInput from "@/components/admin/TagInput";
import type { Project } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const fieldClass =
  "w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

type UploadState = "idle" | "uploading" | "success" | "failed";

type FormState = {
  title: string;
  description: string;
  projectUrl: string;
  githubUrl: string;
  technologies: string[];
  imageUrl: string;
  imagePublicId: string;
};

function formFromProject(project: Project | null): FormState {
  if (!project) {
    return {
      title: "",
      description: "",
      projectUrl: "",
      githubUrl: "",
      technologies: [],
      imageUrl: "",
      imagePublicId: "",
    };
  }
  return {
    title: project.title,
    description: project.description,
    projectUrl: project.projectUrl ?? "",
    githubUrl: project.githubUrl ?? "",
    technologies: project.technologies,
    imageUrl: project.imageUrl,
    imagePublicId: project.imagePublicId ?? "",
  };
}

export default function ProjectForm({
  project = null,
}: {
  project?: Project | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(project);
  const [form, setForm] = useState(() => formFromProject(project));
  const [previewUrl, setPreviewUrl] = useState(project?.imageUrl ?? "");
  const [uploadState, setUploadState] = useState<UploadState>(
    project?.imageUrl ? "success" : "idle",
  );
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  function goDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploadState("uploading");
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        publicId?: string;
        error?: string;
      } | null;
      if (!response.ok || !payload?.url || !payload.publicId) {
        setUploadState("failed");
        setUploadError(payload?.error ?? "Upload failed");
        return;
      }
      setForm((current) => ({
        ...current,
        imageUrl: payload.url ?? "",
        imagePublicId: payload.publicId ?? "",
      }));
      setPreviewUrl(payload.url);
      setUploadState("success");
    } catch {
      setUploadState("failed");
      setUploadError("Upload failed");
    } finally {
      URL.revokeObjectURL(localPreview);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadState === "uploading" || uploadState === "failed" || !form.imageUrl) {
      setFormError(
        uploadState === "failed"
          ? "Upload a cover image before saving"
          : "Add a cover image before saving",
      );
      return;
    }
    setPending(true);
    setFormError("");
    try {
      const response = await fetch(
        editing && project ? `/api/projects/${project.id}` : "/api/projects",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            projectUrl: form.projectUrl,
            githubUrl: form.githubUrl,
            technologies: form.technologies,
            imageUrl: form.imageUrl,
            imagePublicId: form.imagePublicId,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        setFormError(payload?.error ?? "Could not save project");
        return;
      }
      goDashboard();
    } catch {
      setFormError("Could not save project");
    } finally {
      setPending(false);
    }
  }

  const uploadLabel =
    uploadState === "uploading"
      ? "Uploading..."
      : uploadState === "success"
        ? "Upload successful"
        : uploadState === "failed"
          ? uploadError || "Upload failed"
          : "";

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {editing ? "Edit project" : "Add project"}
      </h1>
      <label className="flex flex-col gap-1.5 text-sm">
        Title
        <input
          className={fieldClass}
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Description
        <textarea
          className={`${fieldClass} min-h-24 resize-y`}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Project URL
        <input
          className={fieldClass}
          inputMode="url"
          value={form.projectUrl}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              projectUrl: event.target.value,
            }))
          }
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        GitHub URL
        <input
          className={fieldClass}
          inputMode="url"
          value={form.githubUrl}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              githubUrl: event.target.value,
            }))
          }
        />
      </label>
      <div className="flex flex-col gap-1.5 text-sm">
        Technologies
        <TagInput
          value={form.technologies}
          onChange={(technologies) =>
            setForm((current) => ({ ...current, technologies }))
          }
        />
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        Cover image
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-foreground/20 text-foreground/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          {previewUrl ? (
            // Preview can be a local blob or a Cloudinary URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-6 text-center leading-6">
              Click to upload
              <br />
              <span className="text-xs">JPG / PNG / WebP / AVIF</span>
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {uploadLabel ? (
          <p className="text-xs text-foreground/60">{uploadLabel}</p>
        ) : null}
      </div>
      {formError ? <p className="text-sm text-foreground/70">{formError}</p> : null}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={goDashboard}
          className="rounded-md px-3 py-2 text-sm text-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || uploadState === "uploading" || uploadState === "failed"}
          className="rounded-md border border-foreground/20 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save project"}
        </button>
      </div>
    </form>
  );
}
