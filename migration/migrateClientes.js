const batchCommit =
require("./utils/batch");


module.exports =
async function(
mesa,
orderly,
empresaMesa,
empresaNova,
ctx
){


const snap =
await mesa.collection("clientes").get();


let writes=[];


for(const doc of snap.docs){


let cliente={
...doc.data(),

empresaId:
empresaNova
};


ctx.maps.clienteId[doc.id]=doc.id;



if(!ctx.dryRun){

writes.push({

ref:
orderly
.collection("empresas")
.doc(empresaNova)
.collection("clientes")
.doc(doc.id),

data:
cliente

});

}


ctx.relatorio.clientes++;

}



await batchCommit(
orderly,
writes
);


};