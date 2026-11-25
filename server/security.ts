import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { DatabaseSync } from "node:sqlite";
import { row, type UserRow } from "./db";
import type { AppConfig } from "./config";

const SESSION_COOKIE = "oldam_session";
const SESSION_DAYS = 14;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function seedAdmin(db: DatabaseSync, config: AppConfig): void {
  if (!config.adminEmail && !config.adminPassword) return;
  if (!config.adminEmail || !config.adminPassword || config.adminPassword.length < 12) {
    throw new Error("Set both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.");
  }
  db.prepare(
    `INSERT OR IGNORE INTO users (name, email, phone, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, 'admin', ?)`,
  ).run("Academy Administrator", config.adminEmail, "", hashPassword(config.adminPassword), new Date().toISOString());
}

export function issueSession(db: DatabaseSync, res: Response, userId: number, config: AppConfig): void {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    userId,
    expiresAt.toISOString(),
  );
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSession(db: DatabaseSync, req: Request, res: Response, config: AppConfig): void {
  const token = cookieValue(req, SESSION_COOKIE);
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/",
  });
}

export function currentUser(db: DatabaseSync, req: Request): UserRow | null {
  const token = cookieValue(req, SESSION_COOKIE);
  if (!token) return null;
  const session = row<{ user_id: number; expires_at: string }>(
    db.prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?").get(hashToken(token)),
  );
  if (!session || new Date(session.expires_at) <= new Date()) {
    if (session) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }
  return row<UserRow>(db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id));
}

function cookieValue(req: Request, name: string): string | null {
  const cookies = req.headers.cookie?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}
