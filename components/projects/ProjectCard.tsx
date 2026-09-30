"use client";

import type { Project } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

const VISIBLE_TAGS = 5;

function projectHref(project: Project) {
  return project.projectUrl || project.githubUrl;
}

function ExternalIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-muted"
    >
      <path
        d="M14 5h5v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 5 10 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectCard({
  project,
  active = true,
}: {
  project: Project;
  active?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const href = projectHref(project);
  const extra = Math.max(0, project.technologies.length - VISIBLE_TAGS);
  const tags = project.technologies.slice(0, VISIBLE_TAGS);
  const showImage = Boolean(project.imageUrl) && !failed;

  return (
    <article
      className={`flex h-full flex-col rounded-[1.35rem] border border-black/5 bg-white p-2.5 dark:border-white/10 dark:bg-[#222] ${
        active
          ? "shadow-[0_24px_60px_-28px_rgba(40,30,20,0.55)] dark:shadow-[0_22px_50px_-24px_rgba(0,0,0,0.75)]"
          : "shadow-[0_10px_28px_-22px_rgba(40,30,20,0.35)] dark:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.55)]"
      }`}
    >
      <div className="relative aspect-16/10 overflow-hidden rounded-[0.95rem] bg-foreground/5">
        {showImage && href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${project.title}`}
            className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground/40"
          >
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 340px"
              className="object-cover"
              priority={active}
              draggable={false}
              onError={() => setFailed(true)}
            />
          </a>
        ) : null}
        {showImage && !href ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 340px"
            className="object-cover"
            priority={active}
            draggable={false}
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3 pt-3.5">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start justify-between gap-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            <h3 className="text-[15px] font-medium tracking-tight underline-offset-4 group-hover:underline">
              {project.title}
            </h3>
            <ExternalIcon />
          </a>
        ) : (
          <h3 className="text-[15px] font-medium tracking-tight">
            {project.title}
          </h3>
        )}
        <p className="line-clamp-3 text-sm leading-6 text-foreground/70">
          {project.description}
        </p>
        {tags.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-foreground/10 px-2.5 py-0.5 text-[11px] text-muted"
              >
                {tag}
              </li>
            ))}
            {extra > 0 ? (
              <li className="rounded-full border border-foreground/10 px-2.5 py-0.5 text-[11px] text-muted/80">
                +{extra}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
