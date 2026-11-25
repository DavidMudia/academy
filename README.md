# Oldam Academy application workflow

The project contains a Vite/React frontend and a TypeScript Express API. The API uses a local SQLite database and owns application approval, payment verification, student-account creation, and notification delivery.

## Run locally

1. Use Node.js 22.13 or newer.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and set a unique `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` of at least 12 characters.
4. Configure the Paystack secret key, SMTP settings, and WhatsApp Cloud API settings.
5. Run `npm run dev`. The frontend runs at `http://127.0.0.1:5173`, and the API runs at `http://127.0.0.1:4000`.
6. Open `http://127.0.0.1:5173/#/admin` to review applications.

The SQLite file is created at `server/data/oldam.sqlite`. Keep `.env`, the database, and student records out of source control.

## Personal protective equipment

High-quality personal protective equipment (PPE) is available for purchase from the academy at affordable prices. Contact the academy through the Contact page for product and availability details.

## Registration and payment rules

1. An applicant submits contact information and an application. No student account is created yet.
2. An administrator reviews the application and either rejects it or approves it. Rejected applicants are notified and cannot pay. For approved applications, the API creates a one-time payment link, then attempts to send it by email and WhatsApp. The admin screen displays each channel's delivery result and lets the admin copy or resend the link.
3. The applicant opens the link and checks out through Paystack. The API verifies the transaction directly with Paystack and checks the reference, amount, currency, and application metadata.
4. Only after successful verification does the API mark the application paid and create a student account. It then sends the portal credentials through configured email and WhatsApp channels. Admins can issue a fresh password and resend credentials if delivery fails.

`PUBLIC_API_URL` must be reachable by Paystack for its callback/webhook in a deployed environment. For local development, use a public HTTPS tunnel or a staging URL. Never put the Paystack secret key in frontend code.

WhatsApp Cloud API outbound messages use an approved template configured by `WHATSAPP_TEMPLATE_NAME`. Configure that template with two body parameters: `{{1}}` for the message subject and `{{2}}` for the message body. If a delivery provider is not configured or rejects a message, the admin screen reports the delivery status rather than claiming it was sent.

## API endpoints

- `POST /api/applications` — public application submission
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` — admin/student sessions
- `GET /api/admin/applications` — administrator-only application queue
- `GET /api/batches` — available batches and paid seat counts
- `POST /api/admin/batches`, `PATCH /api/admin/batches/:id`, `DELETE /api/admin/batches/:id` — administrator-only batch management
- `POST /api/admin/applications/:id/approve` — approve and issue a payment link
- `POST /api/admin/applications/:id/reject` — reject an application awaiting review
- `POST /api/admin/applications/:id/payment-link` — rotate and resend an approved application's link
- `GET /api/admin/applications/:applicationId/documents/:documentId` — administrator-only uploaded documents
- `POST /api/payments/initialize` — start Paystack checkout with a valid link
- `GET /api/payments/callback`, `POST /api/payments/webhook` — verify payment and register the student
- `GET /api/applications/mine` — authenticated student's applications

For production, serve the frontend and API on the same site or configure a credentialed reverse proxy, use HTTPS, and set the environment URLs to the public origins.
