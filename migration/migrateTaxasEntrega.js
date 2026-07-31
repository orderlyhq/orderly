const batchCommit = require("./utils/batch");
const logger = require("./utils/logger");

module.exports = async function (
    mesa,
    orderly,
    empresaMesa,
    empresaNova,
    ctx
) {

    const snap = await mesa.collection("taxasEntrega").get();

    if (snap.empty) {
        logger.info("Taxas de entrega: coleção vazia");
        return;
    }

    const writes = [];

    for (const doc of snap.docs) {

        const data = doc.data();

        if (!data) {
            logger.error(`Documento ${doc.id} sem dados.`);
            continue;
        }

        const taxaEntrega = {
            ...data,
            empresaId: empresaNova
        };

        if (!ctx.dryRun) {

            writes.push({

                ref: orderly
                    .collection("empresas")
                    .doc(empresaNova)
                    .collection("taxasEntrega")
                    .doc(doc.id),

                data: taxaEntrega

            });

        }

        ctx.relatorio.taxasEntrega++;

    }

    if (!ctx.dryRun && writes.length > 0) {
        await batchCommit(orderly, writes);
    }

    logger.success(
        `Taxas de entrega migradas: ${ctx.relatorio.taxasEntrega}`
    );

};