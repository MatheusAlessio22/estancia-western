const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "estancia.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function criarTabelas() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco REAL NOT NULL,
      preco_de REAL,
      parcelas TEXT,
      cores TEXT,
      tamanhos TEXT,
      selo TEXT,
      estoque INTEGER NOT NULL DEFAULT 100,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome TEXT NOT NULL,
      cliente_email TEXT NOT NULL,
      cliente_telefone TEXT NOT NULL,
      cep TEXT NOT NULL,
      endereco TEXT NOT NULL,
      numero TEXT NOT NULL,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT NOT NULL,
      estado TEXT NOT NULL,
      total REAL NOT NULL,
      frete REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pendente',
      metodo_pagamento TEXT NOT NULL,
      mp_payment_id TEXT,
      pix_copia_cola TEXT,
      pix_qr_code_base64 TEXT,
      cupom_codigo TEXT,
      desconto REAL NOT NULL DEFAULT 0,
      codigo_rastreio TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      produto_id TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      tamanho TEXT,
      cor TEXT,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );

    CREATE TABLE IF NOT EXISTS cupons (
      codigo TEXT PRIMARY KEY,
      desconto_percentual REAL,
      desconto_fixo REAL,
      valor_minimo REAL,
      ativo INTEGER NOT NULL DEFAULT 1
    );
  `);

  migrarColunasPedidos();
}

function migrarColunasPedidos() {
  const colunas = db.prepare("PRAGMA table_info(pedidos)").all();
  const nomes = new Set(colunas.map((coluna) => coluna.name));

  if (!nomes.has("cupom_codigo")) {
    db.exec("ALTER TABLE pedidos ADD COLUMN cupom_codigo TEXT");
  }
  if (!nomes.has("desconto")) {
    db.exec("ALTER TABLE pedidos ADD COLUMN desconto REAL NOT NULL DEFAULT 0");
  }
  if (!nomes.has("codigo_rastreio")) {
    db.exec("ALTER TABLE pedidos ADD COLUMN codigo_rastreio TEXT");
  }
}

function extrairProdutosDoArquivo() {
  const productsPath = path.join(__dirname, "..", "..", "..", "js", "products.js");
  const conteudo = fs.readFileSync(productsPath, "utf-8");

  const sandbox = {};
  const contexto = `
    ${conteudo}
    module.exports = { PRODUTOS, CATEGORIAS };
  `;

  const Module = require("module");
  const mod = new Module(productsPath);
  mod.filename = productsPath;
  mod.paths = Module._nodeModulePaths(path.dirname(productsPath));
  mod._compile(contexto, productsPath);

  return mod.exports.PRODUTOS || [];
}

function seedProdutos() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM produtos").get();
  if (count > 0) return;

  let produtos = [];
  try {
    produtos = extrairProdutosDoArquivo();
  } catch (erro) {
    console.error("Falha ao ler js/products.js para seed:", erro.message);
    return;
  }

  if (!produtos.length) return;

  const inserir = db.prepare(`
    INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, estoque, ativo)
    VALUES (@id, @nome, @categoria, @preco, @precoDe, @parcelas, @cores, @tamanhos, @selo, @estoque, @ativo)
  `);

  const transacao = db.transaction((lista) => {
    for (const produto of lista) {
      inserir.run({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        precoDe: produto.precoDe ?? null,
        parcelas: produto.parcelas ?? null,
        cores: JSON.stringify(produto.cores || []),
        tamanhos: JSON.stringify(produto.tamanhos || []),
        selo: produto.selo ?? null,
        estoque: 100,
        ativo: 1,
      });
    }
  });

  transacao(produtos);
  console.log(`Seed: ${produtos.length} produtos importados de js/products.js`);
}

function seedCupons() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM cupons").get();
  if (count > 0) return;

  const inserir = db.prepare(`
    INSERT INTO cupons (codigo, desconto_percentual, desconto_fixo, valor_minimo, ativo)
    VALUES (@codigo, @descontoPercentual, @descontoFixo, @valorMinimo, @ativo)
  `);

  const cuponsIniciais = [
    {
      codigo: "PRIMEIRACOMPRA",
      descontoPercentual: 0.1,
      descontoFixo: null,
      valorMinimo: 99,
      ativo: 1,
    },
    {
      codigo: "ESTANCIA10",
      descontoPercentual: 0.1,
      descontoFixo: null,
      valorMinimo: null,
      ativo: 1,
    },
    {
      codigo: "ESTANCIA20",
      descontoPercentual: null,
      descontoFixo: 20,
      valorMinimo: 199,
      ativo: 1,
    },
  ];

  const transacao = db.transaction((lista) => {
    for (const cupom of lista) {
      inserir.run(cupom);
    }
  });

  transacao(cuponsIniciais);
  console.log(`Seed: ${cuponsIniciais.length} cupons cadastrados.`);
}

function inicializarBanco() {
  criarTabelas();
  seedProdutos();
  seedCupons();
}

function validarCupom(codigo, subtotal) {
  const codigoNormalizado = String(codigo || "").trim().toUpperCase();

  if (!codigoNormalizado) {
    return { valido: false, status: 400, mensagem: "Informe o código do cupom." };
  }

  const cupom = db
    .prepare("SELECT * FROM cupons WHERE codigo = ?")
    .get(codigoNormalizado);

  if (!cupom) {
    return { valido: false, status: 400, mensagem: "Cupom inválido." };
  }

  if (!cupom.ativo) {
    return { valido: false, status: 400, mensagem: "Cupom expirado." };
  }

  const subtotalNumerico = Number(subtotal) || 0;

  if (cupom.valor_minimo && subtotalNumerico < cupom.valor_minimo) {
    return {
      valido: false,
      status: 400,
      mensagem: `Valor mínimo não atingido. Este cupom exige compras a partir de R$ ${cupom.valor_minimo.toFixed(2).replace(".", ",")}.`,
    };
  }

  const desconto = cupom.desconto_percentual
    ? subtotalNumerico * cupom.desconto_percentual
    : Math.min(cupom.desconto_fixo || 0, subtotalNumerico);

  return {
    valido: true,
    codigo: cupom.codigo,
    desconto,
    mensagem: "Cupom aplicado com sucesso!",
  };
}

module.exports = { db, inicializarBanco, DB_PATH, validarCupom };
