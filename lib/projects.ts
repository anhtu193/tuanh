import { ensureSchema, getSql } from "@/lib/db";
import type { Project, ProjectInput } from "@/lib/types";
import { slugify } from "@/lib/validate";

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  project_url: string | null;
  github_url: string | null;
  image_url: string;
  image_public_id: string | null;
  technologies: unknown;
  created_at: string | Date;
  updated_at: string | Date;
};

function asIso(value: string | Date) {
  return new Date(value).toISOString();
}

function mapProject(row: ProjectRow): Project {
  const technologies = Array.isArray(row.technologies)
    ? row.technologies.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    projectUrl: row.project_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    imageUrl: row.image_url,
    imagePublicId: row.image_public_id ?? undefined,
    technologies,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

const projectColumns = `
  id, title, slug, description, project_url, github_url, image_url,
  image_public_id, technologies, created_at, updated_at
`;

async function uniqueSlug(title: string, ignoreId?: string) {
  const sql = getSql();
  const base = slugify(title);
  const rows = await sql`
    SELECT id, slug FROM projects
    WHERE slug = ${base} OR slug LIKE ${`${base}-%`}
  `;
  const taken = new Set(
    rows
      .filter((row) => String(row.id) !== ignoreId)
      .map((row) => String(row.slug)),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export async function listProjects() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(projectColumns)}
    FROM projects
    ORDER BY created_at DESC
  `;
  return (rows as ProjectRow[]).map(mapProject);
}

export async function getProject(id: string) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(projectColumns)}
    FROM projects
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0] as ProjectRow | undefined;
  return row ? mapProject(row) : null;
}

export async function createProject(input: ProjectInput) {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(input.title);
  const rows = await sql`
    INSERT INTO projects (
      id, title, slug, description, project_url, github_url, image_url,
      image_public_id, technologies, created_at, updated_at
    ) VALUES (
      ${id},
      ${input.title},
      ${slug},
      ${input.description},
      ${input.projectUrl ?? null},
      ${input.githubUrl ?? null},
      ${input.imageUrl},
      ${input.imagePublicId ?? null},
      ${JSON.stringify(input.technologies)}::jsonb,
      ${now},
      ${now}
    )
    RETURNING ${sql.unsafe(projectColumns)}
  `;
  return mapProject(rows[0] as ProjectRow);
}

export async function updateProject(id: string, input: ProjectInput) {
  await ensureSchema();
  const existing = await getProject(id);
  if (!existing) return null;
  const sql = getSql();
  const slug = await uniqueSlug(input.title, id);
  const now = new Date().toISOString();
  const rows = await sql`
    UPDATE projects SET
      title = ${input.title},
      slug = ${slug},
      description = ${input.description},
      project_url = ${input.projectUrl ?? null},
      github_url = ${input.githubUrl ?? null},
      image_url = ${input.imageUrl},
      image_public_id = ${input.imagePublicId ?? null},
      technologies = ${JSON.stringify(input.technologies)}::jsonb,
      updated_at = ${now}
    WHERE id = ${id}
    RETURNING ${sql.unsafe(projectColumns)}
  `;
  const row = rows[0] as ProjectRow | undefined;
  return row ? mapProject(row) : null;
}

export async function deleteProject(id: string) {
  await ensureSchema();
  const existing = await getProject(id);
  if (!existing) return null;
  const sql = getSql();
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return existing;
}
