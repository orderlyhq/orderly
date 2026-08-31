import { configuracoesRef } from "../services/firestore-paths.js";
import { bootstrapEmpresa } from "../services/bootstrap.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { loadProducts } from "../services/products.js";
import { iniciarCarrinho } from "./cart.js";
import { iniciarCheckout } from "./checkout.js";
import { carregarMaisPedidos } from "./best-sellers.js";
import { carregarPromocoes } from "./promocoes.js";
import { iniciarPedidosCliente } from "./orders-client.js";
import { iniciarCliente } from "./customer.js";
import { garantirClienteAuth } from "../services/customers.js";
import { isStoreOpen } from "../services/store-hours.js";
import { carregarEmpresaPorSlug } from "../services/tenant.js";

console.log("APP.JS CARREGADO");

/* ==========================================================
CONFIG
========================================================== */

const CONFIG_DOC_ID = "geral";

/* ==========================================================
   HELPERS
========================================================== */

function verificarCarrinhoAntesCheckout() {
  let carrinho = [];

  try {
    carrinho = JSON.parse(localStorage.getItem("orderlyCarrinho")) || [];
  } catch {
    carrinho = [];
  }

  if (!Array.isArray(carrinho) || carrinho.length === 0) {
    alert(
      "Seu carrinho está vazio.\nAdicione itens do cardápio para continuar.",
    );
    return false;
  }

  return true;
}

/* ==========================================================
   UI DA LOJA
========================================================== */

function atualizarInterfaceLoja(config = {}) {
  const statusEl = document.getElementById("status");
  const finalizarBtn = document.getElementById("finalizarBtn");
  const finalizarBtnMobile = document.getElementById("finalizarBtnMobile");
  const tituloLoja = document.querySelector(".topbar h2");

  const nomeLoja = config?.loja?.nome?.trim() || "Orderly";
  const funcionamento = config?.funcionamento || {};
  const aberta = isStoreOpen(funcionamento);

  if (tituloLoja) {
    tituloLoja.textContent = nomeLoja;
  }

  if (statusEl) {
    if (aberta) {
      statusEl.textContent = "🟢 Aberto";
      statusEl.title =
        funcionamento.abertura && funcionamento.fechamento
          ? `Funcionando das ${funcionamento.abertura} às ${funcionamento.fechamento}`
          : "Loja aberta";
    } else {
      statusEl.textContent = "🔴 Fechado";
      statusEl.title =
        funcionamento.abertura && funcionamento.fechamento
          ? `Funcionamento: ${funcionamento.abertura} às ${funcionamento.fechamento}`
          : "Loja fechada";
    }
  }

  if (finalizarBtn) {
    finalizarBtn.disabled = false;

    if (!aberta) {
      finalizarBtn.textContent = "Loja fechada no momento";
      finalizarBtn.title =
        funcionamento.abertura && funcionamento.fechamento
          ? `Abre às ${funcionamento.abertura}`
          : "A loja está fechada no momento";
    } else {
      finalizarBtn.textContent = "Finalizar Pedido";
      finalizarBtn.title = "";
    }

    finalizarBtn.onclick = () => {
      if (!aberta) {
        alert(
          funcionamento.abertura && funcionamento.fechamento
            ? `A loja está fechada no momento.\nAbre às ${funcionamento.abertura}.`
            : "A loja está fechada no momento.",
        );
        return;
      }

      if (!verificarCarrinhoAntesCheckout()) return;

      window.location.href = "/pedido.html";
    };
  }

  if (finalizarBtnMobile) {
    finalizarBtnMobile.disabled = false;

    if (!aberta) {
      finalizarBtnMobile.textContent = "Loja fechada no momento";
      finalizarBtnMobile.title =
        funcionamento.abertura && funcionamento.fechamento
          ? `Abre às ${funcionamento.abertura}`
          : "A loja está fechada no momento";
    } else {
      finalizarBtnMobile.textContent = "Finalizar Pedido";
      finalizarBtnMobile.title = "";
    }

    finalizarBtnMobile.onclick = () => {
      if (!aberta) {
        alert(
          funcionamento.abertura && funcionamento.fechamento
            ? `A loja está fechada no momento.\nAbre às ${funcionamento.abertura}.`
            : "A loja está fechada no momento.",
        );
        return;
      }

      if (!verificarCarrinhoAntesCheckout()) return;

      window.location.href = "/pedido.html";
    };
  }
}

/* ==========================================================
   CONFIGURAÇÕES DA LOJA
========================================================== */

async function carregarConfiguracoesLoja() {
  try {
    const ref = doc(configuracoesRef(), CONFIG_DOC_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("Documento configuracoes/geral não encontrado.");
      atualizarInterfaceLoja({});
      return;
    }

    const config = snap.data();

    const logo = config?.logo?.url || config?.loja?.logo?.url || "";

    const nome = config?.loja?.nome || config?.nomeFantasia || "Orderly";

    const logoEl = document.getElementById("logoLoja");

    if (logoEl) {
      if (logo) {
        logoEl.src = logo;
        logoEl.style.display = "block";
      } else {
        logoEl.removeAttribute("src");
        logoEl.style.display = "none";
      }
    }

    const favicon = document.getElementById("favicon");

    if (favicon && logo) {
      favicon.href = logo;
    }

    const titulo = document.getElementById("nomeLoja");

    if (titulo) {
      titulo.textContent = nome;
    }

    atualizarInterfaceLoja(config);
    console.log("Configurações carregadas:", config);
  } catch (error) {
    console.error("Erro ao carregar configurações da loja:", error);
    atualizarInterfaceLoja({});
  }
}

/* ==========================================================
   INIT
========================================================== */

async function iniciarAplicacao() {
  console.log("APP INICIANDO");

  try {
    console.log("ANTES TENANT");

    await carregarEmpresaPorSlug();

    console.log("AUTH OK");

    await iniciarCliente();

    console.log("CLIENTE OK");

    await carregarConfiguracoesLoja();

    console.log("CONFIG OK");

    await loadProducts();

    console.log("PRODUTOS OK");

    iniciarCarrinho();

    iniciarCheckout();

    await carregarMaisPedidos();

    console.log("MAIS PEDIDOS OK");

    await carregarPromocoes();

    console.log("PROMOCOES OK");

    await iniciarPedidosCliente();

    console.log("PEDIDOS OK");
  } catch (error) {
    console.error("ERRO INIT APP:", error);
  }
}

console.log("REGISTRANDO INIT");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarAplicacao);
} else {
  iniciarAplicacao();
}
