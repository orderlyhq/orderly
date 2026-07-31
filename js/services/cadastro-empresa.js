import { auth, db } from "./firebase.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function gerarSlug(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function cadastrarEmpresa(dados) {
  if (dados.senha !== dados.confirmarSenha) {
    throw new Error("SENHAS_DIFERENTES");
  }

  /*
      1.
      Criar usuário administrador
    */

  const usuarioCredential = await createUserWithEmailAndPassword(
    auth,
    dados.emailAdmin,
    dados.senha,
  );

  const uid = usuarioCredential.user.uid;

  /*
      2.
      Criar empresa
    */

  const empresaRef = doc(collection(db, "empresas"));

  const empresaId = empresaRef.id;

  console.log("ANTES CRIAR EMPRESA");

  const slugBase = gerarSlug(dados.nomeFantasia);

  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  await setDoc(empresaRef, {
    nomeFantasia: dados.nomeFantasia,

    slug,

    razaoSocial: dados.razaoSocial || "",

    cnpj: dados.cnpj || "",

    email: dados.emailEmpresa,

    telefone: dados.telefone,

    whatsapp: dados.whatsapp,

    endereco: dados.endereco,

    cidade: dados.cidade,

    estado: dados.estado,

    ativo: true,

    plano: "free",

    criadoEm: serverTimestamp(),
  });

  /*
      3.
      Criar usuário administrador
    */

  /*
3.
Criar usuário administrador dentro da empresa
*/

  console.log("EMPRESA CRIADA");

  await setDoc(doc(db, "empresas", empresaId, "usuarios", uid), {
    uid,
    empresaId,
    nome: dados.nomeAdmin,
    email: dados.emailAdmin,
    tipo: "ADMIN",
    criadoEm: serverTimestamp(),
  });

  localStorage.setItem("empresaId", empresaId);

  /*
4.
Criar índice global do usuário
para descobrir o tenant no login
*/

  // novo índice rápido para descobrir o tenant no login
  await setDoc(doc(db, "usuarios", uid), {
    uid,
    empresaId,
    nome: dados.nomeAdmin,
    email: dados.emailAdmin,
    tipo: "ADMIN",
    criadoEm: serverTimestamp(),
  });

  /*
    5.
    Criar configurações iniciais
    */

  console.log("USUARIO EMPRESA CRIADO");

  await setDoc(doc(db, "empresas", empresaId, "configuracoes", "geral"), {
    loja: {
      nome: dados.nomeFantasia,
      telefone: dados.telefone,
      whatsapp: dados.whatsapp,
      email: dados.emailEmpresa,
      logo: "",
    },

    funcionamento: {
      abertura: "",

      fechamento: "",

      statusManual: "AUTO",
    },

    delivery: {
      ativo: true,

      retirada: true,
    },

    pagamentos: [
      {
        id: "pix",

        nome: "PIX",

        ativo: true,
      },

      {
        id: "dinheiro",

        nome: "Dinheiro",

        ativo: true,
      },

      {
        id: "cartao",

        nome: "Cartão",

        ativo: true,
      },
    ],
  });

  console.log("CONFIG CRIADA");

  return {
    empresaId,

    uid,
  };
}
