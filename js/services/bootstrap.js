import {
  empresaRef,
  configuracoesRef,
  usuariosRef,
  categoriasRef,
} from "./firestore-paths.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==========================================================
   ORDERLY
   BOOTSTRAP
========================================================== */

export async function bootstrapEmpresa() {

  const refEmpresa = empresaRef();

  const empresaSnap = await getDoc(refEmpresa);

  if (empresaSnap.exists()) {
    console.log("Empresa já inicializada.");
    return;
  }

  console.log("Criando estrutura inicial da empresa...");

  const agora = serverTimestamp();

  /* ======================================================
     EMPRESA
  ====================================================== */

  await setDoc(refEmpresa, {
    nomeFantasia: "Empresa Demo",
    plano: "free",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  });

  /* ======================================================
     CONFIGURAÇÕES
  ====================================================== */

  await setDoc(doc(configuracoesRef(), "geral"), {
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
  });

  /* ======================================================
     USUÁRIO ADMIN
  ====================================================== */

  await setDoc(doc(usuariosRef(), "admin"), {
    nome: "Administrador",
    email: "admin@empresa.demo",
    perfil: "ADMIN",
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  });

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

    await setDoc(doc(categoriasRef(), id), {
      nome: categoria,
      ativo: true,
      ordem: categorias.indexOf(categoria) + 1,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  /* ======================================================
     CONFIGURAÇÕES DE ENTREGA
  ====================================================== */

  await setDoc(doc(configuracoesRef(), "entrega"), {
    entregaAtiva: true,
    retiradaAtiva: true,
    pedidoMinimo: 0,
    tempoMedio: 45,
    atualizadoEm: agora,
  });

  /* ======================================================
     CONFIGURAÇÕES DE WHATSAPP
  ====================================================== */

  await setDoc(doc(configuracoesRef(), "whatsapp"), {
    ativo: false,
    numero: "",
    mensagemBoasVindas: "",
    atualizadoEm: agora,
  });

  /* ======================================================
     CONFIGURAÇÕES DE IMPRESSÃO
  ====================================================== */

  await setDoc(doc(configuracoesRef(), "impressao"), {
    autoPrint: true,
    imprimirLogo: true,
    imprimirObservacoes: true,
    atualizadoEm: agora,
  });

  console.log("Estrutura inicial criada com sucesso.");
}
