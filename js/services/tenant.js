import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let empresaAtual = null;

export async function carregarEmpresaAtual() {
  const usuario = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();

      resolve(user);
    });
  });

  if (!usuario) {
    throw new Error("USUARIO_NAO_AUTENTICADO");
  }

  console.log("UID LOGIN RAW:", JSON.stringify(usuario.uid));

  console.log(
    "UID CHARS:",
    [...usuario.uid].map((c) => c.charCodeAt(0)),
  );

  const usuarioRef = doc(db, "usuarios", usuario.uid);

  const caminho = `usuarios/${usuario.uid}`;

  console.log("CAMINHO RAW:", JSON.stringify(caminho));

  const usuarioSnap = await getDoc(usuarioRef);

  console.log("CAMINHO BUSCADO:", usuarioRef.path);

  console.log("PROJETO:", db.app.options.projectId);

  console.log("DOC:", usuarioSnap.data());

  console.log("USUARIO RAIZ EXISTE:", usuarioSnap.exists());

  if (!usuarioSnap.exists()) {
    console.error("Documento não encontrado:", usuarioRef.path);

    return;
  }

  const dados = usuarioSnap.data();

  console.log("DADOS USUARIO:", dados);

  if (!dados.empresaId) {
    throw new Error("USUARIO_SEM_EMPRESA");
  }

  empresaAtual = dados.empresaId;

  const empresaRef = doc(db, "empresas", empresaAtual);

  const empresaSnap = await getDoc(empresaRef);

  if (!empresaSnap.exists()) {
    throw new Error("EMPRESA_NAO_ENCONTRADA");
  }

  const empresa = empresaSnap.data();

  localStorage.setItem("empresaId", empresaAtual);

  if (empresa.slug) {
    localStorage.setItem("empresaSlug", empresa.slug);
  }

  console.log("EMPRESA:", empresa);

  console.log("EMPRESA CARREGADA:", empresaAtual);

  return empresaAtual;
}

export function getEmpresaId() {
  return empresaAtual || localStorage.getItem("empresaId");
}

/* ==========================================================
CARREGAR EMPRESA POR SLUG (CLIENTE)
========================================================== */

export async function carregarEmpresaPorSlug() {
  if (empresaAtual) {
    return empresaAtual;
  }

  /*
1.
Tenta recuperar empresa já carregada
*/

  const empresaLocal = localStorage.getItem("empresaId");

  const slugAtual = new URLSearchParams(window.location.search).get("slug");

  const slugSalvo = localStorage.getItem("empresaSlug");

  if (empresaLocal && slugAtual && slugSalvo === slugAtual) {
    empresaAtual = empresaLocal;

    return empresaAtual;
  }

  /*
2.
Busca slug pela URL

Aceita:

loja.html?slug=lanches-marini

e futuramente:

/lanches-marini
*/

  const params = new URLSearchParams(window.location.search);

  let slug = params.get("slug");

  if (!slug) {
    const caminho = window.location.pathname.replace(/^\/+/, "").split("/")[0];

    if (caminho && caminho !== "loja.html") {
      slug = caminho;
    }
  }

  if (!slug) {
    throw new Error("SLUG_EMPRESA_NAO_INFORMADO");
  }

  /*
3.
Busca empresa pelo slug
*/

  const q = query(collection(db, "empresas"), where("slug", "==", slug));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("EMPRESA_NAO_ENCONTRADA");
  }

  empresaAtual = snapshot.docs[0].id;

  localStorage.setItem("empresaId", empresaAtual);

  localStorage.setItem("empresaSlug", slug);

  console.log("EMPRESA CARREGADA PELO SLUG:", empresaAtual);

  return empresaAtual;
}
