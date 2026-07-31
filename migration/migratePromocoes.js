const batchCommit = require("./utils/batch");
const logger = require("./utils/logger");

module.exports = async function (
    mesa,
    orderly,
    empresaMesa,
    empresaNova,
    ctx
) {
  const snap = await mesa.collection("promocoes").get();

  if (snap.empty) {
    logger.info("Promoções: coleção vazia");
    return;
  }

  const writes = [];

  for (const doc of snap.docs) {
    const data = doc.data();

    if (!data) {
      logger.error(`Promoção ${doc.id} sem dados.`);
      continue;
    }

    const promocao = {
      ...data,
      empresaId: empresaNova,
    };

    if (data.produtoId && ctx.maps?.produtoId) {
      promocao.produtoId = ctx.maps.produtoId[data.produtoId] ?? data.produtoId;
    }

    if (!ctx.dryRun) {
      writes.push({
        ref: orderly
          .collection("empresas")
          .doc(empresaNova)
          .collection("promocoes")
          .doc(doc.id),
        data: promocao,
      });
    }

    ctx.relatorio.promocoes++;
  }

  if (!ctx.dryRun) {
    await batchCommit(orderly, writes);
  }

  logger.success(`Promoções migradas: ${ctx.relatorio.promocoes}`);
};
