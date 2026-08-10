const express = require("express");
const cors = require("cors");

/*
|--------------------------------------------------------------------------
| WHATSAPP
|--------------------------------------------------------------------------
*/

const {
  iniciarWhatsapp,
} = require("./whatsapp/client");

/*
|--------------------------------------------------------------------------
| IMPRESSORA
|--------------------------------------------------------------------------
*/

const {
  estado: estadoImpressora,
  verificarImpressora,
  imprimirRAW,
  imprimirPedido,
  imprimirTeste,
  PRINTER_NAME,
} = require("./printer");

/*
|--------------------------------------------------------------------------
| BEE DELIVERY
|--------------------------------------------------------------------------
|
| O módulo Bee continua separado.
| Quando os endpoints forem implementados, eles serão registrados
| neste servidor principal.
|--------------------------------------------------------------------------
*/

// const { beeRequest } = require("./bee/bee");

/*
|--------------------------------------------------------------------------
| SERVIDOR
|--------------------------------------------------------------------------
*/

const app = express();

const PORT = Number(
  process.env.PORT || 3001,
);

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(
  express.json({
    limit: "2mb",
  }),
);

/*
|--------------------------------------------------------------------------
| LOG BÁSICO DAS REQUISIÇÕES
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  console.log(
    `[HTTP] ${req.method} ${req.originalUrl}`,
  );

  next();
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "orderly-server",
    timestamp:
      new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| STATUS GERAL
|--------------------------------------------------------------------------
*/

app.get("/status", async (req, res) => {
  try {
    const online =
      await verificarImpressora();

    estadoImpressora.online =
      online;

    res.json({
      success: true,

      service: "orderly-server",

      online,

      printer: {
        online,

        name: PRINTER_NAME,

        fila:
          estadoImpressora.fila,

        impressosHoje:
          estadoImpressora.impressosHoje,

        ultimaImpressao:
          estadoImpressora.ultimaImpressao,
      },
    });
  } catch (error) {
    console.error(
      "[STATUS]",
      error,
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| IMPRESSORA
|--------------------------------------------------------------------------
*/

/*
 * Teste RAW antigo.
 *
 * POST /print/raw-test
 */

app.post(
  "/print/raw-test",
  async (req, res) => {
    try {
      await imprimirRAW();

      res.json({
        success: true,
        message:
          "RAW enviado.",
      });
    } catch (error) {
      console.error(
        "[PRINT RAW TEST]",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| IMPRESSÃO DE TESTE
|--------------------------------------------------------------------------
|
| POST /print/test
|--------------------------------------------------------------------------
*/

app.post(
  "/print/test",
  async (req, res) => {
    try {
      estadoImpressora.fila++;

      await imprimirTeste();

      res.json({
        success: true,

        message:
          "Impressão de teste enviada.",
      });
    } catch (error) {
      console.error(
        "[PRINT TEST]",
        error,
      );

      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    } finally {
      estadoImpressora.fila =
        Math.max(
          0,
          estadoImpressora.fila - 1,
        );
    }
  },
);

/*
|--------------------------------------------------------------------------
| IMPRIMIR PEDIDO
|--------------------------------------------------------------------------
|
| POST /print/order
|--------------------------------------------------------------------------
*/

app.post(
  "/print/order",
  async (req, res) => {
    console.log(
      "======================================",
    );

    console.log(
      "[PRINT ORDER] JSON RECEBIDO:",
    );

    console.log(
      JSON.stringify(
        req.body,
        null,
        2,
      ),
    );

    console.log(
      "typeof endereco:",
      typeof req.body?.endereco,
    );

    console.log(
      "endereco:",
      req.body?.endereco,
    );

    console.log(
      "======================================",
    );

    try {
      const pedido =
        req.body || {};

      if (
        !pedido ||
        typeof pedido !==
          "object"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Pedido inválido.",
        });
      }

      estadoImpressora.fila++;

      await imprimirPedido(
        pedido,
      );

      res.json({
        success: true,

        message:
          "Pedido impresso com sucesso.",
      });
    } catch (error) {
      console.error(
        "[PRINT ORDER] Erro ao imprimir pedido:",
      );

      console.error(error);

      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    } finally {
      estadoImpressora.fila =
        Math.max(
          0,
          estadoImpressora.fila - 1,
        );
    }
  },
);

/*
|--------------------------------------------------------------------------
| FILA DE IMPRESSÃO
|--------------------------------------------------------------------------
*/

app.post(
  "/queue/clear",
  (req, res) => {
    estadoImpressora.fila = 0;

    res.json({
      success: true,

      message:
        "Fila limpa.",
    });
  },
);

/*
|--------------------------------------------------------------------------
| PEDIDOS
|--------------------------------------------------------------------------
|
| Reservado para os endpoints do Orderly.
|
| Exemplos futuros:
|
| GET  /orders
| GET  /orders/:id
| POST /orders
| PATCH /orders/:id
| POST /orders/:id/status
|
|--------------------------------------------------------------------------
*/

/*
app.get("/orders", async (req, res) => {
  ...
});

app.post("/orders", async (req, res) => {
  ...
});
*/

/*
|--------------------------------------------------------------------------
| BEE DELIVERY
|--------------------------------------------------------------------------
|
| O servidor principal continuará sendo este bot.js.
|
| Futuramente:
|
| POST /bee/quote
| POST /bee/order
| POST /bee/cancel
| GET  /bee/order/:id
|
|--------------------------------------------------------------------------
*/

/*
app.post("/bee/quote", async (req, res) => {
  try {

    const resultado = await beeRequest(
      "/quote",
      req.body
    );

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});
*/

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "Endpoint não encontrado.",

      method: req.method,

      path: req.originalUrl,
    });
  },
);

/*
|--------------------------------------------------------------------------
| TRATAMENTO GLOBAL DE ERROS
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    console.error(
      "[SERVER ERROR]",
      error,
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      success: false,

      message:
        error.message ||
        "Erro interno do servidor.",
    });
  },
);

/*
|--------------------------------------------------------------------------
| WHATSAPP
|--------------------------------------------------------------------------
*/

async function iniciarServicos() {
  console.log(
    "========================================",
  );

  console.log(
    " ORDERLY SERVER",
  );

  console.log(
    "========================================",
  );

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP
  |--------------------------------------------------------------------------
  */

  try {
    await iniciarWhatsapp();

    console.log(
      "[WHATSAPP] Inicialização solicitada.",
    );
  } catch (error) {
    console.error(
      "[WHATSAPP] Erro ao iniciar:",
      error,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMPRESSORA
  |--------------------------------------------------------------------------
  */

  try {
    const online =
      await verificarImpressora();

    estadoImpressora.online =
      online;

    console.log(
      `[PRINTER] Status: ${
        online
          ? "ONLINE"
          : "OFFLINE"
      }`,
    );
  } catch (error) {
    estadoImpressora.online =
      false;

    console.error(
      "[PRINTER] Erro ao verificar:",
      error,
    );
  }
}

/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

const server = app.listen(
  PORT,
  () => {
    console.log(
      "========================================",
    );

    console.log(
      " ORDERLY HTTP SERVER",
    );

    console.log(
      "========================================",
    );

    console.log(
      `HTTP: http://localhost:${PORT}`,
    );

    console.log(
      `Health: http://localhost:${PORT}/health`,
    );

    console.log(
      `Status: http://localhost:${PORT}/status`,
    );

    console.log(
      `Printer: ${
        PRINTER_NAME || "Windows Default"
      }`,
    );

    console.log(
      "========================================",
    );

    iniciarServicos();
  },
);

/*
|--------------------------------------------------------------------------
| ENCERRAMENTO
|--------------------------------------------------------------------------
*/

function encerrarServidor(
  sinal,
) {
  console.log(
    `[SERVER] Recebido ${sinal}. Encerrando...`,
  );

  server.close(() => {
    console.log(
      "[SERVER] HTTP encerrado.",
    );

    process.exit(0);
  });
}

process.on(
  "SIGINT",
  () => encerrarServidor("SIGINT"),
);

process.on(
  "SIGTERM",
  () => encerrarServidor("SIGTERM"),
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  app,
  server,
};