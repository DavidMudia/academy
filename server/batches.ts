import type { DatabaseSync } from "node:sqlite";
import { row } from "./db";

export type BatchRow = {
  id: string;
  programme: string;
  start: string;
  deadline: string;
  mode: string;
  campus: string;
  seats: number;
  taken: number;
  early_bird: number;
};

export type Batch = {
  id: string;
  programme: string;
  start: string;
  deadline: string;
  mode: string;
  campus: string;
  seats: number;
  taken: number;
  earlyBird: boolean;
};

export function rowToBatch(r: BatchRow): Batch {
  return {
    id: r.id,
    programme: r.programme,
    start: r.start,
    deadline: r.deadline,
    mode: r.mode,
    campus: r.campus,
    seats: r.seats,
    taken: r.taken,
    earlyBird: Boolean(r.early_bird),
  };
}

export function dbBatch(db: DatabaseSync, id: string): Batch | null {
  const r = row<BatchRow>(db.prepare("SELECT * FROM batches WHERE id = ?").get(id));
  return r ? rowToBatch(r) : null;
}

export function dbBatches(db: DatabaseSync, programme?: string): Batch[] {
  const rows = programme
    ? (db.prepare("SELECT * FROM batches WHERE programme = ? ORDER BY start").all(programme) as unknown as BatchRow[])
    : (db.prepare("SELECT * FROM batches ORDER BY start").all() as unknown as BatchRow[]);
  return rows.map(rowToBatch);
}

export function paidCountForBatch(db: DatabaseSync, batchId: string): number {
  return Number(
    (db
      .prepare("SELECT COUNT(*) AS c FROM applications WHERE batch = ? AND status = 'paid'")
      .get(batchId) as { c: number } | undefined)?.c ?? 0,
  );
}

export function seedBatches(db: DatabaseSync, defaults: Batch[]): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO batches
      (id, programme, start, deadline, mode, campus, seats, taken, early_bird)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const b of defaults) {
    insert.run(b.id, b.programme, b.start, b.deadline, b.mode, b.campus, b.seats, b.taken ?? 0, b.earlyBird ? 1 : 0);
  }
}