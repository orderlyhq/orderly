const batchCommit = require("./utils/batch");
const logger = require("./utils/logger");


module.exports =
async function(
mesa,
orderly,
empresaMesa,
empresaNova,
ctx
){


const snap =
await mesa
.collection("produtos")
.get();


let writes=[];


for(const doc of snap.docs){


const data =
doc.data();


const novoProduto =
{

...data,

empresaId:
empresaNova,


categoriaId:
ctx.maps.categoriaId[data.categoria] || null


};

if (data.categoria && !ctx.maps.categoriaId[data.categoria]) {
    logger.error(
        `Categoria não encontrada: ${data.categoria} (produto ${doc.id})`
    );
}

ctx.maps.produtoId[doc.id]
=
doc.id;



if(!ctx.dryRun){

writes.push({

ref:
orderly
.collection("empresas")
.doc(empresaNova)
.collection("produtos")
.doc(doc.id),


data:
novoProduto

});

}


ctx.relatorio.produtos++;


}


if (!ctx.dryRun && writes.length > 0) {
    await batchCommit(orderly, writes);
}

logger.success(`Produtos migrados: ${ctx.relatorio.produtos}`);


};