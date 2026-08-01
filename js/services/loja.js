import { buscarConfiguracoes } from "./config.js";


let lojaAtual = null;


export async function carregarLoja(){

if(lojaAtual){
return lojaAtual;
}


import { configuracoesRef } from "./firestore-paths.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const snap =
    await getDoc(
        doc(
            configuracoesRef(),
            "geral"
        )
    );


const config =
    snap.exists()
        ? snap.data()
        : null;

if(!config){
throw new Error(
"CONFIGURACAO_LOJA_NAO_ENCONTRADA"
);
}


lojaAtual = {
nome:
config.loja?.nome || "Loja",

logo:
config.loja?.logo || "",

telefone:
config.loja?.telefone ||
"",

whatsapp:
config.loja?.whatsapp ||
"",

pix:
config.pagamentos?.pix || null

};


return lojaAtual;

}