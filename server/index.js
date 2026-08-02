require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",

  FIREBASE_SERVICE_ACCOUNT:
    process.env.FIREBASE_SERVICE_ACCOUNT,

  MERCADOPAGO_ACCESS_TOKEN:
    process.env.MERCADOPAGO_ACCESS_TOKEN,

  MERCADOPAGO_WEBHOOK_SECRET:
    process.env.MERCADOPAGO_WEBHOOK_SECRET,

  BEE_API_KEY:
    process.env.BEE_API_KEY,

  BEE_CLIENT_ID:
    process.env.BEE_CLIENT_ID,

  BEE_CLIENT_SECRET:
    process.env.BEE_CLIENT_SECRET,

  WHATSAPP_CLIENT_ID:
    process.env.WHATSAPP_CLIENT_ID || "orderly",

  APP_URL:
    process.env.APP_URL,
};