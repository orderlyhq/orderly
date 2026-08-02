const env = require("./env");

let mercadoPago = null;

try {
  const { MercadoPagoConfig } = require("mercadopago");

  if (env.MERCADO_PAGO_ACCESS_TOKEN) {
    mercadoPago = new MercadoPagoConfig({
      accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
    });
  }
} catch (erro) {
  console.warn(
    "[Mercado Pago] SDK ainda não instalada."
  );
}

module.exports = mercadoPago;