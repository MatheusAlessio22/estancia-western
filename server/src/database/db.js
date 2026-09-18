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

  await db.query(`
    CREATE TABLE IF NOT EXISTS newsletter_assinantes (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id SERIAL PRIMARY KEY,
      produto_id TEXT NOT NULL REFERENCES produtos(id),
      nome_cliente TEXT NOT NULL,
      nota_estrelas INTEGER NOT NULL CHECK (nota_estrelas BETWEEN 1 AND 5),
      comentario TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Hierarquia de navegação do Mega Menu: Departamento (parent_id nulo) >
  // Categoria (parent_id = departamento) > Subcategoria (parent_id = categoria).
  // `slug` não é globalmente único (ex: "camisas" pode existir sob Cowboys E
  // Cowgirls), então a unicidade é por (parent_id, slug).
  await db.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      slug TEXT NOT NULL,
      parent_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
      ordem INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS categorias_parent_slug_idx
    ON categorias (COALESCE(parent_id, 0), slug)
  `);

  // Idempotente: cobre bancos criados antes destas colunas existirem.
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_codigo TEXT");
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto REAL NOT NULL DEFAULT 0");
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT");
  await db.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status_envio TEXT NOT NULL DEFAULT 'preparando'");
  await db.query("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT");
  await db.query("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagens JSONB NOT NULL DEFAULT '[]'");
  await db.query("ALTER TABLE cupons ADD COLUMN IF NOT EXISTS validade DATE");
  await db.query("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS excluido BOOLEAN NOT NULL DEFAULT false");
  await db.query("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES categorias(id)");
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

/**
 * Árvore de navegação do Mega Menu: Departamento > Categoria > Subcategoria.
 * Os slugs de subcategoria (nível folha) espelham os slugs já usados em
 * `produtos.categoria` (js/products.js) para permitir, no futuro, ligar
 * produtos existentes à hierarquia sem precisar renomear nada.
 */
const ARVORE_CATEGORIAS = [
  {
    nome: "Cowgirls",
    slug: "cowgirls",
    categorias: [
      {
        nome: "Vestuário",
        slug: "vestuario",
        subcategorias: [
          { nome: "Camisas & Camisetas", slug: "camisas" },
        ],
      },
      {
        nome: "Calçados",
        slug: "calcados",
        subcategorias: [
          { nome: "Botas & Calçados", slug: "botas-calcados" },
        ],
      },
      {
        nome: "Chapéus & Bonés",
        slug: "chapeus-bones",
        subcategorias: [
          { nome: "Chapéus & Bonés", slug: "chapeus-bones" },
        ],
      },
      {
        nome: "Cintos & Fivelas",
        slug: "cintos-fivelas",
        subcategorias: [
          { nome: "Cintos & Fivelas", slug: "cintos-fivelas" },
        ],
      },
      {
        nome: "Acessórios",
        slug: "acessorios",
        subcategorias: [
          { nome: "Acessórios", slug: "acessorios" },
        ],
      },
    ],
  },
  {
    nome: "Cowboys",
    slug: "cowboys",
    categorias: [
      { nome: "Vestuário", slug: "vestuario", subcategorias: [{ nome: "Camisas & Camisetas", slug: "camisas" }] },
      { nome: "Calçados", slug: "calcados", subcategorias: [{ nome: "Botas & Calçados", slug: "botas-calcados" }] },
      { nome: "Chapéus & Bonés", slug: "chapeus-bones", subcategorias: [{ nome: "Chapéus & Bonés", slug: "chapeus-bones" }] },
      { nome: "Cintos & Fivelas", slug: "cintos-fivelas", subcategorias: [{ nome: "Cintos & Fivelas", slug: "cintos-fivelas" }] },
      { nome: "Acessórios", slug: "acessorios", subcategorias: [{ nome: "Acessórios", slug: "acessorios" }] },
    ],
  },
];

async function seedCategorias() {
  const { rows } = await db.query("SELECT COUNT(*) AS count FROM categorias");
  if (Number(rows[0].count) > 0) return;

  for (let i = 0; i < ARVORE_CATEGORIAS.length; i++) {
    const departamento = ARVORE_CATEGORIAS[i];
    const { rows: depRows } = await db.query(
      "INSERT INTO categorias (nome, slug, parent_id, ordem) VALUES ($1, $2, NULL, $3) RETURNING id",
      [departamento.nome, departamento.slug, i],
    );
    const departamentoId = depRows[0].id;

    for (let j = 0; j < departamento.categorias.length; j++) {
      const categoria = departamento.categorias[j];
      const { rows: catRows } = await db.query(
        "INSERT INTO categorias (nome, slug, parent_id, ordem) VALUES ($1, $2, $3, $4) RETURNING id",
        [categoria.nome, categoria.slug, departamentoId, j],
      );
      const categoriaId = catRows[0].id;

      for (let k = 0; k < categoria.subcategorias.length; k++) {
        const sub = categoria.subcategorias[k];
        await db.query(
          "INSERT INTO categorias (nome, slug, parent_id, ordem) VALUES ($1, $2, $3, $4)",
          [sub.nome, sub.slug, categoriaId, k],
        );
      }
    }
  }

  console.log("Seed: árvore de categorias do Mega Menu criada (Cowboys/Cowgirls).");
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
  await seedCategorias();
  await seedAdministradores();
}

/**
 * Monta a árvore completa de categorias (Departamento > Categoria >
 * Subcategoria) em uma única consulta, agrupando em memória. Usada pela
 * rota pública que alimenta o Mega Menu da vitrine.
 */
async function buscarArvoreCategorias() {
  const { rows } = await db.query(
    "SELECT id, nome, slug, parent_id, ordem FROM categorias ORDER BY parent_id NULLS FIRST, ordem ASC, nome ASC",
  );

  const porId = new Map(rows.map((linha) => [linha.id, { ...linha, filhos: [] }]));
  const raizes = [];

  for (const linha of rows) {
    const no = porId.get(linha.id);
    if (linha.parent_id && porId.has(linha.parent_id)) {
      porId.get(linha.parent_id).filhos.push(no);
    } else if (!linha.parent_id) {
      raizes.push(no);
    }
  }

  return raizes;
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

  if (cupom.validade && new Date(cupom.validade) < new Date(new Date().toDateString())) {
    return { valido: false, status: 400, mensagem: "Este cupom expirou." };
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

/**
 * Cadastra um e-mail na newsletter. Idempotente: se o e-mail já existir,
 * não gera erro nem duplica a linha, apenas informa que já era assinante.
 */
async function cadastrarNewsletter(email, telefone) {
  const { rows } = await db.query(
    `INSERT INTO newsletter_assinantes (email, telefone)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, telefone || null],
  );

  return { novoCadastro: rows.length > 0 };
}

/**
 * Lista as avaliações de um produto (mais recentes primeiro) junto com a
 * média de estrelas e o total de avaliações — tudo em duas consultas
 * simples para manter a rota fácil de ler.
 */
async function listarAvaliacoes(produtoId) {
  const [{ rows: avaliacoes }, { rows: resumoRows }] = await Promise.all([
    db.query(
      "SELECT id, nome_cliente, nota_estrelas, comentario, criado_em FROM avaliacoes WHERE produto_id = $1 ORDER BY criado_em DESC",
      [produtoId],
    ),
    db.query(
      "SELECT COUNT(*) AS total, AVG(nota_estrelas) AS media FROM avaliacoes WHERE produto_id = $1",
      [produtoId],
    ),
  ]);

  const resumo = resumoRows[0];

  return {
    avaliacoes,
    total: Number(resumo.total),
    media: resumo.total > 0 ? Number(resumo.media) : 0,
  };
}

/**
 * Cria uma avaliação para um produto existente. Retorna null quando o
 * produto não existe, para a rota decidir o status HTTP apropriado.
 */
async function criarAvaliacao({ produtoId, nomeCliente, notaEstrelas, comentario }) {
  const { rows: produtoRows } = await db.query("SELECT id FROM produtos WHERE id = $1", [produtoId]);
  if (!produtoRows[0]) return null;

  const { rows } = await db.query(
    `INSERT INTO avaliacoes (produto_id, nome_cliente, nota_estrelas, comentario)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nome_cliente, nota_estrelas, comentario, criado_em`,
    [produtoId, nomeCliente, notaEstrelas, comentario || null],
  );

  return rows[0];
}

module.exports = {
  db,
  inicializarBanco,
  validarCupom,
  cadastrarNewsletter,
  listarAvaliacoes,
  criarAvaliacao,
  buscarArvoreCategorias,
};
