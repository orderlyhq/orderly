const batchCommit =
require("./utils/batch");

const logger =
require("./utils/logger");


module.exports = async function(
mesa,
orderly,
empresaMesa,
empresaNova,
ctx
){

const snap =
await mesa.collection("pedidos").get();


if(snap.empty){

logger.info(
"Pedidos: coleção vazia"
);

return;

}

let writes=[];


for (const doc of snap.docs) {

    const pedido = doc.data();

    const novoPedido = {
        ...pedido,

        empresaId: empresaNova,

        clienteId:
            ctx.maps.clienteId[pedido.clienteId] ??
            pedido.clienteId ??
            null
    };

    Object.keys(novoPedido).forEach((key) => {
        if (novoPedido[key] === undefined) {
            novoPedido[key] = null;
        }
    });

    if (!ctx.dryRun) {

        writes.push({
            ref: orderly
                .collection("empresas")
                .doc(empresaNova)
                .collection("pedidos")
                .doc(doc.id),

            data: novoPedido
        });

    }

    ctx.relatorio.pedidos++;

}

await batchCommit(
orderly,
writes
);


logger.success(
`Pedidos migrados: ${ctx.relatorio.pedidos}`
);


};