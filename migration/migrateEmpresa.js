const logger =
require("./utils/logger");


module.exports = async function(
mesa,
orderly,
empresaId,
ctx
){


const doc =
await mesa
.collection("configuracoes")
.doc("geral")
.get();



if(!doc.exists)
throw new Error(
"Configuração geral inexistente"
);



const dados =
doc.data();

const cnpj = dados.loja?.cnpj?.trim();

if (cnpj) {

    const existente = await orderly
        .collection("empresas")
        .where("cnpj", "==", cnpj)
        .limit(1)
        .get();

    if (!existente.empty) {

        throw new Error(
            `Já existe uma empresa com CNPJ ${cnpj} no Orderly.`
        );

    }

}

const novoId =
orderly.collection("empresas").doc().id;



const empresa={


ativo:true,

nomeFantasia:
dados.loja?.nome || "Sem nome",


razaoSocial:
dados.loja?.razaoSocial || "",


cnpj:
dados.loja?.cnpj || "",


telefone:
dados.loja?.telefone || "",


whatsapp:
dados.loja?.whatsapp || "",


email:
dados.loja?.email || "",


endereco:
dados.loja?.endereco || "",


cidade:
dados.loja?.cidade || "",


estado:
dados.loja?.estado || "",


plano:"free",


criadoEm:
new Date(),

origem: {

    sistema: "Mesa Fácil",

    projeto: "mesa-facil-62310",

    empresaIdOriginal: empresaId,

    migradoEm: new Date(),

    migradoPor: "migration-tool",

    versaoMigracao: "1.0.0"

},

};



if(ctx.dryRun){

logger.info(
`Criaria empresa ${novoId}`
);

}
else{


await orderly
.collection("empresas")
.doc(novoId)
.set(empresa);


}

ctx.relatorio.empresas++;

ctx.empresa = {
    id: novoId,
    ...empresa
};

return ctx.empresa;

}