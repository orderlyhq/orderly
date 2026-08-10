const iconv = require("iconv-lite");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

/*
|--------------------------------------------------------------------------
| CONFIGURAÇÃO
|--------------------------------------------------------------------------
*/

const PRINTER_NAME = null;

const LARGURA = 48;

const ESC = "\x1B";
const GS = "\x1D";

const CMD = {
  RESET: ESC + "@",

  BOLD_ON: ESC + "E\x01",
  BOLD_OFF: ESC + "E\x00",

  UNDERLINE: ESC + "-\x01",
  UNDERLINE_OFF: ESC + "-\x00",

  CENTER: ESC + "a\x01",
  LEFT: ESC + "a\x00",

  DOUBLE: ESC + "!\x30",
  NORMAL: ESC + "!\x00",

  CUT: GS + "V\x01",
};

/*
|--------------------------------------------------------------------------
| ESTADO
|--------------------------------------------------------------------------
*/

const estado = {
  online: true,
  fila: 0,
  impressosHoje: 0,
  ultimaImpressao: null,
};

/*
|--------------------------------------------------------------------------
| UTILITÁRIOS
|--------------------------------------------------------------------------
*/

function texto(valor) {
  if (valor === undefined || valor === null) {
    return "";
  }

  return String(valor);
}

function numero(valor) {
  return Number(valor || 0);
}

function formatarMoeda(valor) {
  return numero(valor).toFixed(2).replace(".", ",");
}

function moeda(valor) {
  return Number(valor || 0)
    .toFixed(2)
    .replace(".", ",");
}

function linha(caractere = "-") {
  return caractere.repeat(LARGURA);
}

function linhaDupla() {
  return "=".repeat(LARGURA);
}

function campo(nome, valor) {
  return `${nome}: ${texto(valor)}\n`;
}

function centralizar(textoLinha) {
  textoLinha = texto(textoLinha);

  if (textoLinha.length >= LARGURA) {
    return textoLinha;
  }

  const esquerda = Math.floor(
    (LARGURA - textoLinha.length) / 2,
  );

  return " ".repeat(esquerda) + textoLinha;
}

function duasColunas(esquerda, direita) {
  esquerda = texto(esquerda);
  direita = texto(direita);

  const espacos =
    LARGURA - esquerda.length - direita.length;

  if (espacos <= 1) {
    return `${esquerda} ${direita}`;
  }

  return (
    esquerda +
    " ".repeat(espacos) +
    direita
  );
}

function quebrarLinha(valor, largura = LARGURA) {
  valor = texto(valor);

  const palavras = valor.split(" ");

  const linhas = [];

  let atual = "";

  for (const palavra of palavras) {
    if (!palavra) {
      continue;
    }

    if (
      atual &&
      (atual + palavra).length > largura
    ) {
      linhas.push(atual.trim());

      atual = "";
    }

    atual += palavra + " ";
  }

  if (atual.trim()) {
    linhas.push(atual.trim());
  }

  return linhas;
}

function limparTexto(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function dataAtual() {
  return new Date().toLocaleString("pt-BR");
}

/*
|--------------------------------------------------------------------------
| IMPRESSÃO RAW
|--------------------------------------------------------------------------
*/

function imprimirRAW() {
  return new Promise((resolve, reject) => {
    const arquivo = path.join(
      __dirname,
      "raw-print.ps1",
    );

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        arquivo,
      ],
      {
        windowsHide: true,
      },
      (erro, stdout, stderr) => {
        if (erro) {
          console.error(
            "[PRINTER] Erro RAW:",
            stderr || erro.message,
          );

          reject(erro);
          return;
        }

        console.log(stdout);

        resolve();
      },
    );
  });
}

/*
|--------------------------------------------------------------------------
| ENVIO RAW PARA IMPRESSORA
|--------------------------------------------------------------------------
*/

async function enviarRAW(conteudo) {
  const arquivoRaw = path.join(
    __dirname,
    "cupom.raw",
  );

  fs.writeFileSync(
    arquivoRaw,
    iconv.encode(conteudo, "cp850"),
  );

  const script = path.join(
    __dirname,
    "raw-print.ps1",
  );

  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        script,
        arquivoRaw,
      ],
      {
        windowsHide: true,
      },
      (erro, stdout, stderr) => {
        if (erro) {
          console.error(
            "[PRINTER] Erro ao enviar RAW:",
            stderr || erro.message,
          );

          reject(erro);
          return;
        }

        if (stdout) {
          console.log(stdout);
        }

        resolve();
      },
    );
  });
}

/*
|--------------------------------------------------------------------------
| VERIFICAÇÃO DA IMPRESSORA
|--------------------------------------------------------------------------
*/

async function verificarImpressora() {
  /*
   * Mantido como no sistema atual.
   *
   * Posteriormente podemos substituir por uma verificação
   * real da impressora Windows.
   */

  return true;
}

async function iniciarImpressao() {
  const conectada =
    await verificarImpressora();

  if (!conectada) {
    throw new Error(
      "Nenhuma impressora configurada.",
    );
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| MONTAGEM DO CUPOM
|--------------------------------------------------------------------------
*/

async function imprimirPedido(pedido) {
  let cupom = "";

  /*
  |--------------------------------------------------------------------------
  | RESET / CODEPAGE
  |--------------------------------------------------------------------------
  */

  cupom += CMD.RESET;

  // ESC t 2 = CP850
  cupom += "\x1B\x74\x02";

  /*
  |--------------------------------------------------------------------------
  | CABEÇALHO
  |--------------------------------------------------------------------------
  */

  cupom += CMD.CENTER;

  cupom += CMD.BOLD_ON;
  cupom += CMD.DOUBLE;

  cupom +=
    pedido.nomeEmpresa ||
    "ORDERLY";

  cupom += CMD.NORMAL;
  cupom += CMD.BOLD_OFF;

  cupom += "\n";
  cupom += linhaDupla();
  cupom += "\n";

  /*
  |--------------------------------------------------------------------------
  | PEDIDO
  |--------------------------------------------------------------------------
  */

  cupom += CMD.LEFT;

  cupom += CMD.BOLD_ON;

  cupom += campo(
    "PEDIDO",
    "#" + texto(pedido.numeroPedido),
  );

  cupom += campo(
    "DATA",
    pedido.dataHora || dataAtual(),
  );

  cupom += CMD.BOLD_OFF;

  cupom += linha();
  cupom += "\n";

  /*
  |--------------------------------------------------------------------------
  | CLIENTE
  |--------------------------------------------------------------------------
  */

  cupom += CMD.BOLD_ON;

  cupom += `CLIENTE ${texto(
    pedido.cliente,
  )}\n`;

  cupom += CMD.BOLD_OFF;

  cupom += `Telefone: ${texto(
    pedido.telefone,
  )}\n`;

  if (
    (pedido.tipo || "").toUpperCase() ===
    "MESA"
  ) {
    cupom += `Mesa: ${
      pedido.numeroMesa ??
      pedido.mesa ??
      "-"
    }\n`;
  }

  cupom += linha();
  cupom += "\n";

  /*
  |--------------------------------------------------------------------------
  | ITENS
  |--------------------------------------------------------------------------
  */

  cupom += CMD.BOLD_ON;
  cupom += "ITENS DO PEDIDO\n";
  cupom += CMD.BOLD_OFF;

  for (const item of pedido.itens || []) {
    cupom += duasColunas(
      `${texto(item.quantidade)}x ${texto(
        item.nome,
      )}`,
      "R$ " +
        moeda(item.valorUnitario),
    );

    cupom += "\n";

    /*
    | COMPLEMENTOS
    */

    if (
      Array.isArray(item.adicionais) &&
      item.adicionais.length
    ) {
      cupom += "\n";
      cupom += "COMPLEMENTOS:\n";

      for (const adicional of item.adicionais) {
        cupom += `${texto(
          adicional.nome,
        )} R$ ${moeda(
          adicional.preco ??
            adicional.valor,
        )}\n`;
      }
    }

    /*
    | OBSERVAÇÃO DO ITEM
    */

    if (item.observacaoItem) {
      cupom += "\n";

      cupom += CMD.BOLD_ON;
      cupom += "[ OBSERVACAO ]\n";
      cupom += CMD.BOLD_OFF;

      cupom +=
        texto(
          item.observacaoItem,
        ).toUpperCase() + "\n";
    }

    cupom += "\n";
  }

  cupom += linha();
  cupom += "\n";

  /*
  |--------------------------------------------------------------------------
  | ENTREGA / RETIRADA / MESA
  |--------------------------------------------------------------------------
  */

  if (
    pedido.tipo &&
    pedido.tipo.toUpperCase() ===
      "DELIVERY"
  ) {
    cupom += CMD.BOLD_ON;
    cupom += "ENTREGA\n";
    cupom += CMD.BOLD_OFF;

    if (pedido.endereco) {
      cupom += CMD.DOUBLE;

      cupom += "ENDEREÇO:\n\n";

      if (
        typeof pedido.endereco ===
        "object"
      ) {
        const e = pedido.endereco;

        let linhaEndereco =
          e.rua || "";

        if (e.numero) {
          linhaEndereco +=
            `, ${e.numero}`;
        }

        if (e.bairro) {
          linhaEndereco +=
            ` ${e.bairro}`;
        }

        quebrarLinha(
          linhaEndereco,
          LARGURA,
        ).forEach((linhaEnderecoTexto) => {
          cupom +=
            linhaEnderecoTexto +
            "\n";
        });

        if (e.cep) {
          cupom += `CEP: ${e.cep}\n`;
        }

        if (e.complemento) {
          const linhas =
            quebrarLinha(
              `Complemento: ${e.complemento}`,
              LARGURA,
            );

          linhas.forEach(
            (linhaComplemento) => {
              cupom +=
                linhaComplemento +
                "\n";
            },
          );
        }
      } else {
        cupom +=
          `${pedido.endereco}\n`;
      }

      cupom += CMD.NORMAL;
    }
  } else {
    cupom += CMD.BOLD_ON;

    cupom += `TIPO: ${
      pedido.tipo || "-"
    }\n`;

    cupom += CMD.BOLD_OFF;
  }

  /*
  |--------------------------------------------------------------------------
  | OBSERVAÇÕES
  |--------------------------------------------------------------------------
  */

  if (pedido.observacoes) {
    cupom += CMD.BOLD_ON;

    cupom +=
      "OBSERVAÇÕES\n";

    cupom += CMD.BOLD_OFF;

    quebrarLinha(
      texto(
        pedido.observacoes,
      ).toUpperCase(),
    ).forEach((linhaObservacao) => {
      cupom +=
        linhaObservacao + "\n";
    });

    cupom += linha();
    cupom += "\n";
  } else {
    cupom += linha();
    cupom += "\n";
  }

  /*
  |--------------------------------------------------------------------------
  | PAGAMENTO
  |--------------------------------------------------------------------------
  */

  cupom += CMD.BOLD_ON;

  cupom += `PAGAMENTO ${
    pedido.pagamentoMetodo ||
    "-"
  }\n`;

  cupom += CMD.BOLD_OFF;

  /*
  |--------------------------------------------------------------------------
  | TROCO
  |--------------------------------------------------------------------------
  */

  if (
    pedido.pagamentoMetodo &&
    pedido.pagamentoMetodo
      .toUpperCase() ===
      "DINHEIRO"
  ) {
    const total = Number(
      pedido.valorTotal || 0,
    );

    if (
      pedido.trocoPara !== null &&
      pedido.trocoPara !== undefined &&
      pedido.trocoPara !== ""
    ) {
      const pago = Number(
        pedido.trocoPara,
      );

      const troco = pago - total;

      cupom += `CLIENTE PAGA: R$ ${moeda(
        pago,
      )}\n`;

      cupom += `TROCO: R$ ${moeda(
        troco,
      )}\n`;
    }
  }

  cupom += linha();
  cupom += "\n";

  /*
  |--------------------------------------------------------------------------
  | VALORES
  |--------------------------------------------------------------------------
  */

  cupom += `Subtotal: R$ ${moeda(
    pedido.valorSubtotal,
  )}\n`;

  if (
    pedido.tipo &&
    pedido.tipo.toUpperCase() ===
      "DELIVERY"
  ) {
    cupom += `Entrega: R$ ${moeda(
      pedido.taxaEntrega,
    )}\n`;
  }

  cupom += "\n";

  /*
  |--------------------------------------------------------------------------
  | TOTAL
  |--------------------------------------------------------------------------
  */

  cupom += CMD.CENTER;

  cupom += CMD.BOLD_ON;
  cupom += CMD.DOUBLE;

  cupom += `TOTAL: R$ ${moeda(
    pedido.valorTotal,
  )}\n`;

  cupom += CMD.NORMAL;
  cupom += CMD.BOLD_OFF;

  /*
  |--------------------------------------------------------------------------
  | TROCO NÃO INFORMADO
  |--------------------------------------------------------------------------
  */

  if (
    pedido.pagamentoMetodo &&
    pedido.pagamentoMetodo
      .toUpperCase() ===
      "DINHEIRO" &&
    (
      pedido.trocoPara === null ||
      pedido.trocoPara ===
        undefined ||
      pedido.trocoPara === ""
    )
  ) {
    cupom += "\n";

    cupom += CMD.LEFT;
    cupom += CMD.BOLD_ON;

    cupom += "TROCO: ";

    cupom += CMD.BOLD_OFF;

    cupom +=
      "Cliente informou que possui trocado.\n";
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL
  |--------------------------------------------------------------------------
  */

  cupom += CMD.NORMAL;
  cupom += CMD.BOLD_OFF;

  cupom += "\n";

  cupom +=
    "Obrigado pela preferencia!\n";

  cupom += "\n\n\n";

  cupom += CMD.CUT;

  /*
  |--------------------------------------------------------------------------
  | ENVIO
  |--------------------------------------------------------------------------
  */

  await enviarRAW(cupom);

  estado.impressosHoje++;

  estado.ultimaImpressao =
    new Date().toISOString();

  return true;
}

/*
|--------------------------------------------------------------------------
| IMPRESSÃO DE TESTE
|--------------------------------------------------------------------------
*/

async function imprimirTeste() {
  const pedidoFake = {
    id: "TESTE-ACENTOS-001",

    numeroPedido: "271385",

    cliente:
      "João José da Silva Ávila",

    telefone:
      "(19) 99999-9999",

    telefoneWhatsapp:
      "5519999999999",

    tipo: "Delivery",

    status: "RECEBIDO",

    bairro:
      "São José do Piauí",

    endereco:
      "Rua João Dias da Silva, nº 203 - Vila São Luís",

    referencia:
      "Casa azul próxima à padaria",

    observacoes:
      "Sem cebola, sem pimentão, atenção à entrega rápida",

    pagamentoMetodo: "PIX",

    pagamentoStatus: "PENDENTE",

    trocoPara: 100,

    taxaEntrega: 8,

    valorSubtotal: 39.9,

    valorTotal: 47.9,

    itens: [
      {
        nome:
          "X-Búrguer Especial com Queijo",

        quantidade: 2,

        valorUnitario: 19.95,

        subtotal: 39.9,

        adicionais: [
          {
            nome:
              "Hambúrguer Grande",
            valor: 5,
          },
          {
            nome:
              "Queijo Muçarela",
            valor: 3,
          },
          {
            nome:
              "Coração de Frango à Milanesa",
            valor: 7,
          },
          {
            nome:
              "Pimentão Vermelho",
            valor: 2,
          },
        ],

        observacaoItem:
          "Sem tomate, sem cebola, adicionar molho especial",
      },

      {
        nome:
          "Coca-Cola 2L Gelada",

        quantidade: 1,

        valorUnitario: 5.9,

        subtotal: 5.9,

        adicionais: [],

        observacaoItem:
          "Entregar bem gelada",
      },

      {
        nome:
          "Açaí com Banana e Morango",

        quantidade: 1,

        valorUnitario: 12.5,

        subtotal: 12.5,

        adicionais: [
          {
            nome:
              "Leite Condensado",
            valor: 2,
          },
          {
            nome:
              "Granola Crocante",
            valor: 1.5,
          },
        ],

        observacaoItem:
          "Pouco açúcar",
      },
    ],
  };

  estado.fila++;

  try {
    await imprimirPedido(
      pedidoFake,
    );
  } finally {
    estado.fila = Math.max(
      0,
      estado.fila - 1,
    );
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTAÇÕES
|--------------------------------------------------------------------------
|
| O printer.js NÃO inicia servidor HTTP.
| O bot.js é responsável pelas rotas.
|--------------------------------------------------------------------------
*/

module.exports = {
  estado,
  PRINTER_NAME,
  LARGURA,

  verificarImpressora,
  iniciarImpressao,

  imprimirRAW,
  imprimirPedido,
  imprimirTeste,
};