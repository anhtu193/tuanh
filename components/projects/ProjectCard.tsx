"use client";

import type { Project } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

const VISIBLE_TAGS = 5;

function projectHref(project: Project) {
  return project.projectUrl || project.githubUrl;
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

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-foreground/10 bg-background/40 transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-40"
      }`}
    >
      <div className="relative aspect-video bg-foreground/4">
        {!project.imageUrl || failed ? (
          <div className="absolute inset-0" aria-hidden="true" />
        ) : href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${project.title}`}
            className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground/40"
          >
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 28rem"
              className="object-cover"
              draggable={false}
              onError={() => setFailed(true)}
            />
          </a>
        ) : (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 28rem"
            className="object-cover"
            draggable={false}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-fit max-w-full items-baseline gap-1.5 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            <h3 className="text-lg font-medium tracking-tight underline-offset-4 group-hover:underline">
              {project.title}
            </h3>
            <span aria-hidden="true" className="text-sm text-muted">
              ↗
            </span>
          </a>
        ) : (
          <h3 className="text-lg font-medium tracking-tight">{project.title}</h3>
        )}
        <p className="line-clamp-3 text-base leading-7 text-foreground/70">
          {project.description}
        </p>
        {tags.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-foreground/10 px-2 py-0.5 text-[11px] text-muted"
              >
                {tag}
              </li>
            ))}
            {extra > 0 ? (
              <li className="rounded-full border border-foreground/10 px-2 py-0.5 text-[11px] text-muted/80">
                +{extra}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
