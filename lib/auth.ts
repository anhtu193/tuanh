import { compare } from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  u: string;
  exp: number;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createSessionToken(username: string) {
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    } satisfies SessionPayload),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined) {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!data || typeof data.u !== "string" || typeof data.exp !== "number") {
      return null;
    }
    if (data.exp <= Date.now()) return null;
    const expectedUser = process.env.ADMIN_USERNAME ?? "";
    if (!expectedUser || !safeEqual(data.u, expectedUser)) return null;
    return data.u;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function verifyAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (!expectedUser || !passwordHash) {
    throw new Error("Admin credentials are not configured");
  }

  const userOk = safeEqual(username, expectedUser);
  const passwordOk = await compare(password, passwordHash);
  return userOk && passwordOk;
}
