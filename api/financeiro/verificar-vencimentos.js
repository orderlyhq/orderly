import { getDb } from "../_lib/firebase-admin.js";

/* ==========================================================
   UTILITÁRIOS
========================================================== */

function obterAgora() {
  return new Date();
}

function converterParaDate(valor) {
  if (!valor) {
    return null;
  }

  try {
    if (typeof valor.toDate === "function") {
      const data = valor.toDate();

      return Number.isNaN(data.getTime())
        ? null
        : data;
    }

    if (
      typeof valor === "object" &&
      typeof valor.seconds === "number"
    ) {
      const data = new Date(
        valor.seconds * 1000,
      );

      return Number.isNaN(data.getTime())
        ? null
        : data;
    }

    const data = new Date(valor);

    return Number.isNaN(data.getTime())
      ? null
      : data;
  } catch {
    return null;
  }
}

/*
 * A cobrança é considerada vencida somente
 * depois do final do dia de vencimento.
 *
 * Exemplo:
 *
 * vencimento = 10/09/2026
 *
 * Até 10/09 às 23:59:59:
 * → não bloqueia
 *
 * A partir de 11/09 às 00:00:
 * → pode bloquear
 */
function vencimentoJaPassou(vencimento, agora) {
  const dataVencimento =
    converterParaDate(vencimento);

  if (!dataVencimento) {
    return false;
  }

  const fimDoDia = new Date(
    dataVencimento.getFullYear(),
    dataVencimento.getMonth(),
    dataVencimento.getDate(),
    23,
    59,
    59,
    999,
  );

  return agora.getTime() > fimDoDia.getTime();
}

function statusFoiPago(status) {
  return (
    String(status || "").toLowerCase() ===
    "approved"
  );
}

function obterDataVencimento(cobranca) {
  return converterParaDate(
    cobranca?.vencimento,
  );
}

/* ==========================================================
   HANDLER
========================================================== */

export default async function handler(req, res) {
  /*
   * Essa API será executada pelo Vercel Cron.
   */

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Método não permitido.",
    });
  }

  /* ========================================================
     SEGURANÇA DO CRON
  ======================================================== */

  const cronSecret =
    process.env.CRON_SECRET;

  if (cronSecret) {
    const authorization =
      req.headers.authorization || "";

    const esperado =
      `Bearer ${cronSecret}`;

    if (authorization !== esperado) {
      console.warn(
        "[Orderly] Tentativa não autorizada no cron de vencimentos.",
      );

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
    let empresasSemCobranca = 0;
    let empresasComErro = 0;

    /* ======================================================
       PERCORRE AS EMPRESAS
    ====================================================== */

    for (const empresaDoc of empresasSnap.docs) {
      const empresaId =
        empresaDoc.id;

      const empresa =
        empresaDoc.data();

      empresasVerificadas++;

      try {
        /*
         * Empresas desativadas não participam
         * da rotina de cobrança/bloqueio.
         */
        if (empresa.ativo === false) {
          empresasMantidas++;

          continue;
        }

        const empresaRef =
          empresasRef.doc(empresaId);

        const cobrancasRef =
          empresaRef.collection(
            "cobrancas",
          );

        const cobrancasSnap =
          await cobrancasRef.get();

        if (cobrancasSnap.empty) {
          empresasSemCobranca++;

          continue;
        }

        let cobrancaVencida = null;
        let dataCobrancaVencida = null;

        /* ==================================================
           PROCURA COBRANÇA VENCIDA
        ================================================== */

        for (const cobrancaDoc of cobrancasSnap.docs) {
          const cobranca =
            cobrancaDoc.data();

          /*
           * Cobrança paga nunca causa bloqueio.
           */
          if (
            statusFoiPago(
              cobranca.status,
            )
          ) {
            continue;
          }

          const dataVencimento =
            obterDataVencimento(
              cobranca,
            );

          if (!dataVencimento) {
            console.warn(
              `[Orderly] Cobrança ${cobrancaDoc.id} da empresa ${empresaId} possui vencimento inválido.`,
            );

            continue;
          }

          /*
           * Ainda não venceu.
           */
          if (
            !vencimentoJaPassou(
              cobranca.vencimento,
              agora,
            )
          ) {
            continue;
          }

          /*
           * Se houver várias cobranças vencidas,
           * usamos a mais recente.
           */
          if (
            !dataCobrancaVencida ||
            dataVencimento.getTime() >
              dataCobrancaVencida.getTime()
          ) {
            cobrancaVencida = {
              id: cobrancaDoc.id,
              ...cobranca,
            };

            dataCobrancaVencida =
              dataVencimento;
          }
        }

        /* ==================================================
           BLOQUEIO
        ================================================== */

        if (cobrancaVencida) {
          /*
           * Não sobrescrevemos bloqueadaEm se a
           * empresa já estiver bloqueada.
           */
          const bloqueadaEm =
            empresa.bloqueada === true &&
            empresa.bloqueadaEm
              ? empresa.bloqueadaEm
              : agora;

          await empresaRef.set(
            {
              bloqueada: true,

              motivoBloqueio:
                "COBRANCA_VENCIDA",

              cobrancaVencidaId:
                cobrancaVencida.id,

              bloqueadaEm,

              atualizadoEm:
                agora,
            },
            {
              merge: true,
            },
          );

          /*
           * Também marcamos a cobrança como
           * atrasada.
           *
           * Isso facilita a tela financeira.
           */
          const cobrancaRef =
            cobrancasRef.doc(
              cobrancaVencida.id,
            );

          await cobrancaRef.set(
            {
              status:
                "overdue",

              statusAnterior:
                cobrancaVencida.status ||
                "pending",

              atualizadoEm:
                agora,
            },
            {
              merge: true,
            },
          );

          empresasBloqueadas++;

          console.log(
            `[Orderly] Empresa ${empresaId} BLOQUEADA. ` +
              `Cobrança ${cobrancaVencida.id} vencida em ` +
              `${dataCobrancaVencida.toISOString()}.`,
          );

          continue;
        }

        /* ==================================================
           EMPRESA REGULAR
        ================================================== */

        /*
         * IMPORTANTE:
         *
         * Não desbloqueamos empresas aqui.
         *
         * O desbloqueio é responsabilidade exclusiva
         * do webhook do Mercado Pago quando:
         *
         * pagamento.status === "approved"
         */

        empresasMantidas++;
      } catch (erroEmpresa) {
        empresasComErro++;

        console.error(
          `[Orderly] Erro processando empresa ${empresaId}:`,
          erroEmpresa,
        );
      }
    }

    /* ======================================================
       RESULTADO
    ====================================================== */

    console.log(
      "[Orderly] Verificação de vencimentos concluída.",
      {
        empresasVerificadas,
        empresasBloqueadas,
        empresasMantidas,
        empresasSemCobranca,
        empresasComErro,
      },
    );

    return res.status(200).json({
      success: true,

      executadoEm:
        agora.toISOString(),

      empresasVerificadas,

      empresasBloqueadas,

      empresasMantidas,

      empresasSemCobranca,

      empresasComErro,
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