const express = require("express");
const crypto = require("crypto");
const { db } = require("../database/db");
const { verificarAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(verificarAdmin);

function formatarProduto(linha) {
  const imagens = linha.imagens && linha.imagens.length > 0 ? linha.imagens : linha.imagem ? [linha.imagem] : [];

  return {
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    preco: linha.preco,
    precoDe: linha.preco_de,
    parcelas: linha.parcelas,
    cores: linha.cores || [],
    tamanhos: linha.tamanhos || [],
    selo: linha.selo,
    imagem: imagens[0] || linha.imagem || null,
    imagens,
    estoque: linha.estoque,
    ativo: !!linha.ativo,
  };
}

function normalizarImagens(dados) {
  const imagens = Array.isArray(dados.imagens)
    ? dados.imagens.map((url) => String(url || "").trim()).filter(Boolean)
    : [];

  if (imagens.length === 0 && dados.imagem) {
    imagens.push(String(dados.imagem).trim());
  }

  return imagens;
}

function validarDadosProduto(dados) {
  if (!String(dados.nome || "").trim()) return "Nome do produto é obrigatório.";
  if (!String(dados.categoria || "").trim()) return "Categoria é obrigatória.";
  if (!(Number(dados.preco) > 0)) return "Preço de venda deve ser maior que zero.";
  return null;
}

router.get("/produtos", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM produtos ORDER BY nome ASC");
    res.json(rows.map(formatarProduto));
  } catch (erro) {
    console.error("Erro ao listar produtos (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

router.post("/produtos", async (req, res) => {
  try {
    const dados = req.body || {};
    const erroValidacao = validarDadosProduto(dados);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const id = dados.id || `p-${crypto.randomBytes(5).toString("hex")}`;
    const imagens = normalizarImagens(dados);

    const { rows } = await db.query(
      `INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, imagem, imagens, estoque, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        String(dados.nome).trim(),
        dados.categoria,
        Number(dados.preco),
        dados.precoDe ? Number(dados.precoDe) : null,
        dados.parcelas || null,
        JSON.stringify(dados.cores || []),
        JSON.stringify(dados.tamanhos || []),
        dados.selo || null,
        imagens[0] || null,
        JSON.stringify(imagens),
        Number.isFinite(Number(dados.estoque)) ? Number(dados.estoque) : 100,
        dados.ativo !== false,
      ],
    );

    res.status(201).json(formatarProduto(rows[0]));
  } catch (erro) {
    console.error("Erro ao criar produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao criar produto." });
  }
});

router.put("/produtos/:id", async (req, res) => {
  try {
    const existente = await db.query("SELECT * FROM produtos WHERE id = $1", [req.params.id]);
    if (!existente.rows[0]) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const dados = req.body || {};
    const erroValidacao = validarDadosProduto(dados);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const estoque = Number.isFinite(Number(dados.estoque))
      ? Number(dados.estoque)
      : existente.rows[0].estoque;
    const imagens = normalizarImagens(dados);

    const { rows } = await db.query(
      `UPDATE produtos SET
        nome = $1,
        categoria = $2,
        preco = $3,
        preco_de = $4,
        parcelas = $5,
        cores = $6,
        tamanhos = $7,
        selo = $8,
        imagem = $9,
        imagens = $10,
        estoque = $11,
        ativo = $12
      WHERE id = $13
      RETURNING *`,
      [
        String(dados.nome).trim(),
        dados.categoria,
        Number(dados.preco),
        dados.precoDe ? Number(dados.precoDe) : null,
        dados.parcelas || null,
        JSON.stringify(dados.cores || []),
        JSON.stringify(dados.tamanhos || []),
        dados.selo || null,
        imagens[0] || null,
        JSON.stringify(imagens),
        estoque,
        dados.ativo !== false,
        req.params.id,
      ],
    );

    res.json(formatarProduto(rows[0]));
  } catch (erro) {
    console.error("Erro ao atualizar produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao atualizar produto." });
  }
});

router.delete("/produtos/:id", async (req, res) => {
  try {
    const resultado = await db.query("DELETE FROM produtos WHERE id = $1", [req.params.id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json({ sucesso: true });
  } catch (erro) {
    // 23503 = violação de chave estrangeira: produto tem pedidos ou
    // avaliações vinculadas e não pode ser apagado sem perder esse histórico.
    if (erro.code === "23503") {
      return res.status(409).json({
        erro: "Este produto não pode ser excluído porque já possui pedidos ou avaliações vinculados. Desative-o em vez de excluir.",
      });
    }

    console.error("Erro ao excluir produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao excluir produto." });
  }
});

const STATUS_ENVIO_VALIDOS = ["preparando", "enviado", "entregue"];

router.get("/pedidos", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, cliente_nome, cliente_email, status, status_envio, total, frete, desconto,
              cupom_codigo, codigo_rastreio, metodo_pagamento, criado_em
       FROM pedidos ORDER BY criado_em DESC`,
    );

    res.json(rows);
  } catch (erro) {
    console.error("Erro ao listar pedidos (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao listar pedidos." });
  }
});

router.get("/pedidos/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, cliente_nome, cliente_email, cliente_telefone, cep, endereco, numero,
              complemento, bairro, cidade, estado, total, frete, desconto, status, status_envio,
              metodo_pagamento, cupom_codigo, codigo_rastreio, criado_em
       FROM pedidos WHERE id = $1`,
      [req.params.id],
    );
    const pedido = rows[0];

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    const itensResultado = await db.query(
      `SELECT pi.produto_id, pi.quantidade, pi.preco_unitario, pi.tamanho, pi.cor,
              p.nome AS produto_nome, p.imagem AS produto_imagem
       FROM pedido_itens pi
       LEFT JOIN produtos p ON p.id = pi.produto_id
       WHERE pi.pedido_id = $1`,
      [req.params.id],
    );

    res.json({ ...pedido, itens: itensResultado.rows });
  } catch (erro) {
    console.error("Erro ao buscar pedido (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao buscar pedido." });
  }
});

router.put("/pedidos/:id", async (req, res) => {
  try {
    const { codigoRastreio, statusEnvio } = req.body || {};

    if (statusEnvio && !STATUS_ENVIO_VALIDOS.includes(statusEnvio)) {
      return res.status(400).json({ erro: "Status de envio inválido." });
    }

    const existente = await db.query("SELECT id, status_envio, codigo_rastreio FROM pedidos WHERE id = $1", [
      req.params.id,
    ]);
    if (!existente.rows[0]) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    const novoCodigoRastreio =
      codigoRastreio !== undefined ? String(codigoRastreio).trim() || null : existente.rows[0].codigo_rastreio;
    const novoStatusEnvio = statusEnvio || existente.rows[0].status_envio;

    const { rows } = await db.query(
      `UPDATE pedidos SET codigo_rastreio = $1, status_envio = $2 WHERE id = $3 RETURNING *`,
      [novoCodigoRastreio, novoStatusEnvio, req.params.id],
    );

    res.json(rows[0]);
  } catch (erro) {
    console.error("Erro ao atualizar pedido (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao atualizar pedido." });
  }
});

module.exports = router;
