import { auth, db } from "./firebase.js";


import {

  collectionGroup,

  getDocs,

  query,

  where

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let empresaAtual = null;



export async function carregarEmpresaAtual(){


  const usuario =
    auth.currentUser;



  if(!usuario){

    throw new Error(
      "USUARIO_NAO_AUTENTICADO"
    );

  }



  const uid =
    usuario.uid;



  const usuariosRef =
    collectionGroup(
      db,
      "usuarios"
    );



  const busca =
    query(
      usuariosRef,
      where(
        "uid",
        "==",
        uid
      )
    );



  const resultado =
    await getDocs(busca);



  if(resultado.empty){

    throw new Error(
      "EMPRESA_NAO_ENCONTRADA"
    );

  }



  const usuarioRef =
    resultado.docs[0].ref;



  empresaAtual =
    usuarioRef
      .parent
      .parent
      .id;



  localStorage.setItem(
    "empresaId",
    empresaAtual
  );



  return empresaAtual;

}



export function getEmpresaId(){


  if(empresaAtual){

    return empresaAtual;

  }



  return localStorage.getItem(
    "empresaId"
  );


}