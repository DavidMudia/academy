import path from "node:path";

export type AppConfig = {
  port: number;
  databasePath: string;
  uploadsPath: string;
  frontendUrl: string;
  publicApiUrl: string;
  nodeEnv: string;
  adminEmail: string;
  adminPassword: string;
  paystackSecretKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappApiVersion: string;
  whatsappTemplateName: string;
  whatsappTemplateLanguage: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 4000),
    databasePath: path.resolve(env.DATABASE_PATH ?? "server/data/oldam.sqlite"),
    uploadsPath: path.resolve(env.UPLOADS_PATH ?? "server/data/uploads"),
    frontendUrl: (env.FRONTEND_URL ?? "http://127.0.0.1:5173").replace(/\/+$/, ""),
    publicApiUrl: (env.PUBLIC_API_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, ""),
    nodeEnv: env.NODE_ENV ?? "development",
    adminEmail: (env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
    adminPassword: env.ADMIN_PASSWORD ?? "",
    paystackSecretKey: env.PAYSTACK_SECRET_KEY ?? "",
    smtpHost: env.SMTP_HOST ?? "",
    smtpPort: Number(env.SMTP_PORT ?? 587),
    smtpUser: env.SMTP_USER ?? "",
    smtpPassword: env.SMTP_PASSWORD ?? "",
    smtpFrom: env.SMTP_FROM ?? "",
    whatsappAccessToken: env.WHATSAPP_ACCESS_TOKEN ?? "",
    whatsappPhoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    whatsappApiVersion: env.WHATSAPP_API_VERSION ?? "v22.0",
    whatsappTemplateName: env.WHATSAPP_TEMPLATE_NAME ?? "",
    whatsappTemplateLanguage: env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en",
  };
}
