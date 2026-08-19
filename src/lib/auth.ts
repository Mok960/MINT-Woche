import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SECRET = process.env.AUTH_SECRET || process.env.VERCEL_AUTH_SECRET || "dev-secret";
const TOKEN_MAX_AGE = 60 * 60 * 24; // 1 day in seconds

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function createToken(username: string) {
  const payload = JSON.stringify({ u: username, iat: Date.now() });
  const sig = sign(payload);
  return Buffer.from(payload).toString("base64") + "." + sig;
}

function verifyToken(token?: string) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payload = Buffer.from(parts[0], "base64").toString();
  const sig = parts[1];
  try {
    if (sign(payload) !== sig) return null;
    const obj = JSON.parse(payload);
    if (!obj || typeof obj.u !== "string") return null;
    // Optionally: check iat for expiry
    return obj.u as string;
  } catch (e) {
    return null;
  }
}

export function credentialsMatch(username: string, password: string) {
  return (
    username === process.env.AUTH_USER &&
    password === process.env.AUTH_PASS
  );
}

export async function setSession(username: string) {
  const token = createToken(username);
  cookies().set({
    name: "session",
    value: token,
    httpOnly: true,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  cookies().set({ name: "session", value: "", httpOnly: true, path: "/", maxAge: 0, sameSite: "strict" });
}

export async function getSession() {
  const token = cookies().get("session")?.value;
  const user = verifyToken(token);
  return user ? { username: user } : null;
}

export async function requireUser(nextPath = "/") {
  const session = await getSession();
  if (!session) {
    // redirect to login with next
    const encoded = encodeURIComponent(nextPath || "/");
    redirect(`/anmelden?next=${encoded}`);
  }
  return session;
}

export async function isLoggedIn() {
  const s = await getSession();
  return Boolean(s);
}

export function safeNextPath(p: string) {
  if (!p) return "/";
  try {
    const u = new URL(p, "http://localhost");
    if (!u.pathname.startsWith("/")) return "/";
    return u.pathname + (u.search || "");
  } catch (e) {
    return "/";
  }
}
