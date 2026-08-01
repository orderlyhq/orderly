import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/*
=========================================================
CRIAR CLIENTE
=========================================================
*/

export async function criarCliente(dados) {
  const { nome, email, telefone, senha } = dados;

  const resultado = await createUserWithEmailAndPassword(auth, email, senha);

  const uid = resultado.user.uid;

  await setDoc(doc(db, "clientes", uid), {
    nome,

    email,

    telefone,

    criadoEm: serverTimestamp(),

    ativo: true,
  });

  return resultado.user;
}

/*
=========================================================
LOGIN CLIENTE
=========================================================
*/

export async function loginCliente(email, senha) {
  const resultado = await signInWithEmailAndPassword(auth, email, senha);

  return resultado.user;
}

/*
=========================================================
OBTER CLIENTE LOGADO
=========================================================
*/

export async function obterClienteAtual() {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const ref = doc(db, "clientes", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return {
    id: user.uid,

    ...snap.data(),

    email: user.email,
  };
}

/*
=========================================================
OBSERVAR LOGIN
=========================================================
*/

export function observarCliente(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const ref = doc(db, "clientes", user.uid);

    const snap = await getDoc(ref);

    if (snap.exists()) {
      callback({
        id: user.uid,

        ...snap.data(),

        email: user.email,
      });
    } else {
      callback({
        id: user.uid,

        email: user.email || "",

        nome: user.email ? user.email.split("@")[0] : "Cliente",
      });
    }
  });
}

/*
=========================================================
LOGOUT
=========================================================
*/

export async function logoutCliente() {
  await signOut(auth);
}
