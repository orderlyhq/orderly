require("dotenv").config();

module.exports = {
  PORT: Number(process.env.PORT || 3001),

  NODE_ENV:
    process.env.NODE_ENV || "development",

  FIREBASE_SERVICE_ACCOUNT:
    process.env.FIREBASE_SERVICE_ACCOUNT,

  MERCADO_PAGO_ACCESS_TOKEN:
    process.env.MERCADO_PAGO_ACCESS_TOKEN || "",

  MERCADO_PAGO_WEBHOOK_SECRET:
    process.env.MERCADO_PAGO_WEBHOOK_SECRET || "",

  BEE_API_KEY:
    process.env.BEE_API_KEY || "",

  BEE_CLIENT_ID:
    process.env.BEE_CLIENT_ID || "",

  BEE_CLIENT_SECRET:
    process.env.BEE_CLIENT_SECRET || "",

  WHATSAPP_CLIENT_ID:
    process.env.WHATSAPP_CLIENT_ID || "orderly",

  APP_URL:
    process.env.APP_URL ||
    "https://useorderly.vercel.app",
};