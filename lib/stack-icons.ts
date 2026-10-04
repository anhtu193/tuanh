import type { StackItem } from "@/lib/types";
import type { IconType } from "react-icons";
import * as SimpleIcons from "react-icons/si";

const ICON_MAP = SimpleIcons as unknown as Record<string, IconType>;

const TITLE_OVERRIDES: Record<string, string> = {
  SiNextdotjs: "Next.js",
  SiNodedotjs: "Node.js",
  SiTypescript: "TypeScript",
  SiJavascript: "JavaScript",
  SiTailwindcss: "Tailwind CSS",
  SiPostgresql: "PostgreSQL",
  SiMongodb: "MongoDB",
  SiGraphql: "GraphQL",
  SiGithub: "GitHub",
  SiGitlab: "GitLab",
  SiCss3: "CSS",
  SiHtml5: "HTML",
  SiAmazonaws: "AWS",
  SiGooglecloud: "Google Cloud",
  SiDotnet: ".NET",
  SiCplusplus: "C++",
  SiCsharp: "C#",
};

const HREF_OVERRIDES: Record<string, string> = {
  SiReact: "https://react.dev",
  SiNextdotjs: "https://nextjs.org",
  SiTypescript: "https://www.typescriptlang.org",
  SiJavascript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  SiTailwindcss: "https://tailwindcss.com",
  SiNodedotjs: "https://nodejs.org",
  SiExpress: "https://expressjs.com",
  SiFigma: "https://www.figma.com",
  SiPostgresql: "https://www.postgresql.org",
  SiMongodb: "https://www.mongodb.com",
  SiRedis: "https://redis.io",
  SiHtml5: "https://developer.mozilla.org/en-US/docs/Web/HTML",
  SiCss3: "https://developer.mozilla.org/en-US/docs/Web/CSS",
};

const LEGACY_NAME_TO_ICON: Record<string, string> = {
  typescript: "SiTypescript",
  react: "SiReact",
  "next.js": "SiNextdotjs",
  nextjs: "SiNextdotjs",
  next: "SiNextdotjs",
  tailwind: "SiTailwindcss",
  "tailwind css": "SiTailwindcss",
  "node.js": "SiNodedotjs",
  nodejs: "SiNodedotjs",
  node: "SiNodedotjs",
  figma: "SiFigma",
  javascript: "SiJavascript",
  "express.js": "SiExpress",
  express: "SiExpress",
  mongodb: "SiMongodb",
  postgresql: "SiPostgresql",
  postgres: "SiPostgresql",
  redis: "SiRedis",
  html: "SiHtml5",
  css: "SiCss3",
};

let catalogCache: { key: string; title: string; search: string }[] | null =
  null;

export function isSimpleIconKey(key: string) {
  return Boolean(key && ICON_MAP[key]);
}

export function getSimpleIcon(key: string): IconType | null {
  return ICON_MAP[key] ?? null;
}

export function titleFromIconKey(key: string) {
  if (TITLE_OVERRIDES[key]) return TITLE_OVERRIDES[key];
  return key
    .replace(/^Si/, "")
    .replace(/dotjs/gi, ".js")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function hrefFromIconKey(key: string) {
  return HREF_OVERRIDES[key];
}

export function stackItemFromIconKey(key: string): StackItem | null {
  if (!isSimpleIconKey(key)) return null;
  return {
    icon: key,
    title: titleFromIconKey(key),
    href: hrefFromIconKey(key),
  };
}

export function getSimpleIconCatalog() {
  if (!catalogCache) {
    catalogCache = Object.keys(ICON_MAP)
      .filter((key) => key.startsWith("Si"))
      .map((key) => {
        const title = titleFromIconKey(key);
        return {
          key,
          title,
          search: `${key} ${title}`.toLowerCase(),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }
  return catalogCache;
}

export function searchSimpleIcons(query: string, limit = 24) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const catalog = getSimpleIconCatalog();
  const starts: typeof catalog = [];
  const includes: typeof catalog = [];
  for (const item of catalog) {
    if (item.search.startsWith(q) || item.title.toLowerCase().startsWith(q)) {
      starts.push(item);
    } else if (item.search.includes(q)) {
      includes.push(item);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...includes].slice(0, limit);
}

export function normalizeStackItem(value: unknown): StackItem | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const mapped = LEGACY_NAME_TO_ICON[trimmed.toLowerCase()];
    if (mapped) return stackItemFromIconKey(mapped);
    const guess = `Si${trimmed.replace(/[^a-zA-Z0-9]/g, "")}`;
    const byGuess = stackItemFromIconKey(guess);
    if (byGuess) return byGuess;
    const hit = searchSimpleIcons(trimmed, 1)[0];
    return hit ? stackItemFromIconKey(hit.key) : null;
  }

  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.icon !== "string" || typeof record.title !== "string") {
    return null;
  }
  const icon = record.icon.trim();
  const title = record.title.trim();
  if (!icon || !title || !isSimpleIconKey(icon)) return null;

  let href: string | undefined;
  if (typeof record.href === "string" && record.href.trim()) {
    href = record.href.trim();
  }

  return { icon, title, href };
}
