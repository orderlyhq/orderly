import {
  pagamentosRef,
  configuracoesRef,
} from "./firestore-paths.js";
import {
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function criarPagamento(pedidoId, valorTotal) {
  await addDoc(pagamentosRef(), {
    pedidoId,
    valorTotal,
    status: "PENDENTE",
    forma: "PIX"
  });
}

export async function carregarFormasPagamento() {
  const snap = await getDoc(
    doc(configuracoesRef(), "geral")
  );

  if (!snap.exists()) return [];

  const pagamentos = snap.data().pagamentos || [];

  return pagamentos.filter((p) => p.ativo);
}