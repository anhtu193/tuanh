"use client";

import type { Project } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

const VISIBLE_TAGS = 5;

function projectHref(project: Project) {
  return project.projectUrl || project.githubUrl;
}

function GithubIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
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
      className={`project-card flex h-full flex-col rounded-[1.35rem] border border-black/5 bg-white p-2.5 dark:border-white/10 dark:bg-[#222] ${
        active ? "project-card--active" : ""
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
        {tags.length > 0 || project.githubUrl ? (
          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            {tags.length > 0 ? (
              <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
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
            ) : (
              <span />
            )}
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${project.title} on GitHub`}
                className="mb-px ml-auto inline-flex shrink-0 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
              >
                <GithubIcon />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
