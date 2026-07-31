const batchCommit = require("./utils/batch");
const logger = require("./utils/logger");

module.exports = async function (
    mesa,
    orderly,
    empresaMesa,
    empresaNova,
    ctx
) {

    const snap = await mesa.collection("adicionais").get();

    if (snap.empty) {
        logger.info("Adicionais: coleção vazia");
        return;
    }

    const writes = [];

    for (const doc of snap.docs) {

        const adicional = {
            ...doc.data(),
            empresaId: empresaNova
        };

        if (!ctx.dryRun) {
            writes.push({
                ref: orderly
                    .collection("empresas")
                    .doc(empresaNova)
                    .collection("adicionais")
                    .doc(doc.id),

                data: adicional
            });
        }

        ctx.relatorio.adicionais++;
    }

    if (!ctx.dryRun) {
        await batchCommit(orderly, writes);
    }

    logger.success(`Adicionais migrados: ${ctx.relatorio.adicionais}`);
};