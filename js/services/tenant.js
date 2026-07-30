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
"USUARIO_NAO_ENCONTRADO"
);

}



const usuarioDoc =
resultado.docs[0];



/*
 caminho:

empresas/{empresaId}/usuarios/{uid}

*/

empresaAtual =
usuarioDoc.ref.parent.parent.id;



localStorage.setItem(
"empresaId",
empresaAtual
);



console.log(
"Empresa carregada:",
empresaAtual
);



return empresaAtual;


}





export function getEmpresaId(){


return empresaAtual ||
localStorage.getItem(
"empresaId"
);


}