import { db } from "./services/firebase.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const empresasRef = collection(db, "empresas");

const state = {
  restaurantes: [],
  destaque: [],
  categoriaAtual: null,
  termoBusca: "",
  localizacao: null,
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    mostrarLoading();

    await carregarRestaurantes();

    renderizarDestaques();

    renderizarLista();

    iniciarBusca();

    iniciarCategorias();

    iniciarLocalizacao();
  } catch (e) {
    console.error(e);
  } finally {
    esconderLoading();
  }
});

async function carregarRestaurantes() {
  const q = query(
    empresasRef,
    where("ativo", "==", true),
    orderBy("nomeFantasia"),
    limit(100),
  );

  const snap = await getDocs(q);

  state.restaurantes = await Promise.all(
    snap.docs.map(async (documento) => {
      const empresa = {
        id: documento.id,
        ...documento.data(),
      };

      const configRef = doc(
        db,
        "empresas",
        documento.id,
        "configuracoes",
        "geral",
      );

      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        const config = configSnap.data();

        empresa.configuracoes = {
          geral: config,
        };

        empresa.logo = config.logo || null;
      }

      return empresa;
    }),
  );

  state.destaque = state.restaurantes.filter((r) => r.destaque === true);
}

function criarCard(restaurante) {
  console.log("RESTAURANTE COMPLETO:", restaurante);
  console.log("CONFIG:", restaurante.configuracoes);
  console.log("LOGO:", restaurante.logo?.url);

  const template = document
    .getElementById("restaurantTemplate")
    .content.cloneNode(true);

  const imagem =
    restaurante.capa || restaurante.logo?.url || "/img/placeholder.png";

  template.querySelector(".restaurant-name").textContent =
    restaurante.nomeFantasia || "Restaurante";

  template.querySelector(".rating-number").textContent =
    restaurante.nota ?? "Novo";

  const tempoEntrega =
    restaurante.configuracoes?.geral?.delivery?.configuracaoEntrega?.tempo ||
    restaurante.configuracoes?.geral?.delivery?.configuracaoEntregaPropria
      ?.tempo ||
    restaurante.tempoEntrega;

  template.querySelector(".restaurant-time").textContent = tempoEntrega
    ? `${tempoEntrega} min`
    : "Tempo não informado";

  template.querySelector(".restaurant-category").textContent =
    restaurante.categoriaPrincipal || "Restaurante";

  const img = template.querySelector(".restaurant-image");

  img.src = imagem;

  img.onerror = () => {
    img.src = "/favicon.ico";
  };

  template.querySelector(".restaurant-button").onclick = () => {
    window.location.href = `./loja.html?slug=${restaurante.slug}`;
  };

  return template;
}

function adicionarCard(container, restaurante) {
  container.appendChild(criarCard(restaurante));
}

function renderizarDestaques() {
  const container = document.getElementById("featuredRestaurants");

  if (!container) return;

  container.innerHTML = "";

  state.destaque.forEach((r) => adicionarCard(container, r));
}

function renderizarLista() {
  const container = document.getElementById("restaurantList");

  if (!container) return;

  container.innerHTML = "";

  let lista = [...state.restaurantes];

  if (state.termoBusca) {
    lista = lista.filter((r) =>
      r.nomeFantasia?.toLowerCase().includes(state.termoBusca.toLowerCase()),
    );
  }

  if (state.categoriaAtual) {
    lista = lista.filter((r) => r.categoriaPrincipal === state.categoriaAtual);
  }

  lista.forEach((r) => adicionarCard(container, r));
}

function iniciarBusca() {
  const input = document.getElementById("buscarRestaurante");

  if (!input) return;

  input.addEventListener("input", (e) => {
    state.termoBusca = e.target.value;

    renderizarLista();
  });
}

function iniciarCategorias() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.onclick = () => {
      state.categoriaAtual = card
        .querySelector(".category-name")
        ?.textContent.trim();

      renderizarLista();
    };
  });
}

function iniciarLocalizacao() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition((pos) => {
    state.localizacao = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
  });
}

function mostrarLoading() {
  const el = document.getElementById("loadingScreen");

  if (el) el.classList.remove("d-none");
}

function esconderLoading() {
  const el = document.getElementById("loadingScreen");

  if (el) el.classList.add("d-none");
}
