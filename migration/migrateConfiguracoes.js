module.exports =
async function(
mesa,
orderly,
empresaMesa,
empresaNova,
ctx
){


const doc =
await mesa
.collection("configuracoes")
.doc("geral")
.get();



if(!doc.exists)
return;



if(ctx.dryRun)
return;


await orderly
.collection("empresas")
.doc(empresaNova)
.collection("configuracoes")
.doc("geral")
const origem = doc.data();

const configuracoes = {
    loja: origem.loja ?? {},
    delivery: origem.delivery ?? {},
    funcionamento: origem.funcionamento ?? {},
    pagamentos: origem.pagamentos ?? {},
    seguranca: origem.seguranca ?? {},
    logo: origem.logo ?? {}
};

if (!ctx.dryRun) {
    await orderly
        .collection("empresas")
        .doc(empresaNova)
        .collection("configuracoes")
        .doc("geral")
        .set(configuracoes);
}


};