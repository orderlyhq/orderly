import { db } from "./firebase.js";
import {
  collection,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getEmpresaId } from "./tenant.js";

const empresaId = () => getEmpresaId();

/* ==========================================================
   EMPRESA
========================================================== */

export const empresaRef = () =>
  doc(db, "empresas", empresaId());

/* ==========================================================
   COLEÇÕES
========================================================== */

const collectionRef = (nome) => {
  const ref = collection(db, "empresas", empresaId(), nome);
  console.log("Coleção:", ref.path);
  return ref;
};

export const produtosRef = () => collectionRef("produtos");
export const pedidosRef = () => collectionRef("pedidos");
export const clientesRef = () => collectionRef("clientes");
export const categoriasRef = () => collectionRef("categorias");
export const mesasRef = () => collectionRef("mesas");
export const usuariosRef = () => collectionRef("usuarios");
export const configuracoesRef = () => collectionRef("configuracoes");
export const pagamentosRef = () => collectionRef("pagamentos");
export const taxasEntregaRef = () => collectionRef("taxasEntrega");
export const promocoesRef = () => collectionRef("promocoes");
export const integracoesRef = () => collectionRef("integracoes");
export const adicionaisRef = () => collectionRef("adicionais");

/* ==========================================================
   DOCUMENTOS
========================================================== */

export const configuracaoGeralRef = () =>
  doc(configuracoesRef(), "geral");

export const configuracaoEntregaRef = () =>
  doc(configuracoesRef(), "entrega");

export const configuracaoWhatsappRef = () =>
  doc(configuracoesRef(), "whatsapp");

export const configuracaoImpressaoRef = () =>
  doc(configuracoesRef(), "impressao");

export const beeDeliveryRef = () =>
  doc(integracoesRef(), "beeDelivery");

export const adminRef = () =>
  doc(usuariosRef(), "admin");