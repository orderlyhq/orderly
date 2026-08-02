module.exports = {
  PORT: Number(process.env.PORT || 3001),

  NODE_ENV: process.env.NODE_ENV || "development",

  CLIENT_URL:
    process.env.CLIENT_URL || "http://localhost:5500",

  FIREBASE_PROJECT_ID:
    process.env.FIREBASE_PROJECT_ID || null,

  MERCADO_PAGO_PUBLIC_KEY:
    process.env.MERCADO_PAGO_PUBLIC_KEY || "",

  MERCADO_PAGO_ACCESS_TOKEN:
    process.env.MERCADO_PAGO_ACCESS_TOKEN || "",

  MERCADO_PAGO_WEBHOOK_SECRET:
    process.env.MERCADO_PAGO_WEBHOOK_SECRET || "",

  MERCADO_PAGO_ENV:
    process.env.MERCADO_PAGO_ENV || "sandbox",

  BEE_TOKEN:
    process.env.BEE_TOKEN || "",

  WHATSAPP_CLIENT_ID:
    process.env.WHATSAPP_CLIENT_ID || "orderly",
};