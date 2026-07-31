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
await mesa.collection("usuarios").get();


let writes=[];


for(const doc of snap.docs){


const u =
doc.data();


writes.push({

ref:
orderly
.collection("empresas")
.doc(empresaNova)
.collection("usuarios")
.doc(doc.id),


data:{

uid:doc.id,

nome:u.nome || "",

email:u.email || "",

tipo:u.tipo || "admin",

empresaId:empresaNova


}

});


ctx.relatorio.usuarios++;


}



if(!ctx.dryRun)
await batchCommit(orderly,writes);



};