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
  `);
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

function inicializarBanco() {
  criarTabelas();
  seedProdutos();
}

module.exports = { db, inicializarBanco, DB_PATH };
