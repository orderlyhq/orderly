import {
  obterAssinatura,
  gerarPixAssinatura,
  consultarPagamento,
  listarPagamentos,
} from "../../js/services/assinatura.js";

/* ==========================================================
   ELEMENTOS DA TELA
========================================================== */

const planoAtual = document.getElementById("planoAtual");
const statusAssinatura = document.getElementById("statusAssinatura");
const valorPlano = document.getElementById("valorPlano");
const validadePlano = document.getElementById("validadePlano");

const proximoVencimento = document.getElementById("proximoVencimento");
const valorRenovacao = document.getElementById("valorRenovacao");
const tipoRenovacao = document.getElementById("tipoRenovacao");
const statusPagamento = document.getElementById("statusPagamento");

const pixQRCode = document.getElementById("pixQRCode");
const pixCodigo = document.getElementById("pixCodigo");
const pixStatus = document.getElementById("pixStatus");

const btnCopiarPix = document.getElementById("btnCopiarPix");
const btnAtualizarPix = document.getElementById("btnAtualizarPix");

const historicoPagamentos = document.getElementById("historicoPagamentos");

/* ==========================================================
   ESTADO
========================================================== */

let assinatura = null;

let pagamentoAtual = null;

let pollingPagamento = null;

let atualizacaoAutomatica = null;

/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const INTERVALO_ASSINATURA = 60000;

const INTERVALO_PIX = 5000;

/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

document.addEventListener("DOMContentLoaded", iniciarPagina);

/* ==========================================================
   START
========================================================== */

async function iniciarPagina() {
  registrarEventos();

  await carregarAssinatura();

  iniciarAtualizacaoAutomatica();
}

/* ==========================================================
   EVENTOS
========================================================== */

function registrarEventos() {
  btnCopiarPix?.addEventListener("click", copiarCodigoPix);

  btnAtualizarPix?.addEventListener("click", atualizarPagamentoManual);
}

/* ==========================================================
   TIMERS
========================================================== */

function iniciarAtualizacaoAutomatica() {
  pararAtualizacaoAutomatica();

  atualizacaoAutomatica = setInterval(async () => {
    try {
      await carregarAssinatura(false);
    } catch (erro) {
      console.error("[ASSINATURA] Erro atualização automática:", erro);
    }
  }, INTERVALO_ASSINATURA);
}

function pararAtualizacaoAutomatica() {
  if (atualizacaoAutomatica) {
    clearInterval(atualizacaoAutomatica);

    atualizacaoAutomatica = null;
  }
}

function iniciarPollingPagamento() {
  pararPollingPagamento();

  pollingPagamento = setInterval(async () => {
    if (!pagamentoAtual?.id) return;

    try {
      await consultarStatusPagamento();
    } catch (erro) {
      console.error("[ASSINATURA] Erro consultando pagamento:", erro);
    }
  }, INTERVALO_PIX);
}

function pararPollingPagamento() {
  if (pollingPagamento) {
    clearInterval(pollingPagamento);

    pollingPagamento = null;
  }
}

/* ==========================================================
   LIMPEZA
========================================================== */

window.addEventListener("beforeunload", () => {
  pararPollingPagamento();

  pararAtualizacaoAutomatica();
});

/* ==========================================================
   CARREGAMENTO DA ASSINATURA
========================================================== */

async function carregarAssinatura(gerarPix = true) {
  try {
    assinatura = await obterAssinatura();

    atualizarCards();

    await carregarHistorico();

    if (gerarPix) {
      await carregarPagamentoPix();
    }
  } catch (erro) {
    console.error("[ASSINATURA] Erro:", erro);

    pixStatus.textContent = "Não foi possível carregar a assinatura.";
  }
}

/* ==========================================================
   PAGAMENTO PIX
========================================================== */

async function carregarPagamentoPix() {
  try {
    pixStatus.textContent = "Gerando cobrança PIX...";

    pagamentoAtual = await gerarPixAssinatura();

    atualizarPix();

    iniciarPollingPagamento();
  } catch (erro) {
    console.error("[ASSINATURA] Erro ao gerar PIX:", erro);

    pixStatus.textContent = "Erro ao gerar cobrança.";
  }
}

async function atualizarPagamentoManual() {
  btnAtualizarPix.disabled = true;

  try {
    await carregarPagamentoPix();
  } finally {
    btnAtualizarPix.disabled = false;
  }
}

/* ==========================================================
   ATUALIZAÇÃO DA INTERFACE
========================================================== */

function atualizarCards() {
  if (!assinatura) return;

  planoAtual.textContent = assinatura.plano || "-";

  valorPlano.textContent = formatarMoeda(assinatura.valor);

  validadePlano.textContent = formatarData(assinatura.validade);

  proximoVencimento.textContent = formatarData(assinatura.proximoVencimento);

  valorRenovacao.textContent = formatarMoeda(
    assinatura.valorRenovacao ?? assinatura.valor,
  );

  tipoRenovacao.textContent = assinatura.recorrencia || "Mensal";

  atualizarBadgeAssinatura(assinatura.status);
}

function atualizarPix() {
  if (!pagamentoAtual) return;

  if (pagamentoAtual?.qrCode) {
    pixQRCode.src = pagamentoAtual.qrCode;
  } else {
    pixQRCode.removeAttribute("src");
  }

  pixCodigo.value = pagamentoAtual.codigoPix || "";

  atualizarBadgePagamento(pagamentoAtual.status);

  switch (pagamentoAtual.status) {
    case "approved":
      pixStatus.textContent = "Pagamento aprovado.";

      pararPollingPagamento();

      break;

    case "pending":
      pixStatus.textContent = "Aguardando pagamento...";

      break;

    case "cancelled":
      pixStatus.textContent = "Cobrança cancelada.";

      pararPollingPagamento();

      break;

    case "expired":
      pixStatus.textContent = "PIX expirado.";

      pararPollingPagamento();

      break;

    default:
      pixStatus.textContent = "Aguardando pagamento.";
  }
}

/* ==========================================================
   BADGES
========================================================== */

function atualizarBadgeAssinatura(status) {
  statusAssinatura.textContent = status || "-";

  statusAssinatura.className = "status-badge";

  statusAssinatura.classList.add(obterClasseStatus(status));
}

function atualizarBadgePagamento(status) {
  statusPagamento.textContent = traduzirStatus(status);

  statusPagamento.className = "status-badge";

  statusPagamento.classList.add(obterClasseStatus(status));
}

/* ==========================================================
   CONSULTA DO STATUS DO PAGAMENTO (POLLING)
========================================================== */

async function consultarStatusPagamento() {
  if (!pagamentoAtual?.id) return;

  try {
    const pagamento = await consultarPagamento(pagamentoAtual.id);

    if (!pagamento) return;

    pagamentoAtual = pagamento;

    atualizarPix();

    if (pagamento.status === "approved") {
      await carregarAssinatura(false);

      pararPollingPagamento();
    }
  } catch (erro) {
    console.error("[ASSINATURA] Erro ao consultar pagamento:", erro);
  }
}

/* ==========================================================
   HISTÓRICO DE PAGAMENTOS
========================================================== */

async function carregarHistorico() {
  try {
    const pagamentos = await listarPagamentos();

    renderizarHistorico(pagamentos || []);
  } catch (erro) {
    console.error("[ASSINATURA] Erro ao carregar histórico:", erro);

    historicoPagamentos.innerHTML = `
      <tr>
        <td colspan="6">
          Não foi possível carregar o histórico.
        </td>
      </tr>
    `;
  }
}

function renderizarHistorico(lista) {
  if (!lista.length) {
    historicoPagamentos.innerHTML = `
      <tr>
        <td colspan="6">
          Nenhum pagamento encontrado.
        </td>
      </tr>
    `;

    return;
  }

  historicoPagamentos.innerHTML = lista
    .map(
      (item) => `
        <tr>

          <td>
            ${formatarData(item.data)}
          </td>

          <td>
            ${item.plano || "-"}
          </td>

          <td>
            ${formatarMoeda(item.valor)}
          </td>

          <td>
            ${item.metodo || "PIX"}
          </td>

          <td>

            <span class="status-badge ${obterClasseStatus(item.status)}">

              ${traduzirStatus(item.status)}

            </span>

          </td>

          <td>

            ${
              item.comprovante
                ? `
                  <a
                    href="${item.comprovante}"
                    target="_blank"
                  >
                    Visualizar
                  </a>
                `
                : "-"
            }

          </td>

        </tr>
      `,
    )
    .join("");
}

/* ==========================================================
   COPIAR PIX
========================================================== */

async function copiarCodigoPix() {
  const codigo = pixCodigo.value.trim();

  if (!codigo) return;

  try {
    await navigator.clipboard.writeText(codigo);

    const textoOriginal = btnCopiarPix.textContent;

    btnCopiarPix.textContent = "✅ Copiado";

    setTimeout(() => {
      btnCopiarPix.textContent = textoOriginal;
    }, 2000);
  } catch (erro) {
    console.error("[ASSINATURA] Erro ao copiar PIX:", erro);

    alert("Não foi possível copiar o código PIX.");
  }
}

/* ==========================================================
   STATUS
========================================================== */

function traduzirStatus(status) {
  switch (status) {
    case "approved":
      return "Pago";

    case "pending":
      return "Pendente";

    case "cancelled":
      return "Cancelado";

    case "expired":
      return "Expirado";

    case "rejected":
      return "Recusado";

    case "refunded":
      return "Estornado";

    default:
      return status || "-";
  }
}

function obterClasseStatus(status) {
  switch (status) {
    case "approved":
    case "ATIVA":
    case "ATIVO":
      return "success";

    case "pending":
    case "PENDENTE":
      return "warning";

    case "cancelled":
    case "CANCELADA":
    case "INATIVA":
      return "danger";

    case "expired":
      return "secondary";

    default:
      return "info";
  }
}

/* ==========================================================
   FORMATAÇÃO
========================================================== */

function formatarMoeda(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "--";

  try {
    if (typeof data?.toDate === "function") {
      data = data.toDate();
    }

    if (typeof data?.seconds === "number") {
      data = new Date(data.seconds * 1000);
    }

    if (!(data instanceof Date)) {
      data = new Date(data);
    }

    if (Number.isNaN(data.getTime())) {
      return "--";
    }

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (erro) {
    console.error("[ASSINATURA] Erro ao formatar data:", erro);

    return "--";
  }
}

function formatarDataHora(data) {
  if (!data) return "--";

  try {
    if (typeof data?.toDate === "function") {
      data = data.toDate();
    }

    if (typeof data?.seconds === "number") {
      data = new Date(data.seconds * 1000);
    }

    if (!(data instanceof Date)) {
      data = new Date(data);
    }

    if (Number.isNaN(data.getTime())) {
      return "--";
    }

    return data.toLocaleString("pt-BR");
  } catch {
    return "--";
  }
}

/* ==========================================================
   UTILITÁRIOS
========================================================== */

function definirTexto(elemento, valor, padrao = "--") {
  if (!elemento) return;

  elemento.textContent =
    valor === undefined || valor === null || valor === "" ? padrao : valor;
}

function definirValor(elemento, valor) {
  if (!elemento) return;

  elemento.value = valor ?? "";
}

function mostrarErro(mensagem) {
  console.error("[ASSINATURA]", mensagem);

  if (pixStatus) {
    pixStatus.textContent = mensagem;
  }
}

function limparPix() {
  pagamentoAtual = null;

  if (pixQRCode) {
    pixQRCode.removeAttribute("src");
  }

  definirValor(pixCodigo, "");

  definirTexto(pixStatus, "Nenhuma cobrança disponível.");

  atualizarBadgePagamento("pending");
}

/* ==========================================================
   DEBUG
========================================================== */

window.assinaturaDebug = {
  carregarAssinatura,
  carregarPagamentoPix,
  consultarStatusPagamento,
  carregarHistorico,
  atualizarCards,
};

console.log("[ASSINATURA] Módulo carregado com sucesso.");
