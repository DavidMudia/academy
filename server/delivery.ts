import nodemailer from "nodemailer";
import type { AppConfig } from "./config";

export type DeliveryStatus = "sent" | "not_configured" | "failed";
export type DeliveryResult = {
  email: { status: DeliveryStatus; detail?: string };
  whatsapp: { status: DeliveryStatus; detail?: string };
};

export function phoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.startsWith("234")) return digits;
  return digits;
}

export async function deliverMessage(
  config: AppConfig,
  contact: { email: string; phone: string },
  subject: string,
  message: string,
): Promise<DeliveryResult> {
  const results: DeliveryResult = {
    email: { status: "not_configured", detail: "SMTP settings are missing." },
    whatsapp: { status: "not_configured", detail: "WhatsApp Cloud API settings are missing." },
  };

  if (config.smtpHost && config.smtpUser && config.smtpPassword && config.smtpFrom) {
    try {
      const mailer = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: { user: config.smtpUser, pass: config.smtpPassword },
      });
      await mailer.sendMail({ from: config.smtpFrom, to: contact.email, subject, text: message });
      results.email = { status: "sent" };
    } catch {
      results.email = { status: "failed", detail: "SMTP delivery failed; check the backend mail configuration." };
    }
  }

  if (config.whatsappAccessToken && config.whatsappPhoneNumberId && config.whatsappTemplateName) {
    const recipient = phoneForWhatsApp(contact.phone);
    if (!recipient) {
      results.whatsapp = { status: "failed", detail: "The application has no valid phone number." };
    } else {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${config.whatsappApiVersion}/${config.whatsappPhoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.whatsappAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: recipient,
              type: "template",
              template: {
                name: config.whatsappTemplateName,
                language: { code: config.whatsappTemplateLanguage },
                components: [
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: subject },
                      { type: "text", text: message },
                    ],
                  },
                ],
              },
            }),
            signal: AbortSignal.timeout(12_000),
          },
        );
        results.whatsapp = response.ok
          ? { status: "sent" }
          : { status: "failed", detail: "WhatsApp delivery failed; check the Cloud API configuration." };
      } catch {
        results.whatsapp = { status: "failed", detail: "WhatsApp delivery failed; check the network and Cloud API configuration." };
      }
    }
  }

  return results;
}
