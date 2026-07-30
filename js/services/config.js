import { configuracaoGeralRef } from "./firestore-paths.js";

import {
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function buscarConfiguracoes() {
  const snap = await getDoc(configuracaoGeralRef());

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

export function ouvirConfiguracoes(callback) {
  console.log("Listener configurações:", configuracaoGeralRef().path);

  return onSnapshot(configuracaoGeralRef(), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snap.id,
      ...snap.data(),
    });
  });
}
