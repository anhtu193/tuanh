import {
  createSessionToken,
  isSameOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyAdminCredentials,
} from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "Forbidden");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request");
  }

  if (!body || typeof body !== "object") {
    return jsonError(400, "Invalid request");
  }
  const { username, password } = body as Record<string, unknown>;
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 200 ||
    !username ||
    !password
  ) {
    return jsonError(400, "Username and password are required");
  }

  try {
    const ok = await verifyAdminCredentials(username, password);
    if (!ok) {
      return jsonError(401, "Invalid username or password");
    }
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE,
      createSessionToken(username),
      sessionCookieOptions(),
    );
    return Response.json({ ok: true });
  } catch {
    return jsonError(500, "Admin login is not configured");
  }
}
