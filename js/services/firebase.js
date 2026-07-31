import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAWTfgO5ReMCGi6p8r5FjAAa136wt6wn44",
  authDomain: "orderly-system.firebaseapp.com",
  projectId: "orderly-system",
  storageBucket: "orderly-system.firebasestorage.app",
  messagingSenderId: "476039540141",
  appId: "1:476039540141:web:4640a75dcbc6d0e3624524",
  measurementId: "G-YSYTQTXJ2T"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log("Projeto Firebase:", firebaseConfig.projectId);
console.log("Projeto do Firestore:", db.app.options.projectId);

export { app };