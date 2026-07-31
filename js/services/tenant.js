import { auth, db } from "./firebase.js";

import {
doc,
getDoc,
collection,
query,
where,
getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let empresaAtual = null;


export async function carregarEmpresaAtual() {

const usuario = await new Promise(resolve => {

const unsubscribe = auth.onAuthStateChanged(user => {

unsubscribe();

resolve(user);

});

});

if(!usuario){
throw new Error("USUARIO_NAO_AUTENTICADO");
}


console.log(
  "UID LOGIN RAW:",
  JSON.stringify(usuario.uid)
);

console.log(
  "UID CHARS:",
  [...usuario.uid].map(c => c.charCodeAt(0))
);


const usuarioRef = doc(
  db,
  "usuarios",
  usuario.uid
);

const caminho = `usuarios/${usuario.uid}`;

console.log(
  "CAMINHO RAW:",
  JSON.stringify(caminho)
);

const usuarioSnap = await getDoc(usuarioRef);

console.log(
  "CAMINHO BUSCADO:",
  usuarioRef.path
);

console.log(
  "PROJETO:",
  db.app.options.projectId
);

console.log(
  "DOC:",
  usuarioSnap.data()
);


console.log(
"USUARIO RAIZ EXISTE:",
usuarioSnap.exists()
);


if(!usuarioSnap.exists()){

console.error(
"Documento não encontrado:",
usuarioRef.path
);

return;

}


const dados = usuarioSnap.data();


console.log(
"DADOS USUARIO:",
dados
);


if(!dados.empresaId){

throw new Error(
"USUARIO_SEM_EMPRESA"
);

}


empresaAtual = dados.empresaId;


localStorage.setItem(
"empresaId",
empresaAtual
);


console.log(
"EMPRESA CARREGADA:",
empresaAtual
);


return empresaAtual;

}

export function getEmpresaId() {

return empresaAtual 
|| localStorage.getItem("empresaId");

}