import { auth } from "./firebase.js";

/* ==========================================================
   CONFIGURAÇÃO
========================================================== */

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3001/api"
    : "/api";

/* ==========================================================
   ENDPOINTS
========================================================== */

const ENDPOINTS = {
  ASSINATURA: "/assinatura",
  PIX: "/mercadopago/pix",
  PAGAMENTO: "/mercadopago/pagamento",
  HISTORICO: "/assinatura/historico",
};

/* ==========================================================
   TIMEOUT
========================================================== */

const REQUEST_TIMEOUT = 30000;

/* ==========================================================
   TOKEN FIREBASE
========================================================== */

async function obterToken() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  return usuario.getIdToken(true);
}

/* ==========================================================
   CABEÇALHOS
========================================================== */

async function criarHeaders() {
  const token = await obterToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/* ==========================================================
   URL
========================================================== */

function montarUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}

/* ==========================================================
   FETCH COM TIMEOUT
========================================================== */

async function request(
  endpoint,
  options = {},
) {
  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const headers =
      await criarHeaders();

    const resposta = await fetch(
      montarUrl(endpoint),
      {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    return tratarResposta(
      resposta,
    );
  } catch (erro) {
    clearTimeout(timeout);

    if (
      erro.name === "AbortError"
    ) {
      throw new Error(
        "Tempo limite da requisição excedido."
      );
    }

    throw erro;
  }
}

/* ==========================================================
   RESPOSTA
========================================================== */

async function tratarResposta(
  response,
) {
  let dados = {};

  try {
    dados =
      await response.json();
  } catch {
    dados = {};
  }

  if (!response.ok) {
    throw new Error(
      dados.message ||
        "Erro ao comunicar com o servidor."
    );
  }

  return dados;
}

/* ==========================================================
   MÉTODOS HTTP
========================================================== */

export function httpGet(endpoint) {
  return request(endpoint, {
    method: "GET",
  });
}

export function httpPost(
  endpoint,
  body = {},
) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function httpPut(
  endpoint,
  body = {},
) {
  return request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function httpDelete(
  endpoint,
) {
  return request(endpoint, {
    method: "DELETE",
  });
}

/* ==========================================================
   ASSINATURA
========================================================== */

/**
 * Obtém a assinatura atual da empresa
 */
export async function obterAssinatura() {
  return httpGet(
    ENDPOINTS.ASSINATURA,
  );
}

/**
 * Cria uma nova assinatura
 */
export async function criarAssinatura({
  plano,
  periodo = "mensal",
  cupom = null,
} = {}) {
  return httpPost(
    ENDPOINTS.ASSINATURA,
    {
      plano,
      periodo,
      cupom,
    },
  );
}

/**
 * Atualiza informações da assinatura
 */
export async function atualizarAssinatura(
  dados = {},
) {
  return httpPut(
    ENDPOINTS.ASSINATURA,
    dados,
  );
}

/**
 * Altera o plano
 */
export async function alterarPlano(
  plano,
  periodo = "mensal",
) {
  return httpPut(
    `${ENDPOINTS.ASSINATURA}/plano`,
    {
      plano,
      periodo,
    },
  );
}

/**
 * Agenda o cancelamento
 */
export async function cancelarAssinatura(
  motivo = "",
) {
  return httpPost(
    `${ENDPOINTS.ASSINATURA}/cancelar`,
    {
      motivo,
    },
  );
}

/**
 * Reativa assinatura cancelada
 */
export async function reativarAssinatura() {
  return httpPost(
    `${ENDPOINTS.ASSINATURA}/reativar`,
  );
}

/**
 * Renova imediatamente
 */
export async function renovarAssinatura() {
  return httpPost(
    `${ENDPOINTS.ASSINATURA}/renovar`,
  );
}

/**
 * Consulta apenas o status
 */
export async function obterStatusAssinatura() {
  return httpGet(
    `${ENDPOINTS.ASSINATURA}/status`,
  );
}

/**
 * Próxima cobrança
 */
export async function obterProximaCobranca() {
  return httpGet(
    `${ENDPOINTS.ASSINATURA}/proxima-cobranca`,
  );
}

/**
 * Verifica se a assinatura está ativa
 */
export async function assinaturaAtiva() {
  const resposta =
    await obterStatusAssinatura();

  return (
    resposta.status === "ATIVA" ||
    resposta.status === "active"
  );
}

/* ==========================================================
   MERCADO PAGO
========================================================== */

/**
 * Gera uma nova cobrança PIX para a assinatura.
 */
export async function gerarPixAssinatura(opcoes = {}) {
  return httpPost(
    ENDPOINTS.PIX,
    {
      ...opcoes,
    },
  );
}

/**
 * Consulta um pagamento específico.
 */
export async function consultarPagamento(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "ID do pagamento não informado."
    );
  }

  return httpGet(
    `${ENDPOINTS.PAGAMENTO}/${pagamentoId}`,
  );
}

/**
 * Consulta vários pagamentos pelo ID.
 */
export async function consultarPagamentos(
  pagamentos = [],
) {
  return Promise.all(
    pagamentos.map((id) =>
      consultarPagamento(id),
    ),
  );
}

/**
 * Atualiza manualmente uma cobrança PIX.
 */
export async function atualizarPagamento(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "Pagamento inválido."
    );
  }

  return httpPost(
    `${ENDPOINTS.PAGAMENTO}/${pagamentoId}/atualizar`,
  );
}

/**
 * Cancela uma cobrança PIX.
 */
export async function cancelarPagamento(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "Pagamento inválido."
    );
  }

  return httpPost(
    `${ENDPOINTS.PAGAMENTO}/${pagamentoId}/cancelar`,
  );
}

/**
 * Gera uma nova cobrança para substituir
 * um PIX expirado.
 */
export async function regenerarPix(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "Pagamento inválido."
    );
  }

  return httpPost(
    `${ENDPOINTS.PAGAMENTO}/${pagamentoId}/regenerar`,
  );
}

/**
 * Renova a cobrança da assinatura.
 * O backend cria um novo pagamento
 * no Mercado Pago.
 */
export async function renovarCobranca() {
  return httpPost(
    `${ENDPOINTS.PIX}/renovar`,
  );
}

/**
 * Obtém o QR Code atual da cobrança.
 */
export async function obterQRCodeAtual() {
  return httpGet(
    `${ENDPOINTS.PIX}/atual`,
  );
}

/**
 * Verifica se existe uma cobrança pendente.
 */
export async function existePixPendente() {
  const resposta =
    await obterQRCodeAtual();

  return (
    resposta &&
    resposta.status === "pending"
  );
}

/* ==========================================================
   HISTÓRICO DE PAGAMENTOS
========================================================== */

/**
 * Lista o histórico completo da assinatura.
 */
export async function listarPagamentos(
  filtros = {},
) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(
    ([chave, valor]) => {
      if (
        valor !== undefined &&
        valor !== null &&
        valor !== ""
      ) {
        params.append(chave, valor);
      }
    },
  );

  const query = params.toString();

  return httpGet(
    query
      ? `${ENDPOINTS.HISTORICO}?${query}`
      : ENDPOINTS.HISTORICO,
  );
}

/**
 * Obtém um pagamento específico.
 */
export async function obterPagamento(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "Pagamento inválido."
    );
  }

  return httpGet(
    `${ENDPOINTS.HISTORICO}/${pagamentoId}`,
  );
}

/**
 * Baixa o comprovante.
 */
export async function obterComprovante(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "Pagamento inválido."
    );
  }

  return httpGet(
    `${ENDPOINTS.HISTORICO}/${pagamentoId}/comprovante`,
  );
}

/**
 * Reenvia o comprovante por e-mail.
 */
export async function reenviarComprovante(
  pagamentoId,
) {
  if (!pagamentoId) {
    throw new Error(
      "Pagamento inválido."
    );
  }

  return httpPost(
    `${ENDPOINTS.HISTORICO}/${pagamentoId}/reenviar`,
  );
}

/* ==========================================================
   MÉTODOS DE PAGAMENTO
========================================================== */

/**
 * Lista os métodos cadastrados.
 */
export async function listarMetodosPagamento() {
  return httpGet(
    `${ENDPOINTS.ASSINATURA}/metodos`
  );
}

/**
 * Define o método padrão.
 */
export async function definirMetodoPadrao(
  metodoId,
) {
  return httpPut(
    `${ENDPOINTS.ASSINATURA}/metodos/padrao`,
    {
      metodoId,
    },
  );
}

/**
 * Remove um método salvo.
 */
export async function removerMetodoPagamento(
  metodoId,
) {
  return httpDelete(
    `${ENDPOINTS.ASSINATURA}/metodos/${metodoId}`,
  );
}

/**
 * Atualiza um método salvo.
 */
export async function atualizarMetodoPagamento(
  metodoId,
  dados = {},
) {
  return httpPut(
    `${ENDPOINTS.ASSINATURA}/metodos/${metodoId}`,
    dados,
  );
}

/**
 * Cria um novo método.
 * (cartão ou outro método futuro)
 */
export async function adicionarMetodoPagamento(
  dados = {},
) {
  return httpPost(
    `${ENDPOINTS.ASSINATURA}/metodos`,
    dados,
  );
}

/* ==========================================================
   FUNÇÕES AUXILIARES
========================================================== */

function normalizarResposta(resposta) {
  if (!resposta) return null;

  if (resposta.success && resposta.data) {
    return resposta.data;
  }

  return resposta;
}

function criarErro(mensagem, status = 500, detalhes = null) {
  const erro = new Error(mensagem);

  erro.status = status;
  erro.details = detalhes;

  return erro;
}

function validarEmpresaId(empresaId) {
  if (!empresaId) {
    throw criarErro("Empresa não identificada.", 400);
  }

  return empresaId;
}

function validarPagamentoId(pagamentoId) {
  if (!pagamentoId) {
    throw criarErro("Pagamento inválido.", 400);
  }

  return pagamentoId;
}

function validarAssinaturaId(assinaturaId) {
  if (!assinaturaId) {
    throw criarErro("Assinatura inválida.", 400);
  }

  return assinaturaId;
}

function validarPlano(plano) {
  if (!plano) {
    throw criarErro("Plano não informado.", 400);
  }

  return plano;
}

export function assinaturaEstaAtiva(assinatura) {
  if (!assinatura) return false;

  return (
    assinatura.status === "ATIVA" ||
    assinatura.status === "ACTIVE"
  );
}

export function assinaturaEstaPendente(assinatura) {
  if (!assinatura) return false;

  return (
    assinatura.status === "PENDENTE" ||
    assinatura.status === "PENDING"
  );
}

export function assinaturaCancelada(assinatura) {
  if (!assinatura) return false;

  return (
    assinatura.status === "CANCELADA" ||
    assinatura.status === "CANCELLED"
  );
}

export function assinaturaVencida(assinatura) {
  if (!assinatura) return false;

  return (
    assinatura.status === "VENCIDA" ||
    assinatura.status === "EXPIRED"
  );
}

export function pagamentoAprovado(pagamento) {
  if (!pagamento) return false;

  return (
    pagamento.status === "approved" ||
    pagamento.status === "APROVADO" ||
    pagamento.status === "PAGO"
  );
}

export function pagamentoPendente(pagamento) {
  if (!pagamento) return false;

  return (
    pagamento.status === "pending" ||
    pagamento.status === "PENDENTE"
  );
}

export function pagamentoRecusado(pagamento) {
  if (!pagamento) return false;

  return (
    pagamento.status === "rejected" ||
    pagamento.status === "RECUSADO"
  );
}

export function pagamentoCancelado(pagamento) {
  if (!pagamento) return false;

  return (
    pagamento.status === "cancelled" ||
    pagamento.status === "CANCELADO"
  );
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(data) {
  if (!data) return "-";

  if (data.toDate) {
    data = data.toDate();
  }

  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatarDataHora(data) {
  if (!data) return "-";

  if (data.toDate) {
    data = data.toDate();
  }

  return new Date(data).toLocaleString("pt-BR");
}

export function diasRestantes(dataVencimento) {
  if (!dataVencimento) return 0;

  if (dataVencimento.toDate) {
    dataVencimento = dataVencimento.toDate();
  }

  const hoje = new Date();

  const vencimento = new Date(dataVencimento);

  const diferenca = vencimento.getTime() - hoje.getTime();

  return Math.ceil(diferenca / 86400000);
}

export function calcularProximoVencimento(dataBase) {
  if (!dataBase) {
    return null;
  }

  if (dataBase.toDate) {
    dataBase = dataBase.toDate();
  }

  const data = new Date(dataBase);

  data.setMonth(data.getMonth() + 1);

  return data;
}

export function obterCorStatus(status) {
  switch (String(status || "").toUpperCase()) {
    case "ATIVA":
    case "ACTIVE":
    case "PAGO":
    case "APPROVED":
      return "#2ecc71";

    case "PENDENTE":
    case "PENDING":
      return "#f39c12";

    case "CANCELADA":
    case "CANCELLED":
    case "RECUSADO":
    case "REJECTED":
      return "#e74c3c";

    case "VENCIDA":
    case "EXPIRED":
      return "#7f8c8d";

    default:
      return "#3b82f6";
  }
}

export function obterTextoStatus(status) {
  switch (String(status || "").toUpperCase()) {
    case "ATIVA":
    case "ACTIVE":
      return "Ativa";

    case "PENDENTE":
    case "PENDING":
      return "Pendente";

    case "PAGO":
    case "APPROVED":
      return "Pago";

    case "PROCESSANDO":
      return "Processando";

    case "RECUSADO":
    case "REJECTED":
      return "Recusado";

    case "CANCELADA":
    case "CANCELLED":
      return "Cancelada";

    case "VENCIDA":
    case "EXPIRED":
      return "Vencida";

    default:
      return "Desconhecido";
  }
}