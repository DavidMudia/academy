import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import express, { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import { batches as defaultBatches, documents as documentRequirements, EARLY_BIRD_PERCENT, PROMO_CODES, REGISTRATION_FEE, getProgramme } from "../src/data";
import type { AppConfig } from "./config";
import { openDatabase, parseJson, row, type ApplicationRow, type UserRow } from "./db";
import { dbBatch, dbBatches, paidCountForBatch, seedBatches } from "./batches";
import { deliverMessage, type DeliveryResult } from "./delivery";
import { clearSession, currentUser, hashPassword, hashToken, issueSession, seedAdmin, verifyPassword } from "./security";

type Breakdown = {
  registration: number;
  tuition: number;
  earlyBird: number;
  promo: number;
  promoCode?: string;
  total: number;
};

type Personal = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  city: string;
  education: string;
  nextOfKin: string;
  nextOfKinPhone: string;
};

type StoredPayment = {
  id: number;
  application_id: string;
  provider_reference: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  method: string | null;
  breakdown_json: string;
  checkout_url: string | null;
  created_at: string;
  paid_at: string | null;
};

type JsonRequest = Request & { rawBody?: Buffer };

class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function isValidDocument(mimeType: string, buffer: Buffer): boolean {
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return false;
}

function safeFileName(name: string): string {
  const baseName = name.replace(/\\/g, "/").split("/").pop()?.trim() ?? "";
  return baseName.replace(/[\u0000-\u001f]/g, "").slice(0, 120) || "application-document";
}

function isFileMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

const personalSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  dob: z.string().min(1).max(20),
  gender: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(7).max(32),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  education: z.string().trim().min(1).max(100),
  nextOfKin: z.string().trim().min(2).max(200),
  nextOfKinPhone: z.string().trim().min(7).max(32),
});

const applicationSchema = z.object({
  email: z.string().trim().email().max(254),
  programme: z.string().min(1),
  batch: z.string().min(1),
  personal: personalSchema,
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

const batchCreateSchema = z.object({
  id: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9-]+$/),
  programme: z.string().min(1),
  start: z.iso.date(),
  deadline: z.iso.date(),
  mode: z.enum(["Full-time", "Weekend"]),
  campus: z.string().trim().min(2).max(120),
  seats: z.number().int().min(1).max(500),
  earlyBird: z.boolean(),
});

const batchUpdateSchema = batchCreateSchema.omit({ id: true, programme: true });

function isValidBatchDates(start: string, deadline: string): boolean {
  return deadline <= start;
}

const cleanUser = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

function getApplication(db: ReturnType<typeof openDatabase>, id: string): ApplicationRow | null {
  return row<ApplicationRow>(db.prepare("SELECT * FROM applications WHERE id = ?").get(id));
}

function getPayment(db: ReturnType<typeof openDatabase>, reference: string): StoredPayment | null {
  return row<StoredPayment>(db.prepare("SELECT * FROM payments WHERE provider_reference = ?").get(reference));
}

function parseBreakdown(db: ReturnType<typeof openDatabase>, app: ApplicationRow, promoCode?: string): Breakdown {
  const programme = getProgramme(app.programme);
  const batch = dbBatch(db, app.batch);
  if (!programme || !batch) throw new HttpError("The selected programme or batch is no longer available.", 400);

  const earlyBird = batch.earlyBird ? Math.round((programme.tuition * EARLY_BIRD_PERCENT) / 100) : 0;
  const normalizedPromo = promoCode?.trim().toUpperCase();
  const promoRate = normalizedPromo ? PROMO_CODES[normalizedPromo] : 0;
  if (normalizedPromo && !promoRate) throw new HttpError("That promo code is invalid or expired.", 400);
  const promo = promoRate ? Math.round(((programme.tuition - earlyBird) * promoRate) / 100) : 0;
  return {
    registration: REGISTRATION_FEE,
    tuition: programme.tuition,
    earlyBird,
    promo,
    promoCode: promoRate ? normalizedPromo : undefined,
    total: REGISTRATION_FEE + programme.tuition - earlyBird - promo,
  };
}

function publicApplication(db: ReturnType<typeof openDatabase>, app: ApplicationRow) {
  const programme = getProgramme(app.programme);
  const batch = dbBatch(db, app.batch);
  const payment = row<StoredPayment>(
    db.prepare("SELECT * FROM payments WHERE application_id = ? AND status = 'paid' ORDER BY id DESC LIMIT 1").get(app.id),
  );
  const statusLabel = app.status === "submitted"
    ? "Submitted"
    : app.status === "approved"
      ? "Approved"
      : app.status === "rejected"
        ? "Rejected"
        : "Paid";
  return {
    id: app.id,
    email: app.email,
    programme: app.programme,
    batch: app.batch,
    personal: parseJson<Personal>(app.personal_json),
    docs: parseJson<Record<string, string>>(app.docs_json),
    status: statusLabel,
    createdAt: app.created_at,
    payment: payment
      ? {
          reference: payment.provider_reference,
          method: payment.method ?? "Paystack",
          amount: payment.amount,
          paidAt: payment.paid_at ?? app.paid_at ?? "",
          breakdown: parseJson<Breakdown>(payment.breakdown_json),
        }
      : undefined,
    programmeTitle: programme?.title ?? app.programme,
    batchStart: batch?.start ?? "",
  };
}

function saveDeliveryAttempts(
  db: ReturnType<typeof openDatabase>,
  applicationId: string,
  kind: string,
  result: DeliveryResult,
): void {
  const insert = db.prepare(
    "INSERT INTO delivery_attempts (application_id, kind, channel, status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const now = new Date().toISOString();
  insert.run(applicationId, kind, "email", result.email.status, result.email.detail ?? null, now);
  insert.run(applicationId, kind, "whatsapp", result.whatsapp.status, result.whatsapp.detail ?? null, now);
}

async function sendApplicationMessage(
  db: ReturnType<typeof openDatabase>,
  config: AppConfig,
  app: ApplicationRow,
  kind: string,
  subject: string,
  message: string,
): Promise<DeliveryResult> {
  const personal = parseJson<Personal>(app.personal_json);
  const result = await deliverMessage(config, { email: app.email, phone: personal.phone }, subject, message);
  saveDeliveryAttempts(db, app.id, kind, result);
  return result;
}

function paymentLink(db: ReturnType<typeof openDatabase>, config: AppConfig, app: ApplicationRow) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString();
  db.prepare("UPDATE applications SET payment_link_hash = ?, payment_link_expires_at = ? WHERE id = ?").run(
    hashToken(token),
    expiresAt,
    app.id,
  );
  return `${config.frontendUrl}/#/payment/${encodeURIComponent(app.id)}?token=${encodeURIComponent(token)}`;
}

async function notifyPaymentLink(
  db: ReturnType<typeof openDatabase>,
  config: AppConfig,
  app: ApplicationRow,
): Promise<{ link: string; delivery: DeliveryResult }> {
  const link = paymentLink(db, config, app);
  const programme = getProgramme(app.programme);
  const batch = dbBatch(db, app.batch);
  const breakdown = parseBreakdown(db, app);
  const message = [
    `Your application ${app.id} for ${programme?.title ?? app.programme} (${batch?.id ?? app.batch}) has been approved.`,
    `Complete payment of ₦${breakdown.total.toLocaleString("en-NG")} using your secure payment link:`,
    link,
    "This link expires in 7 days. Contact admissions if you need a new link.",
  ].join("\n\n");
  const delivery = await sendApplicationMessage(db, config, app, "payment_link", "Application approved - payment link", message);
  return { link, delivery };
}

function recordVerifiedPayment(
  db: ReturnType<typeof openDatabase>,
  app: ApplicationRow,
  payment: StoredPayment,
  channel: string | null,
): { user: UserRow; password: string | null } {
  const existing = row<UserRow>(db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(app.email));
  const personal = parseJson<Personal>(app.personal_json);
  const name = `${personal.firstName} ${personal.lastName}`.trim();
  const password = existing ? null : randomBytes(18).toString("base64url");
  const timestamp = new Date().toISOString();

  db.exec("BEGIN IMMEDIATE");
  try {
    const latestApp = getApplication(db, app.id);
    if (!latestApp || (latestApp.status !== "approved" && latestApp.status !== "paid")) {
      throw new HttpError("Application is no longer eligible for payment.", 409);
    }
    const latestPayment = getPayment(db, payment.provider_reference);
    if (!latestPayment) throw new HttpError("Payment record was not found.", 404);
    if (latestPayment.status !== "paid") {
      db.prepare("UPDATE payments SET status = 'paid', method = ?, paid_at = ? WHERE id = ?").run(
        channel ?? "Paystack",
        timestamp,
        latestPayment.id,
      );
      db.prepare(
        "UPDATE applications SET status = 'paid', paid_at = ?, payment_link_hash = NULL, payment_link_expires_at = NULL WHERE id = ?",
      ).run(timestamp, app.id);
    }

    let user = row<UserRow>(db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(app.email));
    if (!user) {
      if (!password) throw new Error("Missing generated student password.");
      const result = db.prepare(
        `INSERT INTO users (name, email, phone, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, 'student', ?)`,
      ).run(name, app.email, personal.phone, hashPassword(password), timestamp);
      user = row<UserRow>(db.prepare("SELECT * FROM users WHERE id = ?").get(Number(result.lastInsertRowid)));
    }
    if (!user) throw new Error("Student account could not be created.");
    db.exec("COMMIT");
    return { user, password };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

async function verifyPaystack(
  config: AppConfig,
  reference: string,
  fetcher: typeof fetch,
): Promise<{ ok: boolean; amount?: number; currency?: string; channel?: string; metadata?: { applicationId?: string } }> {
  if (!config.paystackSecretKey) throw new HttpError("Paystack is not configured on the backend.", 503);
  const response = await fetcher(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${config.paystackSecretKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: { status?: string; amount?: number; currency?: string; channel?: string; metadata?: { applicationId?: string } } }
    | null;
  if (!response.ok || !payload?.status || !payload.data) {
    throw new HttpError(payload?.message ?? "Paystack verification failed.", 502);
  }
  return {
    ok: payload.data.status === "success",
    amount: payload.data.amount,
    currency: payload.data.currency,
    channel: payload.data.channel,
    metadata: payload.data.metadata,
  };
}

export function createApp(options: { config: AppConfig; dbPath?: string; fetcher?: typeof fetch; database?: ReturnType<typeof openDatabase> }) {
  const { config } = options;
  const db = options.database ?? openDatabase(options.dbPath ?? config.databasePath);
  const fetcher = options.fetcher ?? fetch;
  const uploadsPath = options.config.uploadsPath;
  seedBatches(db, defaultBatches);
  seedAdmin(db, config);

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    }),
  );
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buffer) => {
        (req as JsonRequest).rawBody = Buffer.from(buffer);
      },
    }),
  );

  const asyncRoute = (handler: (req: Request, res: Response) => Promise<void> | void): RequestHandler =>
    (req, res, next) => {
      void Promise.resolve(handler(req, res)).catch(next);
    };

  const acceptedTypes: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
  };
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: documentRequirements.length, fields: 1, fieldSize: 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!documentRequirements.some((item) => item.key === file.fieldname)) {
        callback(new HttpError("Unknown application document type.", 400));
        return;
      }
      if (!acceptedTypes[file.mimetype]) {
        callback(new HttpError("Only PDF, JPG or PNG documents are accepted.", 400));
        return;
      }
      callback(null, true);
    },
  });
  const applicationUploads: RequestHandler = (req, res, next) => {
    upload.fields(documentRequirements.map((item) => ({ name: item.key, maxCount: 1 })))(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        res.status(status).json({
          error: error.code === "LIMIT_FILE_SIZE" ? "Each document must be no larger than 5 MB." : "Check the selected application documents.",
        });
        return;
      }
      if (error) {
        next(error);
        return;
      }
      next();
    });
  };

  const adminRoute = (
    handler: (req: Request, res: Response, user: UserRow) => Promise<void> | void,
  ): RequestHandler =>
    (req, res, next) => {
      const user = currentUser(db, req);
      if (!user || user.role !== "admin") {
        res.status(401).json({ error: "Administrator login required." });
        return;
      }
      void Promise.resolve(handler(req, res, user)).catch(next);
    };

  const studentRoute = (
    handler: (req: Request, res: Response, user: UserRow) => Promise<void> | void,
  ): RequestHandler =>
    (req, res, next) => {
      const user = currentUser(db, req);
      if (!user || user.role !== "student") {
        res.status(401).json({ error: "Student login required." });
        return;
      }
      void Promise.resolve(handler(req, res, user)).catch(next);
    };

  app.get(
    "/api/health",
    (_req, res) => {
      res.json({
        status: "ok",
        integrations: {
          paystack: Boolean(config.paystackSecretKey),
          email: Boolean(config.smtpHost && config.smtpUser && config.smtpPassword && config.smtpFrom),
          whatsapp: Boolean(config.whatsappAccessToken && config.whatsappPhoneNumberId && config.whatsappTemplateName),
        },
      });
    },
  );

  app.get("/api/batches", (_req, res) => {
    res.json({
      batches: dbBatches(db).map((batch) => ({
        ...batch,
        seatsTaken: paidCountForBatch(db, batch.id),
      })),
    });
  });

  app.post(
    "/api/admin/batches",
    adminRoute((req, res) => {
      const body = batchCreateSchema.safeParse(req.body);
      if (!body.success) throw new HttpError("Enter valid batch details.", 400);
      const batch = { ...body.data, id: body.data.id.toUpperCase() };
      if (!getProgramme(batch.programme)) throw new HttpError("Choose a valid programme.", 400);
      if (!isValidBatchDates(batch.start, batch.deadline)) {
        throw new HttpError("The registration deadline must be on or before the batch start date.", 400);
      }
      if (dbBatch(db, batch.id)) throw new HttpError("A batch with that ID already exists.", 409);

      db.prepare(
        `INSERT INTO batches (id, programme, start, deadline, mode, campus, seats, taken, early_bird)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      ).run(batch.id, batch.programme, batch.start, batch.deadline, batch.mode, batch.campus, batch.seats, batch.earlyBird ? 1 : 0);
      const created = dbBatch(db, batch.id);
      if (!created) throw new Error("Created batch could not be loaded.");
      res.status(201).json({ batch: { ...created, seatsTaken: 0 } });
    }),
  );

  app.patch(
    "/api/admin/batches/:id",
    adminRoute((req, res) => {
      const id = String(req.params.id).toUpperCase();
      const existing = dbBatch(db, id);
      if (!existing) throw new HttpError("Batch not found.", 404);
      const body = batchUpdateSchema.safeParse(req.body);
      if (!body.success) throw new HttpError("Enter valid batch details.", 400);
      if (!isValidBatchDates(body.data.start, body.data.deadline)) {
        throw new HttpError("The registration deadline must be on or before the batch start date.", 400);
      }
      const occupiedSeats = existing.taken + paidCountForBatch(db, id);
      if (body.data.seats < occupiedSeats) {
        throw new HttpError(`Seats cannot be reduced below the ${occupiedSeats} already occupied.`, 409);
      }

      db.prepare(
        `UPDATE batches
         SET start = ?, deadline = ?, mode = ?, campus = ?, seats = ?, early_bird = ?
         WHERE id = ?`,
      ).run(
        body.data.start,
        body.data.deadline,
        body.data.mode,
        body.data.campus,
        body.data.seats,
        body.data.earlyBird ? 1 : 0,
        id,
      );
      const updated = dbBatch(db, id);
      if (!updated) throw new Error("Updated batch could not be loaded.");
      res.json({ batch: { ...updated, seatsTaken: paidCountForBatch(db, id) } });
    }),
  );

  app.delete(
    "/api/admin/batches/:id",
    adminRoute((req, res) => {
      const id = String(req.params.id).toUpperCase();
      if (!dbBatch(db, id)) throw new HttpError("Batch not found.", 404);
      const applicationCount = Number(
        (db.prepare("SELECT COUNT(*) AS count FROM applications WHERE batch = ?").get(id) as { count: number }).count,
      );
      if (applicationCount > 0) throw new HttpError("Batches with applications cannot be deleted.", 409);
      db.prepare("DELETE FROM batches WHERE id = ?").run(id);
      res.status(204).end();
    }),
  );

  app.post(
    "/api/auth/login",
    rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false }),
    asyncRoute(async (req, res) => {
      const body = loginSchema.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: "Enter a valid email address and password." });
        return;
      }
      const user = row<UserRow>(
        db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(body.data.email),
      );
      if (!user || !verifyPassword(body.data.password, user.password_hash)) {
        res.status(401).json({ error: "Incorrect email or password." });
        return;
      }
      issueSession(db, res, user.id, config);
      res.json({ user: cleanUser(user) });
    }),
  );

  app.get(
    "/api/auth/me",
    (req, res) => {
      const user = currentUser(db, req);
      res.json({ user: user ? cleanUser(user) : null });
    },
  );

  app.post(
    "/api/auth/logout",
    (req, res) => {
      clearSession(db, req, res, config);
      res.status(204).end();
    },
  );

  app.post(
    "/api/applications",
    rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false }),
    applicationUploads,
    asyncRoute(async (req, res) => {
      let payload: unknown;
      try {
        payload = JSON.parse(String(req.body.application ?? ""));
      } catch {
        res.status(400).json({ error: "Application details are missing or invalid." });
        return;
      }
      const body = applicationSchema.safeParse(payload);
      if (!body.success) {
        res.status(400).json({ error: "Review the application details and try again.", fields: body.error.flatten().fieldErrors });
        return;
      }
      const { email, programme, batch, personal } = body.data;
      const uploadedFiles = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
      const requiredMissing = documentRequirements.filter((item) => item.required && !uploadedFiles[item.key]?.[0]);
      if (requiredMissing.length) {
        res.status(400).json({ error: `Upload the required documents: ${requiredMissing.map((item) => item.label).join(", ")}.` });
        return;
      }
      const selectedProgramme = getProgramme(programme);
      const selectedBatch = dbBatch(db, batch);
      if (!selectedProgramme || !selectedBatch || selectedBatch.programme !== programme) {
        res.status(400).json({ error: "Choose an available programme and matching batch." });
        return;
      }
      if (new Date(`${selectedBatch.deadline}T23:59:59`) < new Date()) {
        res.status(400).json({ error: "Registration for this batch is closed." });
        return;
      }
      const seatsTaken = Number(
        db.prepare("SELECT COUNT(*) AS count FROM applications WHERE batch = ? AND status = 'paid'").get(batch)?.count ?? 0,
      );
      if (selectedBatch.seats - selectedBatch.taken - seatsTaken <= 0) {
        res.status(409).json({ error: "This batch is full. Please choose another intake." });
        return;
      }
      const adminEmail = row<{ id: number }>(
        db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE AND role = 'admin'").get(email),
      );
      if (adminEmail) {
        res.status(409).json({ error: "Please use a student email address for your application." });
        return;
      }

      const id = `OTA-${randomBytes(4).toString("hex").toUpperCase()}`;
      const now = new Date().toISOString();
      const storedPaths: string[] = [];
      const docs: Record<string, string> = {};
      const folder = path.join(uploadsPath, id);
      const stagedDocuments = Object.entries(uploadedFiles).flatMap(([kind, files]) => {
        const file = files[0];
        if (!file) return [];
        if (!isValidDocument(file.mimetype, file.buffer)) {
          throw new HttpError(`The selected ${kind} file does not match its file type.`, 400);
        }
        return [{
          kind,
          file,
          fileName: safeFileName(file.originalname),
          filePath: path.join(folder, `${kind}-${randomBytes(12).toString("hex")}${acceptedTypes[file.mimetype]}`),
        }];
      });
      try {
        await mkdir(folder, { recursive: true });
        for (const document of stagedDocuments) {
          storedPaths.push(document.filePath);
          await writeFile(document.filePath, document.file.buffer, { flag: "wx" });
          docs[document.kind] = document.fileName;
        }
        db.exec("BEGIN IMMEDIATE");
        try {
          db.prepare(
            `INSERT INTO applications
              (id, email, programme, batch, personal_json, docs_json, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)`,
          ).run(id, email.toLowerCase(), programme, batch, JSON.stringify(personal), JSON.stringify(docs), now);
          const insertDocument = db.prepare(
            `INSERT INTO application_documents
              (application_id, kind, file_name, mime_type, file_path, size, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          );
          for (const document of stagedDocuments) {
            insertDocument.run(
              id,
              document.kind,
              document.fileName,
              document.file.mimetype,
              document.filePath,
              document.file.size,
              now,
            );
          }
          db.exec("COMMIT");
        } catch (error) {
          if (db.isTransaction) db.exec("ROLLBACK");
          throw error;
        }
      } catch (error) {
        await Promise.all(
          storedPaths.map(async (filePath) => {
            try {
              await unlink(filePath);
            } catch (cleanupError) {
              console.error(`Unable to remove incomplete application upload ${filePath}:`, cleanupError);
            }
          }),
        );
        throw error;
      }

      const application = getApplication(db, id);
      if (!application) throw new Error("Saved application could not be loaded.");
      res.status(201).json({ application: publicApplication(db, application) });
    }),
  );

  app.get(
    "/api/applications/mine",
    studentRoute((_req, res, user) => {
      const apps = db
        .prepare("SELECT * FROM applications WHERE email = ? COLLATE NOCASE ORDER BY created_at DESC")
        .all(user.email) as unknown as ApplicationRow[];
      res.json({ applications: apps.map((item) => publicApplication(db, item)) });
    }),
  );

  app.get(
    "/api/admin/applications",
    adminRoute((req, res) => {
      const status = typeof req.query.status === "string" ? req.query.status : "";
      const allowed = ["submitted", "approved", "rejected", "paid"];
      const apps = status && allowed.includes(status)
        ? (db.prepare("SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC").all(status) as unknown as ApplicationRow[])
        : (db.prepare("SELECT * FROM applications ORDER BY created_at DESC").all() as unknown as ApplicationRow[]);
      const items = apps.map((item) => {
        const delivery = db
          .prepare("SELECT kind, channel, status, detail, created_at AS createdAt FROM delivery_attempts WHERE application_id = ? ORDER BY id DESC")
          .all(item.id);
        const documents = db
          .prepare(
            `SELECT id, kind, file_name AS fileName, mime_type AS mimeType, size
             FROM application_documents WHERE application_id = ? ORDER BY id`,
          )
          .all(item.id);
        const payment = row<StoredPayment>(
          db.prepare("SELECT * FROM payments WHERE application_id = ? ORDER BY id DESC LIMIT 1").get(item.id),
        );
        return {
          ...publicApplication(db, item),
          personal: parseJson<Personal>(item.personal_json),
          docs: parseJson<Record<string, string>>(item.docs_json),
          documents,
          deliveries: delivery,
          latestPayment: payment
            ? {
                reference: payment.provider_reference,
                status: payment.status,
                amount: payment.amount,
                createdAt: payment.created_at,
                paidAt: payment.paid_at,
              }
            : null,
          credentialDelivery: item.credential_delivery_json ? parseJson<DeliveryResult>(item.credential_delivery_json) : null,
        };
      });
      res.json({ applications: items });
    }),
  );

  const approveApplication = async (req: Request, res: Response, resend: boolean) => {
    const id = String(req.params.id);
    const application = getApplication(db, id);
    if (!application) throw new HttpError("Application not found.", 404);
    if (application.status === "paid") throw new HttpError("This application is already paid and registered.", 409);
    if (resend && application.status !== "approved") throw new HttpError("Only approved applications can receive a payment link.", 409);
    if (!resend && application.status !== "submitted" && application.status !== "approved") {
      throw new HttpError("This application cannot be approved in its current state.", 409);
    }
    if (!resend && application.status === "submitted") {
      db.prepare("UPDATE applications SET status = 'approved', approved_at = ? WHERE id = ?").run(new Date().toISOString(), id);
    }
    const current = getApplication(db, id);
    if (!current) throw new HttpError("Application not found.", 404);
    const result = await notifyPaymentLink(db, config, current);
    res.json({
      applicationId: id,
      status: "Approved",
      paymentLink: result.link,
      expiresInDays: 7,
      delivery: result.delivery,
    });
  };

  app.post(
    "/api/admin/applications/:id/approve",
    adminRoute((req, res) => approveApplication(req, res, false)),
  );
  app.post(
    "/api/admin/applications/:id/payment-link",
    adminRoute((req, res) => approveApplication(req, res, true)),
  );
  app.post(
    "/api/admin/applications/:id/reject",
    adminRoute(async (req, res) => {
      const application = getApplication(db, String(req.params.id));
      if (!application) throw new HttpError("Application not found.", 404);
      if (application.status !== "submitted") {
        throw new HttpError("Only applications awaiting review can be rejected.", 409);
      }
      db.prepare("UPDATE applications SET status = 'rejected' WHERE id = ?").run(application.id);
      const delivery = await sendApplicationMessage(
        db,
        config,
        application,
        "rejection",
        "Application update from Oldam Academy",
        `Your application ${application.id} was not approved. Contact admissions if you need more information.`,
      );
      res.json({ applicationId: application.id, status: "Rejected", delivery });
    }),
  );

  app.post(
    "/api/admin/applications/:id/resend-credentials",
    adminRoute(async (req, res) => {
      const application = getApplication(db, String(req.params.id));
      if (!application || application.status !== "paid") {
        throw new HttpError("Student credentials are available only after verified payment.", 409);
      }
      const student = row<UserRow>(
        db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE AND role = 'student'").get(application.email),
      );

      if (!student) throw new HttpError("The student account does not exist.", 404);
      if (
        !(config.smtpHost && config.smtpUser && config.smtpPassword && config.smtpFrom) &&
        !(config.whatsappAccessToken && config.whatsappPhoneNumberId && config.whatsappTemplateName)
      ) {
        throw new HttpError("Configure SMTP email or WhatsApp Cloud API before resending credentials.", 503);
      }
      const password = randomBytes(18).toString("base64url");
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), student.id);
      const message = [
        `Your payment for application ${application.id} has been verified.`,
        `Student portal: ${config.frontendUrl}/#/login`,
        `Email: ${student.email}`,
        `Temporary password: ${password}`,
        "Please keep these credentials private.",
      ].join("\n\n");
      const delivery = await sendApplicationMessage(
        db,
        config,
        application,
        "credentials",
        "Your Oldam Academy student portal credentials",
        message,
      );
      db.prepare("UPDATE applications SET credential_delivery_json = ? WHERE id = ?").run(
        JSON.stringify(delivery),
        application.id,
      );
      res.json({ applicationId: application.id, delivery });
    }),
  );

  app.get(
    "/api/admin/applications/:applicationId/documents/:documentId",
    adminRoute(async (req, res) => {
      const document = row<{
        application_id: string;
        file_name: string;
        mime_type: string;
        file_path: string;
      }>(
        db
          .prepare("SELECT * FROM application_documents WHERE id = ? AND application_id = ?")
          .get(Number(req.params.documentId), String(req.params.applicationId)),
      );
      if (!document) throw new HttpError("Document not found.", 404);
      let contents: Buffer;
      try {
        contents = await readFile(document.file_path);
      } catch (error) {
        if (isFileMissing(error)) throw new HttpError("The uploaded document is no longer available.", 404);
        throw error;
      }
      res.setHeader("Content-Type", document.mime_type);
      res.setHeader("Content-Disposition", `inline; filename="${document.file_name.replace(/["\\\r\n]/g, "")}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(contents);
    }),
  );

  app.get(
    "/api/payment-links/:token",
    asyncRoute((req, res) => {
      const token = String(req.params.token);
      if (!/^[\w-]{30,80}$/.test(token)) throw new HttpError("This payment link is invalid or expired.", 404);
      const application = row<ApplicationRow>(
        db
          .prepare("SELECT * FROM applications WHERE payment_link_hash = ? AND payment_link_expires_at > ?")
          .get(hashToken(token), new Date().toISOString()),
      );
      if (!application || application.status !== "approved") throw new HttpError("This payment link is invalid or expired.", 404);
      const programme = getProgramme(application.programme);
      const batch = dbBatch(db, application.batch);
      if (!programme || !batch) throw new HttpError("The selected programme is no longer available.", 409);
      res.json({
        applicationId: application.id,
        applicant: `${parseJson<Personal>(application.personal_json).firstName} ${parseJson<Personal>(application.personal_json).lastName}`,
        email: application.email,
        programme: { slug: programme.slug, title: programme.title, image: programme.image, tuition: programme.tuition },
        batch: { id: batch.id, start: batch.start, mode: batch.mode, campus: batch.campus, earlyBird: batch.earlyBird },
        breakdown: parseBreakdown(db, application),
      });
    }),
  );

  app.post(
    "/api/payments/initialize",
    rateLimit({ windowMs: 10 * 60_000, limit: 8, standardHeaders: true, legacyHeaders: false }),
    asyncRoute(async (req, res) => {
      const body = z.object({ token: z.string().min(30).max(80), promoCode: z.string().max(40).optional() }).safeParse(req.body);
      if (!body.success) throw new HttpError("A valid payment link is required.", 400);
      if (!config.paystackSecretKey) throw new HttpError("Paystack is not configured on the backend.", 503);
      const application = row<ApplicationRow>(
        db
          .prepare("SELECT * FROM applications WHERE payment_link_hash = ? AND payment_link_expires_at > ?")
          .get(hashToken(body.data.token), new Date().toISOString()),
      );
      if (!application || application.status !== "approved") throw new HttpError("This payment link is invalid or expired.", 404);
      const breakdown = parseBreakdown(db, application, body.data.promoCode);
      const previous = row<StoredPayment>(
        db.prepare("SELECT * FROM payments WHERE application_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1").get(application.id),
      );
      const insert = db.prepare(
        `INSERT INTO payments
          (application_id, provider_reference, amount, currency, status, breakdown_json, created_at)
         VALUES (?, ?, ?, 'NGN', 'pending', ?, ?)`,
      );
      const previousBreakdown = previous ? parseJson<Breakdown>(previous.breakdown_json) : null;
      const reusePrevious = Boolean(
        previous &&
          previous.amount === breakdown.total &&
          JSON.stringify(previousBreakdown) === JSON.stringify(breakdown),
      );
      if (reusePrevious && previous?.checkout_url) {
        res.json({ authorizationUrl: previous.checkout_url });
        return;
      }

      let paymentId: number;
      let reference: string;
      if (reusePrevious && previous) {
        paymentId = previous.id;
        reference = previous.provider_reference;
      } else {
        if (previous) db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(previous.id);
        reference = `OTA-${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
        const createdAt = new Date().toISOString();
        paymentId = Number(insert.run(application.id, reference, breakdown.total, JSON.stringify(breakdown), createdAt).lastInsertRowid);
      }
      const initializeResponse = await initializePaystack(fetcher, config, application, reference, breakdown);
      db.prepare("UPDATE payments SET checkout_url = ? WHERE id = ?").run(initializeResponse.authorizationUrl, paymentId);
      res.json({ authorizationUrl: initializeResponse.authorizationUrl });
    }),
  );

  app.get(
    "/api/payments/callback",
    asyncRoute(async (req, res) => {
      const reference = typeof req.query.reference === "string" ? req.query.reference : "";
      if (!reference) throw new HttpError("Missing Paystack payment reference.", 400);
      const paid = await verifyAndRegister(db, config, fetcher, reference);
      res.redirect(`${config.frontendUrl}/#/payment/${paid ? "success" : "failed"}`);
    }),
  );

  app.post(
    "/api/payments/webhook",
    asyncRoute(async (req, res) => {
      const signature = req.header("x-paystack-signature") ?? "";
      const rawBody = (req as JsonRequest).rawBody;
      if (!rawBody || !config.paystackSecretKey || !isValidPaystackSignature(rawBody, signature, config.paystackSecretKey)) {
        res.status(401).json({ error: "Invalid payment webhook signature." });
        return;
      }
      const event = req.body as { event?: string; data?: { reference?: string } };
      if (event.event !== "charge.success" || !event.data?.reference) {
        res.status(200).json({ received: true });
        return;
      }
      await verifyAndRegister(db, config, fetcher, event.data.reference);
      res.status(200).json({ received: true });
    }),
  );

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request data." });
      return;
    }
    console.error("API request failed:", error);
    res.status(500).json({ error: "An unexpected server error occurred." });
  });

  return { app, db };
}

async function initializePaystack(
  fetcher: typeof fetch,
  config: AppConfig,
  application: ApplicationRow,
  reference: string,
  breakdown: Breakdown,
): Promise<{ authorizationUrl: string }> {
  const response = await fetcher("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: application.email,
      amount: breakdown.total * 100,
      currency: "NGN",
      reference,
      callback_url: `${config.publicApiUrl}/api/payments/callback`,
      metadata: { applicationId: application.id },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const result = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: { authorization_url?: string } }
    | null;
  const authorizationUrl = result?.data?.authorization_url;
  if (!response.ok || !result?.status || !authorizationUrl) {
    throw new HttpError(result?.message ?? "Paystack could not start checkout. Please try again.", 502);
  }
  return { authorizationUrl };
}

async function verifyAndRegister(
  db: ReturnType<typeof openDatabase>,
  config: AppConfig,
  fetcher: typeof fetch,
  reference: string,
): Promise<boolean> {
  const payment = getPayment(db, reference);
  if (!payment) throw new HttpError("Payment reference not found.", 404);
  if (payment.status === "paid") return true;
  const application = getApplication(db, payment.application_id);
  if (!application) throw new HttpError("Application not found for payment.", 404);
  const verification = await verifyPaystack(config, reference, fetcher);
  if (!verification.ok) {
    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
    return false;
  }
  if (
    verification.amount !== payment.amount * 100 ||
    verification.currency !== payment.currency ||
    verification.metadata?.applicationId !== application.id
  ) {
    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
    throw new HttpError("Verified payment details do not match this application.", 409);
  }
  const { user, password } = recordVerifiedPayment(db, application, payment, verification.channel ?? null);
  const message = password
    ? [
        `Your payment for application ${application.id} has been verified and your student account is ready.`,
        `Student portal: ${config.frontendUrl}/#/login`,
        `Email: ${user.email}`,
        `Temporary password: ${password}`,
        `Payment reference: ${reference} · Amount: ₦${payment.amount.toLocaleString("en-NG")}`,
        "Please keep these credentials private.",
      ].join("\n\n")
    : [
        `Your payment for application ${application.id} has been verified.`,
        `Student portal: ${config.frontendUrl}/#/login`,
        `Payment reference: ${reference} · Amount: ₦${payment.amount.toLocaleString("en-NG")}`,
        "Use your existing student portal credentials.",
      ].join("\n\n");
  const delivery = await sendApplicationMessage(
    db,
    config,
    application,
    "credentials",
    "Payment confirmed - student portal access",
    message,
  );
  db.prepare("UPDATE applications SET credential_delivery_json = ? WHERE id = ?").run(
    JSON.stringify(delivery),
    application.id,
  );
  if (delivery.email.status !== "sent" && delivery.whatsapp.status !== "sent") {
    console.error(`Payment ${reference} is verified, but credential delivery failed for application ${application.id}.`);
  }
  return true;
}

function isValidPaystackSignature(body: Buffer, signature: string, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(body).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
