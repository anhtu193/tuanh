import { isSameOrigin, SESSION_COOKIE } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "Forbidden");
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
