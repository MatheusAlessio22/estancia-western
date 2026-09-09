const express = require("express");
const crypto = require("crypto");
const { db } = require("../database/db");
const { verificarAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(verificarAdmin);

function formatarProduto(linha) {
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
    imagem: linha.imagem,
    estoque: linha.estoque,
    ativo: !!linha.ativo,
  };
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

    const { rows } = await db.query(
      `INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, imagem, estoque, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        dados.imagem || null,
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
        estoque = $10,
        ativo = $11
      WHERE id = $12
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
        dados.imagem || null,
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
    console.error("Erro ao excluir produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao excluir produto." });
  }
});

router.get("/pedidos", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, cliente_nome, cliente_email, status, total, frete, desconto,
              cupom_codigo, codigo_rastreio, metodo_pagamento, criado_em
       FROM pedidos ORDER BY criado_em DESC`,
    );

    res.json(rows);
  } catch (erro) {
    console.error("Erro ao listar pedidos (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao listar pedidos." });
  }
});

module.exports = router;
