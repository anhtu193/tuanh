import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { deleteProjectImage } from "@/lib/cloudinary";
import { jsonError } from "@/lib/http";
import {
  countProjectsByPublicId,
  deleteProject,
  getProject,
  setProjectVisibility,
  updateProject,
} from "@/lib/projects";
import { parseProjectInput, ValidationError } from "@/lib/validate";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

async function guard(request: Request) {
  if (!(await getSessionUser())) {
    return jsonError(401, "Unauthorized");
  }
  if (!isSameOrigin(request)) {
    return jsonError(403, "Forbidden");
  }
  return null;
}

function isVisibilityOnly(
  body: unknown,
): body is { visible: boolean } {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.length === 1 && typeof record.visible === "boolean";
}

export async function PATCH(request: Request, context: Context) {
  const denied = await guard(request);
  if (denied) return denied;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request");
  }

  try {
    const existing = await getProject(id);
    if (!existing) return jsonError(404, "Project not found");

    if (isVisibilityOnly(body)) {
      const project = await setProjectVisibility(id, body.visible);
      if (!project) return jsonError(404, "Project not found");
      revalidatePath("/");
      return Response.json({ project });
    }

    const input = parseProjectInput(body);
    const project = await updateProject(id, input);
    if (!project) return jsonError(404, "Project not found");

    if (
      existing.imagePublicId &&
      existing.imagePublicId !== project.imagePublicId
    ) {
      const remaining = await countProjectsByPublicId(
        existing.imagePublicId,
        project.id,
      );
      if (remaining === 0) {
        try {
          await deleteProjectImage(existing.imagePublicId);
        } catch (error) {
          console.error("Could not delete the previous cover image", error);
        }
      }
    }

    revalidatePath("/");
    return Response.json({ project });
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError(400, error.message);
    }
    return jsonError(500, "Could not update project");
  }
}

export async function DELETE(request: Request, context: Context) {
  const denied = await guard(request);
  if (denied) return denied;

  const { id } = await context.params;
  try {
    const existing = await getProject(id);
    if (!existing) return jsonError(404, "Project not found");
    if (existing.imagePublicId) {
      const remaining = await countProjectsByPublicId(
        existing.imagePublicId,
        existing.id,
      );
      if (remaining === 0) {
        await deleteProjectImage(existing.imagePublicId);
      }
    }
    await deleteProject(id);
    revalidatePath("/");
    return Response.json({ ok: true });
  } catch {
    return jsonError(500, "Could not delete project");
  }
}
