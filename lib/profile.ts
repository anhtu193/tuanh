import { ensureSchema, getSql } from "@/lib/db";
import { normalizeStackItem, stackItemFromIconKey } from "@/lib/stack-icons";
import type { FindMeLink, SiteProfile, SiteProfileInput, StackItem } from "@/lib/types";

const PROFILE_ID = "default";

const DEFAULT_STACK: StackItem[] = [
  stackItemFromIconKey("SiTypescript")!,
  stackItemFromIconKey("SiReact")!,
  stackItemFromIconKey("SiNextdotjs")!,
  stackItemFromIconKey("SiTailwindcss")!,
  stackItemFromIconKey("SiNodedotjs")!,
  stackItemFromIconKey("SiFigma")!,
];

const DEFAULT_LINKS: FindMeLink[] = [
  { label: "github", url: "https://github.com" },
  { label: "email", url: "mailto:hello@example.com" },
  { label: "x", url: "https://x.com" },
];

type ProfileRow = {
  id: string;
  stack: unknown;
  links: unknown;
  updated_at: string | Date;
};

function mapStack(value: unknown): StackItem[] {
  if (!Array.isArray(value)) return [];
  const items: StackItem[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const item = normalizeStackItem(entry);
    if (!item || seen.has(item.icon)) continue;
    seen.add(item.icon);
    items.push(item);
  }
  return items;
}

function mapLinks(value: unknown): FindMeLink[] {
  if (!Array.isArray(value)) return [];
  const links: FindMeLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.label !== "string" || typeof record.url !== "string") {
      continue;
    }
    const label = record.label.trim();
    const url = record.url.trim();
    if (!label || !url) continue;
    links.push({ label, url });
  }
  return links;
}

function mapProfile(row: ProfileRow): SiteProfile {
  return {
    stack: mapStack(row.stack),
    links: mapLinks(row.links),
  };
}

export async function getSiteProfile(): Promise<SiteProfile> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, stack, links, updated_at
    FROM site_profile
    WHERE id = ${PROFILE_ID}
    LIMIT 1
  `) as ProfileRow[];

  if (rows[0]) {
    return mapProfile(rows[0]);
  }

  const now = new Date().toISOString();
  await sql`
    INSERT INTO site_profile (id, stack, links, updated_at)
    VALUES (
      ${PROFILE_ID},
      ${JSON.stringify(DEFAULT_STACK)}::jsonb,
      ${JSON.stringify(DEFAULT_LINKS)}::jsonb,
      ${now}
    )
    ON CONFLICT (id) DO NOTHING
  `;

  const created = (await sql`
    SELECT id, stack, links, updated_at
    FROM site_profile
    WHERE id = ${PROFILE_ID}
    LIMIT 1
  `) as ProfileRow[];

  if (created[0]) {
    return mapProfile(created[0]);
  }

  return { stack: DEFAULT_STACK, links: DEFAULT_LINKS };
}

export async function updateSiteProfile(
  input: SiteProfileInput,
): Promise<SiteProfile> {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();

  const rows = (await sql`
    INSERT INTO site_profile (id, stack, links, updated_at)
    VALUES (
      ${PROFILE_ID},
      ${JSON.stringify(input.stack)}::jsonb,
      ${JSON.stringify(input.links)}::jsonb,
      ${now}
    )
    ON CONFLICT (id) DO UPDATE SET
      stack = EXCLUDED.stack,
      links = EXCLUDED.links,
      updated_at = EXCLUDED.updated_at
    RETURNING id, stack, links, updated_at
  `) as ProfileRow[];

  return mapProfile(rows[0]);
}
