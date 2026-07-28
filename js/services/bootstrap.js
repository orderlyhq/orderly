import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getEmpresaId } from "./tenant.js";

/* ==========================================================
   ORDERLY
   BOOTSTRAP
========================================================== */

export async function inicializarEmpresaDemo() {
  const empresaId = getEmpresaId();

  const empresaRef = doc(db, "empresas", empresaId);

  const empresaSnap = await getDoc(empresaRef);

  if (empresaSnap.exists()) {
    console.log("Empresa já inicializada.");
    return;
  }

  console.log("Criando estrutura inicial da empresa...");

  const agora = serverTimestamp();

  /* ======================================================
     EMPRESA
  ====================================================== */

  await setDoc(empresaRef, {
    nomeFantasia: "Empresa Demo",
    plano: "free",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  });

  /* ======================================================
     CONFIGURAÇÕES
  ====================================================== */

  await setDoc(
    doc(db, "empresas", empresaId, "configuracoes", "geral"),
    {
      nomeFantasia: "Empresa Demo",
      telefone: "",
      whatsapp: "",
      email: "",
      endereco: {
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "",
        cep: "",
      },
      pix: {
        chave: "",
        tipo: "",
      },
      logo: "",
      corPrimaria: "#198754",
      moeda: "BRL",
      timezone: "America/Sao_Paulo",
      pagamentos: [
        {
          nome: "Dinheiro",
          ativo: true,
        },
        {
          nome: "PIX",
          ativo: true,
        },
        {
          nome: "Cartão",
          ativo: true,
        },
      ],
      criadoEm: agora,
      atualizadoEm: agora,
    },
  );

  /* ======================================================
     USUÁRIO ADMIN
  ====================================================== */

  await setDoc(
    doc(db, "empresas", empresaId, "usuarios", "admin"),
    {
      nome: "Administrador",
      email: "admin@empresa.demo",
      perfil: "ADMIN",
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    },
  );

  /* ======================================================
     CATEGORIAS PADRÃO
  ====================================================== */

  const categorias = [
    "Hambúrgueres",
    "Pizzas",
    "Porções",
    "Bebidas",
    "Sobremesas",
  ];

  for (const categoria of categorias) {
    const id = categoria
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    await setDoc(
      doc(db, "empresas", empresaId, "categorias", id),
      {
        nome: categoria,
        ativo: true,
        ordem: categorias.indexOf(categoria) + 1,
        criadoEm: agora,
        atualizadoEm: agora,
      },
    );
  }

  /* ======================================================
     CONFIGURAÇÕES DE ENTREGA
  ====================================================== */

  await setDoc(
    doc(db, "empresas", empresaId, "configuracoes", "entrega"),
    {
      entregaAtiva: true,
      retiradaAtiva: true,
      pedidoMinimo: 0,
      tempoMedio: 45,
      atualizadoEm: agora,
    },
  );

  /* ======================================================
     CONFIGURAÇÕES DE WHATSAPP
  ====================================================== */

  await setDoc(
    doc(db, "empresas", empresaId, "configuracoes", "whatsapp"),
    {
      ativo: false,
      numero: "",
      mensagemBoasVindas: "",
      atualizadoEm: agora,
    },
  );

  /* ======================================================
     CONFIGURAÇÕES DE IMPRESSÃO
  ====================================================== */

  await setDoc(
    doc(db, "empresas", empresaId, "configuracoes", "impressao"),
    {
      autoPrint: true,
      imprimirLogo: true,
      imprimirObservacoes: true,
      atualizadoEm: agora,
    },
  );

  console.log("Estrutura inicial criada com sucesso.");
}