// lib/auth-db.ts
import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const DB_PATH = process.env.AUTH_DB_PATH ?? path.join(process.cwd(), "..", "skillforge", "data", "auth.db");

const g = globalThis as typeof globalThis & { __authDb?: Database.Database };

function getDb(): Database.Database {
  if (!g.__authDb) {
    g.__authDb = new Database(DB_PATH);
    g.__authDb.exec(`
      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return g.__authDb;
}

export function findSchoolByEmail(email: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM schools WHERE email = ?").get(email) as
    | { id: string; name: string; email: string; password_hash: string }
    | undefined;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function createSchool(name: string, email: string, password: string) {
  const db = getDb();
  const id = randomUUID();
  const password_hash = bcrypt.hashSync(password, 12);
  db.prepare("INSERT INTO schools (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    id, name, email, password_hash
  );
  return { id, name, email };
}
