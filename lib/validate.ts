import type { ProjectInput } from "@/lib/types";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;
const URL_MAX = 500;
const TECH_MAX = 20;
const TECH_LENGTH = 40;
const PUBLIC_ID_MAX = 255;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function validationError(message: string) {
  return new ValidationError(message);
}

function requiredString(value: unknown, label: string, max: number) {
  if (typeof value !== "string") {
    throw validationError(`${label} is required`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw validationError(`${label} is required`);
  }
  if (trimmed.length > max) {
    throw validationError(`${label} is too long`);
  }
  return trimmed;
}

function optionalHttpUrl(value: unknown, label: string) {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    throw validationError(`${label} is invalid`);
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > URL_MAX) {
    throw validationError(`${label} is too long`);
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw validationError(`${label} must be an http(s) URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw validationError(`${label} must be an http(s) URL`);
  }
  return trimmed;
}

export function parseProjectInput(body: unknown): ProjectInput {
  if (!body || typeof body !== "object") {
    throw validationError("Invalid project");
  }
  const record = body as Record<string, unknown>;
  const title = requiredString(record.title, "Title", TITLE_MAX);
  const description = requiredString(
    record.description,
    "Description",
    DESCRIPTION_MAX,
  );
  const projectUrl = optionalHttpUrl(record.projectUrl, "Project URL");
  const githubUrl = optionalHttpUrl(record.githubUrl, "GitHub URL");
  const imageUrl = optionalHttpUrl(record.imageUrl, "Cover image");
  if (!imageUrl || new URL(imageUrl).hostname !== "res.cloudinary.com") {
    throw validationError("Cover image must be a Cloudinary URL");
  }

  let imagePublicId: string | undefined;
  if (record.imagePublicId != null && record.imagePublicId !== "") {
    if (typeof record.imagePublicId !== "string") {
      throw validationError("Image id is invalid");
    }
    const publicId = record.imagePublicId.trim();
    if (
      !publicId ||
      publicId.length > PUBLIC_ID_MAX ||
      !/^[A-Za-z0-9_./-]+$/.test(publicId)
    ) {
      throw validationError("Image id is invalid");
    }
    imagePublicId = publicId;
  }

  if (!Array.isArray(record.technologies)) {
    throw validationError("Technologies must be a list");
  }
  if (record.technologies.length > TECH_MAX) {
    throw validationError("Too many technologies");
  }
  const technologies = record.technologies.map((item) => {
    if (typeof item !== "string") {
      throw validationError("Technologies must be text");
    }
    const tag = item.trim();
    if (!tag || tag.length > TECH_LENGTH) {
      throw validationError("A technology name is empty or too long");
    }
    return tag;
  });

  return {
    title,
    description,
    projectUrl,
    githubUrl,
    imageUrl,
    imagePublicId,
    technologies,
  };
}

export function slugify(title: string) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "project";
}
