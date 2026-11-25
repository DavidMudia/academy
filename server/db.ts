import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLOutputValue } from "node:sqlite";

export type ApplicationStatus = "submitted" | "approved" | "rejected" | "paid";
export type UserRole = "admin" | "student";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
};

export type ApplicationRow = {
  id: string;
  email: string;
  programme: string;
  batch: string;
  personal_json: string;
  docs_json: string;
  status: ApplicationStatus;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  payment_link_hash: string | null;
  payment_link_expires_at: string | null;
  credential_delivery_json: string | null;
};

export function openDatabase(filePath: string): DatabaseSync {
  if (filePath !== ":memory:") mkdirSync(path.dirname(filePath), { recursive: true });

  const db = new DatabaseSync(filePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      programme TEXT NOT NULL,
      start TEXT NOT NULL,
      deadline TEXT NOT NULL,
      mode TEXT NOT NULL,
      campus TEXT NOT NULL,
      seats INTEGER NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0,
      early_bird INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE,
      programme TEXT NOT NULL,
      batch TEXT NOT NULL REFERENCES batches(id),
      personal_json TEXT NOT NULL,
      docs_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('submitted', 'approved', 'rejected', 'paid')),
      created_at TEXT NOT NULL,
      approved_at TEXT,
      paid_at TEXT,
      payment_link_hash TEXT,
      payment_link_expires_at TEXT,
      credential_delivery_json TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL REFERENCES applications(id),
      provider_reference TEXT NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
      method TEXT,
      breakdown_json TEXT NOT NULL,
      checkout_url TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS application_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (application_id, kind)
    );

    CREATE TABLE IF NOT EXISTS delivery_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL REFERENCES applications(id),
      kind TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS applications_email_idx ON applications(email);
    CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
    CREATE INDEX IF NOT EXISTS payments_application_idx ON payments(application_id);
    CREATE INDEX IF NOT EXISTS application_documents_application_idx ON application_documents(application_id);
    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS batches_programme_idx ON batches(programme);
  `);
  return db;
}

export function row<T>(value: Record<string, SQLOutputValue> | undefined): T | null {
  return value ? (value as T) : null;
}

export function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}