import crypto from "crypto";
import { getDb } from "../_lib/firebase.js";

function obterAssinatura(headers) {
  return (
    headers["x-signature"] ||
    headers["X-Signature"] ||
    ""
  );
}

function obterRequestId(headers) {
  return (
    headers["x-request-id"] ||
    headers["X-Request-Id"] ||
    ""
  );
}

function extrairParametrosAssinatura(signature) {
  const partes = signature.split(",");

  const resultado = {};

  for (const parte of partes) {
    const [chave, valor] = parte.trim().split("=");

    if (chave && valor) {
      resultado[chave] = valor;
    }
  }

  return resultado;
}

function validarAssinatura(req, dataId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    console.error(
      "[Mercado Pago] MERCADO_PAGO_WEBHOOK_SECRET não configurado.",
    );

    return false;
  }

  const signature = obterAssinatura(req.headers);
  const requestId = obterRequestId(req.headers);

  if (!signature || !requestId || !dataId) {
    return false;
  }

  const parametros = extrairParametrosAssinatura(signature);

  const ts = parametros.ts;
  const v1 = parametros.v1;

  if (!ts || !v1) {
    return false;
  }

  const manifest =
    `id:${dataId};` +
    `request-id:${requestId};` +
    `ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(v1),
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método não permitido.",
    });
  }

  try {
    const body = req.body || {};

    const tipo = body.type || body.topic || null;

    const dataId =
      body?.data?.id ||
      req.query?.["data.id"] ||
      req.query?.id ||
      null;

    console.log("[Mercado Pago] Webhook recebido:", {
      tipo,
      dataId,
    });

    /*
     * Validação da assinatura.
     */
    if (!validarAssinatura(req, dataId)) {
      console.warn(
        "[Mercado Pago] Assinatura inválida.",
      );

      return res.status(401).json({
        success: false,
        message: "Assinatura inválida.",
      });
    }

    /*
     * Neste primeiro momento processamos apenas
     * notificações relacionadas a pagamentos.
     */
    if (tipo !== "payment") {
      console.log(
        "[Mercado Pago] Evento ignorado:",
        tipo,
      );

      return res.status(200).json({
        success: true,
        ignored: true,
      });
    }

    if (!dataId) {
      return res.status(400).json({
        success: false,
        message: "ID do pagamento não informado.",
      });
    }

    /*
     * Aqui iremos consultar o Mercado Pago
     * para obter o estado REAL do pagamento.
     */
    const accessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        "MERCADO_PAGO_ACCESS_TOKEN não configurado.",
      );
    }

    const resposta = await fetch(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!resposta.ok) {
      const texto = await resposta.text();

      console.error(
        "[Mercado Pago] Erro ao consultar pagamento:",
        resposta.status,
        texto,
      );

      return res.status(502).json({
        success: false,
        message: "Erro ao consultar pagamento.",
      });
    }

    const pagamento = await resposta.json();

    console.log(
      "[Mercado Pago] Pagamento:",
      pagamento.id,
      pagamento.status,
    );

    /*
     * Identificação da empresa.
     *
     * O external_reference será usado para
     * relacionar o pagamento à empresa Orderly.
     */
    const externalReference =
      pagamento.external_reference;

    if (!externalReference) {
      console.warn(
        "[Mercado Pago] Pagamento sem external_reference.",
      );

      return res.status(200).json({
        success: true,
        ignored: true,
        reason: "SEM_EXTERNAL_REFERENCE",
      });
    }

    const empresaId = externalReference;

    const db = getDb();

    const assinaturaRef = db
      .collection("empresas")
      .doc(empresaId)
      .collection("configuracoes")
      .doc("assinatura");

    /*
     * Atualiza a assinatura.
     */
    await assinaturaRef.set(
      {
        mercadoPagoPaymentId: String(pagamento.id),

        statusPagamento:
          pagamento.status || "unknown",

        statusDetalhado:
          pagamento.status_detail || null,

        valor:
          pagamento.transaction_amount || null,

        moeda:
          pagamento.currency_id || "BRL",

        metodoPagamento:
          pagamento.payment_method_id || null,

        atualizadoEm:
          new Date(),
      },
      {
        merge: true,
      },
    );

    console.log(
      `[Mercado Pago] Assinatura da empresa ${empresaId} atualizada.`,
    );

    return res.status(200).json({
      success: true,
      processed: true,
      empresaId,
      pagamentoId: pagamento.id,
      status: pagamento.status,
    });
  } catch (error) {
    console.error(
      "[Mercado Pago] Erro no webhook:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Erro interno ao processar webhook.",
    });
  }
}