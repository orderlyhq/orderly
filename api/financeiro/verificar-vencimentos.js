import { getDb } from "../_lib/firebase-admin.js";

function obterAgora() {
  return new Date();
}

function vencimentoJaPassou(vencimento, agora) {
  if (!vencimento) {
    return false;
  }

  let dataVencimento;

  if (
    typeof vencimento.toDate === "function"
  ) {
    dataVencimento = vencimento.toDate();
  } else {
    dataVencimento = new Date(vencimento);
  }

  if (
    Number.isNaN(dataVencimento.getTime())
  ) {
    return false;
  }

  return dataVencimento.getTime() < agora.getTime();
}

function statusFoiPago(status) {
  return String(status || "").toLowerCase() === "approved";
}

export default async function handler(req, res) {
  /*
   * A rotina será chamada pelo Vercel Cron.
   *
   * Não deixamos qualquer pessoa executar
   * esse endpoint livremente.
   */
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método não permitido.",
    });
  }

  /*
   * Segurança adicional.
   *
   * O Vercel Cron envia:
   *
   * Authorization: Bearer <CRON_SECRET>
   *
   * Se CRON_SECRET estiver configurado,
   * exigimos que o valor seja correto.
   */
  const cronSecret =
    process.env.CRON_SECRET;

  if (cronSecret) {
    const authorization =
      req.headers.authorization || "";

    const esperado =
      `Bearer ${cronSecret}`;

    if (authorization !== esperado) {
      return res.status(401).json({
        success: false,
        message: "Não autorizado.",
      });
    }
  }

  try {
    const db = getDb();

    const agora = obterAgora();

    const empresasRef =
      db.collection("empresas");

    const empresasSnap =
      await empresasRef.get();

    let empresasVerificadas = 0;
    let empresasBloqueadas = 0;
    let empresasMantidas = 0;

    for (const empresaDoc of empresasSnap.docs) {
      const empresaId =
        empresaDoc.id;

      const empresa =
        empresaDoc.data();

      empresasVerificadas++;

      /*
       * Empresa já inativa não precisa
       * ser processada.
       */
      if (empresa.ativo === false) {
        continue;
      }

      const empresaRef =
        empresasRef.doc(empresaId);

      const cobrancasRef =
        empresaRef.collection(
          "cobrancas",
        );

      /*
       * Busca cobranças da empresa.
       *
       * Não dependemos de uma query complexa:
       * pegamos as cobranças e determinamos
       * no servidor qual está vencida.
       */
      const cobrancasSnap =
        await cobrancasRef.get();

      let cobrancaVencida = null;

      for (const cobrancaDoc of cobrancasSnap.docs) {
        const cobranca =
          cobrancaDoc.data();

        /*
         * Cobrança aprovada não bloqueia.
         */
        if (
          statusFoiPago(
            cobranca.status,
          )
        ) {
          continue;
        }

        /*
         * Somente cobranças cujo vencimento
         * já passou podem causar bloqueio.
         */
        if (
          vencimentoJaPassou(
            cobranca.vencimento,
            agora,
          )
        ) {
          /*
           * Se houver mais de uma cobrança
           * vencida, guardamos a mais recente.
           */
          if (
            !cobrancaVencida ||
            new Date(
              cobranca.vencimento.toDate
                ? cobranca.vencimento.toDate()
                : cobranca.vencimento,
            ) >
              new Date(
                cobrancaVencida.vencimento.toDate
                  ? cobrancaVencida.vencimento.toDate()
                  : cobrancaVencida.vencimento,
              )
          ) {
            cobrancaVencida = {
              id: cobrancaDoc.id,
              ...cobranca,
            };
          }
        }
      }

      /*
       * ==================================================
       * BLOQUEIO
       * ==================================================
       */
      if (cobrancaVencida) {
        await empresaRef.set(
          {
            bloqueada: true,

            motivoBloqueio:
              "COBRANCA_VENCIDA",

            cobrancaVencidaId:
              cobrancaVencida.id,

            bloqueadaEm:
              empresa.bloqueada
                ? empresa.bloqueadaEm ||
                  agora
                : agora,

            atualizadoEm:
              agora,
          },
          {
            merge: true,
          },
        );

        empresasBloqueadas++;

        console.log(
          `[Orderly] Empresa ${empresaId} bloqueada. Cobrança vencida: ${cobrancaVencida.id}`,
        );

        continue;
      }

      /*
       * ==================================================
       * EMPRESA REGULAR
       * ==================================================
       *
       * Não desbloqueamos aqui.
       *
       * Quem desbloqueia é exclusivamente o
       * webhook do Mercado Pago após confirmar
       * o pagamento.
       */
      empresasMantidas++;
    }

    return res.status(200).json({
      success: true,

      executadoEm:
        agora.toISOString(),

      empresasVerificadas,

      empresasBloqueadas,

      empresasMantidas,
    });
  } catch (error) {
    console.error(
      "[Orderly] Erro ao verificar vencimentos:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Erro interno ao verificar vencimentos.",
    });
  }
}