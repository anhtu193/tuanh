import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { duplicateProject } from "@/lib/projects";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  if (!(await getSessionUser())) {
    return jsonError(401, "Unauthorized");
  }
  if (!isSameOrigin(request)) {
    return jsonError(403, "Forbidden");
  }

  const { id } = await context.params;
  try {
    const project = await duplicateProject(id);
    if (!project) return jsonError(404, "Project not found");
    revalidatePath("/");
    return Response.json({ project }, { status: 201 });
  } catch {
    return jsonError(500, "Could not duplicate project");
  }
}
