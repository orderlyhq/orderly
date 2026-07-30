import {
  collection,
  getDocs,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../../../js/services/firebase.js";

import {
  produtosRef,
  taxasEntregaRef,
} from "../../../js/services/firestore-paths.js";

export async function limparColecao(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));

  if (snapshot.empty) return;

  const batch = writeBatch(db);

  snapshot.forEach((item) => {
    batch.delete(item.ref);
  });

  await batch.commit();
}

export async function limparVendasProdutos() {
  const snapshot = await getDocs(produtosRef());

  console.log("Limpeza produtos:", produtosRef().path);

  const batch = writeBatch(db);

  snapshot.forEach((item) => {
    batch.update(item.ref, {
      vendas: 0,
    });
  });

  await batch.commit();
}

export async function limparProdutos() {

    const snapshot = await getDocs(produtosRef());

    if (snapshot.empty) return;

    const batch = writeBatch(db);

    snapshot.forEach((item) => {
        batch.delete(item.ref);
    });

    await batch.commit();
}

export async function limparTaxasEntrega() {

    const snapshot = await getDocs(taxasEntregaRef());

    if (snapshot.empty) return;

    const batch = writeBatch(db);

    snapshot.forEach((item) => {
        batch.delete(item.ref);
    });

    await batch.commit();
}