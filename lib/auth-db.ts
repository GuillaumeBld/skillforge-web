// lib/auth-db.ts
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "..", "skillforge", "data", "auth.db");

function getDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

export function findSchoolByEmail(email: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM schools WHERE email = ?").get(email) as
    | { id: string; name: string; email: string; password_hash: string }
    | undefined;
}

export function verifyPassword(plain: string, hash: string): boolean {
  const h = crypto.createHash("sha256").update(plain).digest("hex");
  return h === hash;
}

export function createSchool(name: string, email: string, password: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  const password_hash = crypto.createHash("sha256").update(password).digest("hex");
  db.prepare("INSERT INTO schools (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    id, name, email, password_hash
  );
  return { id, name, email };
}
