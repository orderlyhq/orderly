import { db } from "./firebase.js";

import {
  collection,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getEmpresaId } from "./tenant.js";

/* ==========================================================
   ORDERLY
   FIRESTORE PATHS
========================================================== */

/**
 * Retorna a referência do documento da empresa.
 *
 * empresas/{empresaId}
 */
export function empresaRef() {
  return doc(db, "empresas", getEmpresaId());
}

/**
 * Retorna a referência de uma subcoleção da empresa.
 *
 * empresas/{empresaId}/{colecao}
 */
function empresaCollection(nomeColecao) {
  return collection(db, "empresas", getEmpresaId(), nomeColecao);
}

/* ==========================================================
   SUBCOLEÇÕES
========================================================== */

export function produtosRef() {
  return empresaCollection("produtos");
}

export function pedidosRef() {
  return empresaCollection("pedidos");
}

export function clientesRef() {
  return empresaCollection("clientes");
}

export function categoriasRef() {
  return empresaCollection("categorias");
}

export function usuariosRef() {
  return empresaCollection("usuarios");
}

export function configuracoesRef() {
  return empresaCollection("configuracoes");
}

export function pagamentosRef() {
  return empresaCollection("pagamentos");
}

export function taxasEntregaRef() {
  return empresaCollection("taxasEntrega");
}

export function promocoesRef() {
  return empresaCollection("promocoes");
}

export function integracoesRef() {
  return empresaCollection("integracoes");
}

export function relatoriosRef() {
  return empresaCollection("relatorios");
}

export function mesasRef() {
  return empresaCollection("mesas");
}

export function cuponsRef() {
  return empresaCollection("cupons");
}

export function entregadoresRef() {
  return empresaCollection("entregadores");
}

export function notificacoesRef() {
  return empresaCollection("notificacoes");
}