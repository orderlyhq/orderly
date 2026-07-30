import {
  promocoesRef,
  produtosRef,
} from "./firestore-paths.js";

import {
collection,
getDocs,
query,
where,
orderBy,
addDoc,
updateDoc,
deleteDoc,
doc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const COLLECTION = "promocoes";



/* ==========================================================
LISTAR ADMIN
========================================================== */

export async function listarPromocoes(){

const ref = promocoesRef();

console.log(
    "Consulta promoções:",
    promocoesRef().path
);


const q =
query(
ref,
orderBy(
"createdAt",
"desc"
)
);


const snap =
await getDocs(q);



return snap.docs.map(d=>({

id:d.id,

...d.data()

}));

}



/* ==========================================================
LISTAR CLIENTE
========================================================== */

export async function buscarPromocoes(){

const ref = promocoesRef();

console.log(
    "Consulta promoções:",
    promocoesRef().path
);


const q =
query(
ref,
where(
"ativo",
"==",
true
),
orderBy(
"createdAt",
"desc"
)
);


const snap =
await getDocs(q);



return snap.docs.map(d=>({

id:d.id,

...d.data()

}));

}



/* ==========================================================
CRIAR
========================================================== */

export async function criarPromocao(dados){


return await addDoc(
promocoesRef(),
{

...dados,

createdAt:
serverTimestamp(),

updatedAt:
serverTimestamp()

}

);

}



/* ==========================================================
ATUALIZAR
========================================================== */

export async function atualizarPromocao(
id,
dados
){


return await updateDoc(
doc(
promocoesRef(),
id
),
{

...dados,

updatedAt:
serverTimestamp()

}

);

}



/* ==========================================================
EXCLUIR
========================================================== */

export async function excluirPromocao(id){


return await deleteDoc(
doc(
promocoesRef(),
id
),

);

}



/* ==========================================================
PRODUTOS DISPONÍVEIS
========================================================== */

export async function buscarProdutosDisponiveis(){

const ref = produtosRef();

console.log(
    "Consulta produtos:",
    produtosRef().path
);


const snap =
await getDocs(ref);



return snap.docs.map(d=>({

id:d.id,

...d.data()

}));

}