import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getSiteProfile, updateSiteProfile } from "@/lib/profile";
import { parseSiteProfileInput, ValidationError } from "@/lib/validate";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profile = await getSiteProfile();
    return Response.json({ profile });
  } catch {
    return jsonError(500, "Could not load profile");
  }
}

export async function PUT(request: Request) {
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
    const input = parseSiteProfileInput(body);
    const profile = await updateSiteProfile(input);
    revalidatePath("/");
    return Response.json({ profile });
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError(400, error.message);
    }
    return jsonError(500, "Could not save profile");
  }
}
