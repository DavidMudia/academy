import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import request from "supertest";
import type { AppConfig } from "./config";
import { createApp } from "./app";
import { openDatabase } from "./db";

const config: AppConfig = {
  port: 4000,
  databasePath: ":memory:",
  uploadsPath: "server/data/uploads",
  frontendUrl: "http://127.0.0.1:5173",
  publicApiUrl: "http://127.0.0.1:4000",
  nodeEnv: "test",
  adminEmail: "admissions@example.com",
  adminPassword: "a-very-long-test-password",
  paystackSecretKey: "sk_test_for_tests",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpFrom: "",
  whatsappAccessToken: "",
  whatsappPhoneNumberId: "",
  whatsappApiVersion: "v22.0",
  whatsappTemplateName: "",
  whatsappTemplateLanguage: "en",
};

const newApplication = {
  email: "student@example.com",
  programme: "truck-driving",
  batch: "TD-B",
  personal: {
    firstName: "Ada",
    lastName: "Obi",
    dob: "1996-04-12",
    gender: "Female",
    phone: "08012345678",
    address: "12 Allen Avenue",
    city: "Lagos",
    education: "Secondary School (SSCE)",
    nextOfKin: "Chika Obi",
    nextOfKinPhone: "08099999999",
  },
  docs: { id: "national-id.pdf", photo: "passport.jpg", cert: "school-certificate.pdf" },
};

async function submitAndApprove(app: ReturnType<typeof createApp>["app"]) {
  const admin = request.agent(app);
  await admin.post("/api/auth/login").send({ email: config.adminEmail, password: config.adminPassword }).expect(200);
  const submitted = await request(app)
    .post("/api/applications")
    .field("application", JSON.stringify(newApplication))
    .attach("id", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "national-id.jpg", contentType: "image/jpeg" })
    .attach("photo", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "passport.jpg", contentType: "image/jpeg" })
    .attach("cert", Buffer.from("%PDF-1.4\n%%EOF"), { filename: "school-certificate.pdf", contentType: "application/pdf" })
    .expect(201);
  const id = submitted.body.application.id as string;
  const approved = await admin.post(`/api/admin/applications/${id}/approve`).send().expect(200);
  const hashQuery = new URL(approved.body.paymentLink as string).hash.split("?")[1];
  const token = new URLSearchParams(hashQuery).get("token");
  assert.ok(token);
  return { admin, id, token };
}

test("only an approved application with verified Paystack payment creates a student account", async () => {
  const uploadsPath = mkdtempSync(path.join(os.tmpdir(), "oldam-payment-test-"));
  let amountKobo = 0;
  let applicationId = "";
  let reference = "";
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/transaction/initialize")) {
      const body = JSON.parse(String(init?.body)) as { amount: number; reference: string; metadata: { applicationId: string } };
      amountKobo = body.amount;
      applicationId = body.metadata.applicationId;
      reference = body.reference;
      return Response.json({ status: true, data: { authorization_url: "https://checkout.paystack.com/test" } });
    }
    if (url.includes("/transaction/verify/")) {
      return Response.json({
        status: true,
        data: { status: "success", amount: amountKobo, currency: "NGN", channel: "card", metadata: { applicationId } },
      });
    }
    throw new Error(`Unexpected provider request: ${url}`);
  };

  const database = openDatabase(":memory:");
  const { app } = createApp({ config: { ...config, uploadsPath }, database, fetcher });
  try {
    const { admin, id, token } = await submitAndApprove(app);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get()?.count), 0);

    await request(app)
      .post("/api/payments/initialize")
      .send({ token: "not-an-approved-payment-link-with-no-record" })
      .expect(404);

    const initialized = await request(app).post("/api/payments/initialize").send({ token }).expect(200);
    assert.equal(initialized.body.authorizationUrl, "https://checkout.paystack.com/test");
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get()?.count), 0);

    const callback = await request(app).get(`/api/payments/callback?reference=${encodeURIComponent(reference)}`).expect(302);
    assert.equal(callback.headers.location, `${config.frontendUrl}/#/payment/success`);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get()?.count), 1);
    assert.equal(
      (database.prepare("SELECT status FROM applications WHERE id = ?").get(id) as { status: string }).status,
      "paid",
    );
    const document = database.prepare("SELECT id FROM application_documents WHERE application_id = ? LIMIT 1").get(id) as { id: number };
    await request(app).get(`/api/admin/applications/${id}/documents/${document.id}`).expect(401);
    await admin.get(`/api/admin/applications/${id}/documents/${document.id}`).expect(200);
    await admin.get("/api/admin/applications").expect(200);
  } finally {
    rmSync(uploadsPath, { recursive: true, force: true });
  }
});

test("a successful provider response with a mismatched amount does not register the applicant", async () => {
  const uploadsPath = mkdtempSync(path.join(os.tmpdir(), "oldam-payment-test-"));
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/transaction/initialize")) {
      return Response.json({ status: true, data: { authorization_url: "https://checkout.paystack.com/test" } });
    }
    if (url.includes("/transaction/verify/")) {
      return Response.json({
        status: true,
        data: { status: "success", amount: 1, currency: "NGN", channel: "card", metadata: { applicationId: "wrong-application" } },
      });
    }
    throw new Error(`Unexpected provider request: ${url}`);
  };
  const database = openDatabase(":memory:");
  const { app } = createApp({ config: { ...config, uploadsPath }, database, fetcher });
  try {
    const { id, token } = await submitAndApprove(app);
    await request(app).post("/api/payments/initialize").send({ token }).expect(200);

    await request(app)
      .get(`/api/payments/callback?reference=${encodeURIComponent(String(database.prepare("SELECT provider_reference FROM payments LIMIT 1").get()?.provider_reference))}`)
      .expect(409);

    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get()?.count), 0);
    assert.equal(
      (database.prepare("SELECT status FROM applications WHERE id = ?").get(id) as { status: string }).status,
      "approved",
    );
  } finally {
    rmSync(uploadsPath, { recursive: true, force: true });
  }
});

test("applications with missing or spoofed required documents are not saved", async () => {
  const uploadsPath = mkdtempSync(path.join(os.tmpdir(), "oldam-upload-test-"));
  const database = openDatabase(":memory:");
  const { app } = createApp({ config: { ...config, uploadsPath }, database });
  try {
    await request(app)
      .post("/api/applications")
      .field("application", JSON.stringify(newApplication))
      .attach("id", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "national-id.jpg", contentType: "image/jpeg" })
      .attach("photo", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "passport.jpg", contentType: "image/jpeg" })
      .expect(400);

    await request(app)
      .post("/api/applications")
      .field("application", JSON.stringify(newApplication))
      .attach("id", Buffer.from("not an image"), { filename: "national-id.jpg", contentType: "image/jpeg" })
      .attach("photo", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "passport.jpg", contentType: "image/jpeg" })
      .attach("cert", Buffer.from("%PDF-1.4\n%%EOF"), { filename: "school-certificate.pdf", contentType: "application/pdf" })
      .expect(400);

    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM applications").get()?.count), 0);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM application_documents").get()?.count), 0);
  } finally {
    rmSync(uploadsPath, { recursive: true, force: true });
  }
});

test("rejected applications cannot be approved or create student accounts", async () => {
  const uploadsPath = mkdtempSync(path.join(os.tmpdir(), "oldam-rejection-test-"));
  const database = openDatabase(":memory:");
  const { app } = createApp({ config: { ...config, uploadsPath }, database });
  try {
    const admin = request.agent(app);
    await admin.post("/api/auth/login").send({ email: config.adminEmail, password: config.adminPassword }).expect(200);
    const submitted = await request(app)
      .post("/api/applications")
      .field("application", JSON.stringify(newApplication))
      .attach("id", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "national-id.jpg", contentType: "image/jpeg" })
      .attach("photo", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { filename: "passport.jpg", contentType: "image/jpeg" })
      .attach("cert", Buffer.from("%PDF-1.4\n%%EOF"), { filename: "school-certificate.pdf", contentType: "application/pdf" })
      .expect(201);
    const id = submitted.body.application.id as string;

    await admin.post(`/api/admin/applications/${id}/reject`).send().expect(200);
    await admin.post(`/api/admin/applications/${id}/approve`).send().expect(409);
    assert.equal(
      (database.prepare("SELECT status FROM applications WHERE id = ?").get(id) as { status: string }).status,
      "rejected",
    );
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").get()?.count), 0);
  } finally {
    rmSync(uploadsPath, { recursive: true, force: true });
  }
});

test("batch management is public for listings and administrator-only for mutations", async () => {
  const database = openDatabase(":memory:");
  const { app } = createApp({ config, database });
  const publicBatches = await request(app).get("/api/batches").expect(200);
  assert.ok(publicBatches.body.batches.some((batch: { id: string }) => batch.id === "TD-A"));
  await request(app).post("/api/admin/batches").send({}).expect(401);

  const admin = request.agent(app);
  await admin.post("/api/auth/login").send({ email: config.adminEmail, password: config.adminPassword }).expect(200);
  const start = new Date();
  start.setDate(start.getDate() + 120);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 10);
  const batch = {
    id: "new-d",
    programme: "truck-driving",
    start: start.toISOString().slice(0, 10),
    deadline: deadline.toISOString().slice(0, 10),
    mode: "Weekend",
    campus: "Lagos Campus",
    seats: 20,
    earlyBird: true,
  };
  const created = await admin.post("/api/admin/batches").send(batch).expect(201);
  assert.equal(created.body.batch.id, "NEW-D");

  const updated = await admin
    .patch("/api/admin/batches/NEW-D")
    .send({ ...batch, seats: 24 })
    .expect(200);
  assert.equal(updated.body.batch.seats, 24);
  await admin.delete("/api/admin/batches/NEW-D").expect(204);
  assert.ok(!(await request(app).get("/api/batches").expect(200)).body.batches.some((item: { id: string }) => item.id === "NEW-D"));
  await admin.patch("/api/admin/batches/TD-A").send({ ...batch, id: undefined, seats: 14 }).expect(409);
});
