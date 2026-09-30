import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { createProject, listProjects } from "@/lib/projects";
import { parseProjectInput, ValidationError } from "@/lib/validate";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listProjects();
    return Response.json({ projects });
  } catch {
    return jsonError(500, "Could not load projects");
  }
}

export async function POST(request: Request) {
  if (!(await getSessionUser())) {
    return jsonError(401, "Unauthorized");
  }
  if (!isSameOrigin(request)) {
    return jsonError(403, "Forbidden");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request");
  }

  try {
    const input = parseProjectInput(body);
    const project = await createProject(input);
    revalidatePath("/");
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError(400, error.message);
    }
    return jsonError(500, "Could not save project");
  }
}
