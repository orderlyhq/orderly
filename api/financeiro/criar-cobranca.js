import { getDb } from "../_lib/firebase-admin.js";

function inicioDoDia(data) {
  const d = new Date(data);

  d.setHours(0, 0, 0, 0);

  return d;
}

function fimDoDia(data) {
  const d = new Date(data);

  d.setHours(23, 59, 59, 999);

  return d;
}

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function obterPeriodo(diaVencimento) {
  const hoje = new Date();

  /*
   * O próximo vencimento é o dia escolhido
   * pela loja.
   */
  let vencimento = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    diaVencimento,
  );

  /*
   * Se o vencimento deste mês já passou,
   * utiliza o próximo mês.
   */
  if (hoje >= vencimento) {
    vencimento.setMonth(vencimento.getMonth() + 1);
  }

  /*
   * O período termina no dia anterior
   * ao vencimento.
   */
  const fimPeriodo = fimDoDia(
    new Date(
      vencimento.getFullYear(),
      vencimento.getMonth(),
      vencimento.getDate() - 1,
    ),
  );

  /*
   * O período começa no dia seguinte ao
   * vencimento anterior.
   */
  const vencimentoAnterior = new Date(
    vencimento.getFullYear(),
    vencimento.getMonth() - 1,
    diaVencimento,
  );

  const inicioPeriodo = inicioDoDia(
    new Date(
      vencimentoAnterior.getFullYear(),
      vencimentoAnterior.getMonth(),
      vencimentoAnterior.getDate() + 1,
    ),
  );

  return {
    inicio: inicioPeriodo,
    fim: fimPeriodo,
    vencimento,
  };
}

async function calcularVendas(
  db,
  empresaId,
  inicio,
  fim,
) {
  const pedidosRef = db
    .collection("empresas")
    .doc(empresaId)
    .collection("pedidos");

  const snapshot = await pedidosRef
    .where("criadoEm", ">=", inicio)
    .where("criadoEm", "<=", fim)
    .get();

  let total = 0;

  snapshot.forEach((doc) => {
    const pedido = doc.data();

    /*
     * Pedidos cancelados não entram no
     * cálculo das vendas.
     */
    const status = String(
      pedido.status || "",
    ).toUpperCase();

    if (
      status === "CANCELADO" ||
      status === "CANCELADA"
    ) {
      return;
    }

    const valor = Number(
      pedido.valorTotal ??
        pedido.total ??
        pedido.valor ??
        0,
    );

    if (Number.isFinite(valor) && valor >= 0) {
      total += valor;
    }
  });

  return arredondar(total);
}

export default async function handler(req, res) {
  /*
   * Apenas POST.
   */
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método não permitido.",
    });
  }

  try {
    /*
     * IMPORTANTE:
     *
     * O cliente só pode informar empresaId.
     *
     * Não recebemos valor da cobrança.
     * Não recebemos vendasBrutas.
     * Não recebemos percentual.
     *
     * Esses valores vêm exclusivamente
     * do Firestore.
     */
    const { empresaId } = req.body || {};

    if (!empresaId || typeof empresaId !== "string") {
      return res.status(400).json({
        success: false,
        message: "empresaId é obrigatório.",
      });
    }

    const db = getDb();

    /*
     * Empresa.
     */
    const empresaRef = db
      .collection("empresas")
      .doc(empresaId);

    const empresaSnap = await empresaRef.get();

    if (!empresaSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada.",
      });
    }

    const empresa = empresaSnap.data();

    /*
     * Configuração financeira.
     */
    const financeiroRef = empresaRef
      .collection("configuracoes")
      .doc("financeiro");

    const financeiroSnap =
      await financeiroRef.get();

    const financeiro = financeiroSnap.exists
      ? financeiroSnap.data()
      : {};

    /*
     * Percentual definido pelo Orderly.
     *
     * O cliente NÃO pode alterar esse valor
     * através da requisição.
     */
    const percentual = Number(
      financeiro.percentualOrderly ?? 38,
    );

    if (
      !Number.isFinite(percentual) ||
      percentual < 0 ||
      percentual > 100
    ) {
      return res.status(500).json({
        success: false,
        message: "Percentual do Orderly inválido.",
      });
    }

    /*
     * Dia de vencimento escolhido pela loja.
     */
    const diaVencimento = Number(
      financeiro.diaVencimento ?? 10,
    );

    if (
      !Number.isInteger(diaVencimento) ||
      diaVencimento < 1 ||
      diaVencimento > 28
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Dia de vencimento inválido. Use de 1 a 28.",
      });
    }

    /*
     * Determina o período da cobrança.
     */
    const periodo = obterPeriodo(
      diaVencimento,
    );

    /*
     * =====================================================
     * CÁLCULO REAL DAS VENDAS
     * =====================================================
     *
     * O valor vem exclusivamente dos pedidos
     * armazenados no Firestore.
     *
     * O frontend não participa desse cálculo.
     */
    const vendasBrutas = await calcularVendas(
      db,
      empresaId,
      periodo.inicio,
      periodo.fim,
    );

    if (
      !Number.isFinite(vendasBrutas) ||
      vendasBrutas < 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Não foi possível calcular as vendas da empresa.",
      });
    }

    /*
     * =====================================================
     * CÁLCULO DA COBRANÇA
     * =====================================================
     */
    const valorCobranca = arredondar(
      vendasBrutas * (percentual / 100),
    );

    /*
     * Não cria PIX de valor zero.
     */
    if (valorCobranca <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Não é possível criar cobrança com valor zero.",
        vendasBrutas,
        percentualOrderly: percentual,
      });
    }

    /*
     * =====================================================
     * EVITA DUPLICAR COBRANÇA
     * =====================================================
     *
     * Antes de criar uma nova cobrança,
     * verifica se já existe uma cobrança para
     * o mesmo período.
     */
    const cobrancasRef = empresaRef.collection(
      "cobrancas",
    );

    const cobrancasExistentes =
      await cobrancasRef
        .where(
          "periodoInicio",
          "==",
          periodo.inicio,
        )
        .where(
          "periodoFim",
          "==",
          periodo.fim,
        )
        .limit(1)
        .get();

    if (!cobrancasExistentes.empty) {
      const docExistente =
        cobrancasExistentes.docs[0];

      const cobrancaExistente =
        docExistente.data();

      return res.status(200).json({
        success: true,
        alreadyExists: true,

        empresaId,

        cobrancaId:
          docExistente.id,

        vendasBrutas:
          cobrancaExistente.vendasBrutas,

        percentualOrderly:
          cobrancaExistente.percentualOrderly,

        valor:
          cobrancaExistente.valor,

        vencimento:
          cobrancaExistente.vencimento,

        status:
          cobrancaExistente.status,

        pixCopiaECola:
          cobrancaExistente.pixCopiaECola ||
          null,

        qrCodeBase64:
          cobrancaExistente.qrCodeBase64 ||
          null,
      });
    }

    /*
     * =====================================================
     * MERCADO PAGO
     * =====================================================
     */
    const accessToken =
      process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        "MERCADO_PAGO_ACCESS_TOKEN não configurado.",
      );
    }

    /*
     * Cria primeiro o documento da cobrança
     * para obter seu ID.
     */
    const cobrancaRef =
      cobrancasRef.doc();

    const cobrancaId =
      cobrancaRef.id;

    /*
     * Referência única usada pelo Mercado Pago.
     *
     * Formato:
     *
     * empresaId:cobrancaId
     */
    const externalReference =
      `${empresaId}:${cobrancaId}`;

    /*
     * =====================================================
     * CRIA PAGAMENTO PIX
     * =====================================================
     */
    const pagamentoPayload = {
      transaction_amount:
        valorCobranca,

      description:
        `Cobrança Orderly - ${
          empresa.nomeFantasia || empresaId
        }`,

      payment_method_id:
        "pix",

      external_reference:
        externalReference,

      payer: {
        email:
          empresa.email ||
          "financeiro@orderly.app",
      },
    };

    const resposta = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          /*
           * Impede duplicação da mesma requisição.
           */
          "X-Idempotency-Key":
            cobrancaId,
        },

        body: JSON.stringify(
          pagamentoPayload,
        ),
      },
    );

    if (!resposta.ok) {
      const texto =
        await resposta.text();

      console.error(
        "[Mercado Pago] Erro ao criar PIX:",
        resposta.status,
        texto,
      );

      return res.status(502).json({
        success: false,
        message:
          "Erro ao criar pagamento PIX.",
      });
    }

    const pagamento =
      await resposta.json();

    /*
     * Dados do PIX.
     */
    const pix =
      pagamento
        ?.point_of_interaction
        ?.transaction_data;

    /*
     * =====================================================
     * SALVA COBRANÇA NO FIRESTORE
     * =====================================================
     */
    const agora = new Date();

    await cobrancaRef.set({
      periodoInicio:
        periodo.inicio,

      periodoFim:
        periodo.fim,

      vencimento:
        periodo.vencimento,

      vendasBrutas,

      percentualOrderly:
        percentual,

      valor:
        valorCobranca,

      status:
        pagamento.status ||
        "pending",

      statusDetalhado:
        pagamento.status_detail ||
        null,

      mercadoPagoPaymentId:
        String(pagamento.id),

      externalReference,

      pixCopiaECola:
        pix?.qr_code || null,

      qrCodeBase64:
        pix?.qr_code_base64 || null,

      criadoEm:
        agora,

      atualizadoEm:
        agora,
    });

    console.log(
      `[Orderly] Cobrança ${cobrancaId} criada para ${empresaId}: R$ ${valorCobranca}`,
    );

    /*
     * =====================================================
     * RESPOSTA
     * =====================================================
     */
    return res.status(201).json({
      success: true,

      empresaId,

      cobrancaId,

      vendasBrutas,

      percentualOrderly:
        percentual,

      valor:
        valorCobranca,

      vencimento:
        periodo.vencimento,

      pagamentoId:
        pagamento.id,

      status:
        pagamento.status,

      pixCopiaECola:
        pix?.qr_code || null,

      qrCodeBase64:
        pix?.qr_code_base64 || null,
    });
  } catch (error) {
    console.error(
      "[Orderly] Erro ao criar cobrança:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Erro interno ao criar cobrança.",
    });
  }
}