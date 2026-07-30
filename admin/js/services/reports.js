import { db } from "../../../js/services/firebase.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  pedidosRef,
  clientesRef,
  produtosRef,
} from "../../../js/services/firestore-paths.js";

export async function carregarDadosRelatorios() {
  const pedidosSnap = await getDocs(pedidosRef());

  console.log("Consulta pedidos:", pedidosRef().path);

  const clientesSnap = await getDocs(clientesRef());

  console.log("Consulta clientes:", clientesRef().path);

  const produtosSnap = await getDocs(produtosRef());

  console.log("Consulta produtos:", produtosRef().path);

  const pedidos = [];
  const clientes = [];
  const produtos = [];

  pedidosSnap.forEach((doc) => {
    pedidos.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  clientesSnap.forEach((doc) => {
    clientes.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  produtosSnap.forEach((doc) => {
    produtos.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return {
    pedidos,
    clientes,
    produtos,
  };
}
