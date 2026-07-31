const batchCommit = require("./utils/batch");
const logger = require("./utils/logger");

module.exports = async function (
    mesa,
    orderly,
    empresaMesa,
    empresaNova,
    ctx
) {

    const snap = await mesa.collection("produtos").get();

    if (snap.empty) {
        logger.info("Nenhum produto encontrado.");
        return;
    }

    const categorias = new Set();

    snap.forEach(doc => {

        const data = doc.data();

        if (data.categoria) {
            categorias.add(data.categoria.trim());
        }

    });

    const writes = [];

    for (const nome of categorias) {

        const ref = orderly
            .collection("empresas")
            .doc(empresaNova)
            .collection("categorias")
            .doc();

        ctx.maps.categoriaId[nome] = ref.id;

        if (!ctx.dryRun) {

            writes.push({

                ref,

                data: {

                    nome,

                    ativo: true,

                    ordem: 0,

                    empresaId: empresaNova

                }

            });

        }

        ctx.relatorio.categorias++;

    }

    if (!ctx.dryRun) {
        await batchCommit(orderly, writes);
    }

    logger.success(
        `Categorias criadas: ${ctx.relatorio.categorias}`
    );

};