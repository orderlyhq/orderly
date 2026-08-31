import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ADMIN_SESSION_KEY = "orderly_admin_logado";

/* ==========================================================
LOGIN FIREBASE
========================================================== */

export async function login(email, senha) {
  email = String(email || "").trim();

  if (!email) {
    throw new Error("E-mail não informado.");
  }

  const resultado = await signInWithEmailAndPassword(
    auth,
    email,
    senha
  );

  sessionStorage.setItem(
    ADMIN_SESSION_KEY,
    resultado.user.uid
  );

  return resultado.user;
}

/* ==========================================================
USUÁRIO ATUAL
========================================================== */

export function usuarioAtual() {
  return auth.currentUser;
}

/* ==========================================================
LOGOUT
========================================================== */

export async function logoutAdmin() {
  await signOut(auth);

  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/* ==========================================================
PROTEÇÃO ADMIN
========================================================== */

export async function protegerPaginaAdmin() {
  const usuario = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();

      resolve(user);
    });
  });

  if (!usuario) {
    window.location.href = "/login.html";

    return false;
  }

  return true;
}

/* ==========================================================
RECUPERAÇÃO DE SENHA
========================================================== */

export async function recuperarSenha(email) {
  email = String(email || "").trim();

  if (!email) {
    throw new Error("E-mail não informado.");
  }

  return sendPasswordResetEmail(auth, email);
}