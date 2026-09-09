const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Wrapper fino sobre o Pool para manter uma API parecida com a antiga
 * (db.query) em todas as rotas. Sempre use `await db.query(sql, params)`.
 */
const db = {
  query: (texto, params) => pool.query(texto, params),
  pool,
};

async function criarTabelas() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco REAL NOT NULL,
      preco_de REAL,
      parcelas TEXT,
      cores JSONB NOT NULL DEFAULT '[]',
      tamanhos JSONB NOT NULL DEFAULT '[]',
      selo TEXT,
      imagem TEXT,
      estoque INTEGER NOT NULL DEFAULT 100,
      ativo BOOLEAN NOT NULL DEFAULT true
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
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
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
      produto_id TEXT NOT NULL REFERENCES produtos(id),
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      tamanho TEXT,
      cor TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cupons (
      codigo TEXT PRIMARY KEY,
      desconto_percentual REAL,
      desconto_fixo REAL,
      valor_minimo REAL,
      ativo BOOLEAN NOT NULL DEFAULT true
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS administradores (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      nome TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Idempotente: cobre bancos criados antes destas colunas existirem.
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_codigo TEXT");
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto REAL NOT NULL DEFAULT 0");
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT");
  await db.query("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT");
}

function extrairProdutosDoArquivo() {
  const productsPath = path.join(__dirname, "..", "..", "..", "js", "products.js");
  const conteudo = fs.readFileSync(productsPath, "utf-8");

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

async function seedProdutos() {
  const { rows } = await db.query("SELECT COUNT(*) AS count FROM produtos");
  if (Number(rows[0].count) > 0) return;

  let produtos = [];
  try {
    produtos = extrairProdutosDoArquivo();
  } catch (erro) {
    console.error("Falha ao ler js/products.js para seed:", erro.message);
    return;
  }

  if (!produtos.length) return;

  for (const produto of produtos) {
    await db.query(
      `INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, imagem, estoque, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        produto.id,
        produto.nome,
        produto.categoria,
        produto.preco,
        produto.precoDe ?? null,
        produto.parcelas ?? null,
        JSON.stringify(produto.cores || []),
        JSON.stringify(produto.tamanhos || []),
        produto.selo ?? null,
        produto.imagem ?? null,
        100,
        true,
      ],
    );
  }

  console.log(`Seed: ${produtos.length} produtos importados de js/products.js`);
}

async function seedCupons() {
  const { rows } = await db.query("SELECT COUNT(*) AS count FROM cupons");
  if (Number(rows[0].count) > 0) return;

  const cuponsIniciais = [
    { codigo: "PRIMEIRACOMPRA", descontoPercentual: 0.1, descontoFixo: null, valorMinimo: 99, ativo: true },
    { codigo: "ESTANCIA10", descontoPercentual: 0.1, descontoFixo: null, valorMinimo: null, ativo: true },
    { codigo: "ESTANCIA20", descontoPercentual: null, descontoFixo: 20, valorMinimo: 199, ativo: true },
  ];

  for (const cupom of cuponsIniciais) {
    await db.query(
      `INSERT INTO cupons (codigo, desconto_percentual, desconto_fixo, valor_minimo, ativo)
       VALUES ($1, $2, $3, $4, $5)`,
      [cupom.codigo, cupom.descontoPercentual, cupom.descontoFixo, cupom.valorMinimo, cupom.ativo],
    );
  }

  console.log(`Seed: ${cuponsIniciais.length} cupons cadastrados.`);
}

async function seedAdministradores() {
  const { rows } = await db.query("SELECT COUNT(*) AS count FROM administradores");
  if (Number(rows[0].count) > 0) return;

  const email = process.env.ADMIN_SEED_EMAIL || "admin@estanciawestern.com.br";
  const senha = process.env.ADMIN_SEED_SENHA || "estancia2026";
  const senhaHash = bcrypt.hashSync(senha, 10);

  await db.query(
    `INSERT INTO administradores (id, email, senha_hash, nome)
     VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), email, senhaHash, "Administrador Estância Western"],
  );

  console.log(`Seed: administrador inicial cadastrado (${email}).`);
}

async function inicializarBanco() {
  await criarTabelas();
  await seedProdutos();
  await seedCupons();
  await seedAdministradores();
}

async function validarCupom(codigo, subtotal) {
  const codigoNormalizado = String(codigo || "").trim().toUpperCase();

  if (!codigoNormalizado) {
    return { valido: false, status: 400, mensagem: "Informe o código do cupom." };
  }

  const { rows } = await db.query("SELECT * FROM cupons WHERE codigo = $1", [codigoNormalizado]);
  const cupom = rows[0];

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
      mensagem: `Valor mínimo não atingido. Este cupom exige compras a partir de R$ ${Number(cupom.valor_minimo).toFixed(2).replace(".", ",")}.`,
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

module.exports = { db, inicializarBanco, validarCupom };
