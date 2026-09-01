import crypto from "crypto";
import { getDb } from "../_lib/firebase-admin.js";

function obterAssinatura(headers) {
  return headers["x-signature"] || "";
}

function obterRequestId(headers) {
  return headers["x-request-id"] || "";
}

function extrairParametrosAssinatura(signature) {
  const resultado = {};

  for (const parte of signature.split(",")) {
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

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(v1, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
}

function extrairReferencia(externalReference) {
  if (!externalReference) {
    return null;
  }

  /*
   * Formato esperado:
   *
   * empresaId:cobrancaId
   */

  const partes = externalReference.split(":");

  if (partes.length !== 2) {
    return null;
  }

  const [empresaId, cobrancaId] = partes;

  if (!empresaId || !cobrancaId) {
    return null;
  }

  return {
    empresaId,
    cobrancaId,
  };
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

    if (!dataId) {
      return res.status(400).json({
        success: false,
        message: "ID do pagamento não informado.",
      });
    }

    /*
     * Valida assinatura antes de processar.
     */

    if (!validarAssinatura(req, String(dataId))) {
      console.warn(
        "[Mercado Pago] Assinatura inválida.",
      );

      return res.status(401).json({
        success: false,
        message: "Assinatura inválida.",
      });
    }

    /*
     * Só processamos pagamentos.
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

    const accessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        "MERCADO_PAGO_ACCESS_TOKEN não configurado.",
      );
    }

    /*
     * Consulta o pagamento diretamente
     * no Mercado Pago.
     */

    const resposta = await fetch(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      {
        method: "GET",

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
     * Recupera empresa + cobrança.
     */

    const referencia = extrairReferencia(
      pagamento.external_reference,
    );

    if (!referencia) {
      console.warn(
        "[Mercado Pago] external_reference inválido:",
        pagamento.external_reference,
      );

      return res.status(200).json({
        success: true,
        ignored: true,
        reason: "EXTERNAL_REFERENCE_INVALIDO",
      });
    }

    const {
      empresaId,
      cobrancaId,
    } = referencia;

    const db = getDb();

    const empresaRef = db
      .collection("empresas")
      .doc(empresaId);

    const cobrancaRef = empresaRef
      .collection("cobrancas")
      .doc(cobrancaId);

    /*
     * Busca a cobrança.
     */

    const cobrancaSnap = await cobrancaRef.get();

    if (!cobrancaSnap.exists) {
      console.warn(
        "[Mercado Pago] Cobrança não encontrada:",
        cobrancaId,
      );

      return res.status(200).json({
        success: true,
        ignored: true,
        reason: "COBRANCA_NAO_ENCONTRADA",
      });
    }

    /*
     * Atualiza cobrança.
     */

    const statusPagamento =
      pagamento.status || "unknown";

    const atualizacao = {
      mercadoPagoPaymentId: String(pagamento.id),

      status: statusPagamento,

      statusDetalhado:
        pagamento.status_detail || null,

      atualizadoEm: new Date(),
    };

    if (pagamento.date_approved) {
      atualizacao.pagoEm = new Date(
        pagamento.date_approved,
      );
    }

    await cobrancaRef.set(
      atualizacao,
      {
        merge: true,
      },
    );

    /*
     * Se o pagamento foi aprovado,
     * libera a empresa.
     */

    if (statusPagamento === "approved") {
      await empresaRef.set(
        {
          bloqueada: false,

          motivoBloqueio: null,

          ultimaCobrancaPaga: cobrancaId,

          atualizadoEm: new Date(),
        },
        {
          merge: true,
        },
      );

      console.log(
        `[Mercado Pago] Cobrança ${cobrancaId} paga. Empresa ${empresaId} desbloqueada.`,
      );
    }

    /*
     * Pagamento rejeitado/cancelado.
     *
     * Não bloqueamos imediatamente.
     * O bloqueio acontece pelo vencimento.
     */

    console.log(
      `[Mercado Pago] Cobrança ${cobrancaId} atualizada para ${statusPagamento}.`,
    );

    return res.status(200).json({
      success: true,

      processed: true,

      empresaId,

      cobrancaId,

      pagamentoId: pagamento.id,

      status: statusPagamento,
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