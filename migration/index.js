const mesa = require("./firebase-mesa");
const orderly = require("./firebase-orderly");

const migrateEmpresa = require("./migrateEmpresa");
const migrateProdutos = require("./migrateProdutos");
const migrateCategorias = require("./migrateCategorias");
const migrateAdicionais = require("./migrateAdicionais");
const migratePromocoes = require("./migratePromocoes");
const migrateClientes = require("./migrateClientes");
const migrateConfiguracoes = require("./migrateConfiguracoes");
const migrateUsuarios = require("./migrateUsuarios");
const migratePedidos = require("./migratePedidos");
const migrateTaxasEntrega = require("./migrateTaxasEntrega");

const logger = require("./utils/logger");

const dryRun = process.argv.includes("--dry-run");

async function main() {
  try {
    const contexto = {
      dryRun,

      empresa: null,

      maps: {
        categoriaId: {},
        produtoId: {},
        clienteId: {},
      },

      relatorio: {
        empresas: 0,
        produtos: 0,
        categorias: 0,
        adicionais: 0,
        promocoes: 0,
        clientes: 0,
        pedidos: 0,
        usuarios: 0,
        taxasEntrega: 0,
      },
    };

    logger.info(dryRun ? "MODO SIMULAÇÃO" : "MIGRAÇÃO REAL");

    const empresaIdMesa = "COLOQUE_ID_DA_EMPRESA_MESA";

    const empresa = await migrateEmpresa(
      mesa,
      orderly,
      empresaIdMesa,
      contexto,
    );

    contexto.empresa = empresa;

    if (!dryRun) {
      console.log("");
      console.log("======================================");
      console.log("         MIGRAÇÃO REAL");
      console.log("======================================");
      console.log(`Empresa : ${empresa.nomeFantasia}`);
      console.log("Origem  : Mesa Fácil");
      console.log("Destino : Orderly");
      console.log(`Tenant  : ${empresa.id}`);
      console.log("======================================");
      console.log("");
    }

    await migrateCategorias(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    await migrateAdicionais(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    await migrateProdutos(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    await migratePromocoes(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    await migrateClientes(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    await migrateConfiguracoes(
      mesa,
      orderly,
      empresaIdMesa,
      empresa.id,
      contexto,
    );

    await migrateTaxasEntrega(
      mesa,
      orderly,
      empresaIdMesa,
      empresa.id,
      contexto,
    );

    await migrateUsuarios(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    await migratePedidos(mesa, orderly, empresaIdMesa, empresa.id, contexto);

    console.log("\n====================");
    console.log("RELATÓRIO");
    console.log("====================");

    console.table(contexto.relatorio);
  } catch (e) {
    logger.error(e.message);
  }
}

main();
