import { buscarConfiguracoes } from "./config.js";


let lojaAtual = null;


export async function carregarLoja(){

if(lojaAtual){
return lojaAtual;
}


const config = await buscarConfiguracoes();


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