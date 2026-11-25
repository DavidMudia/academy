import "dotenv/config";
import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const { app } = createApp({ config });

app.listen(config.port, "127.0.0.1", () => {
  console.log(`Oldam API listening on http://127.0.0.1:${config.port}`);
  if (!config.adminEmail || !config.adminPassword) {
    console.warn("Admin login is disabled until ADMIN_EMAIL and ADMIN_PASSWORD are configured.");
  }
  if (!config.paystackSecretKey) console.warn("Paystack checkout is disabled until PAYSTACK_SECRET_KEY is configured.");
});
