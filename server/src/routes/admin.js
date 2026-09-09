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
    cores: JSON.parse(linha.cores || "[]"),
    tamanhos: JSON.parse(linha.tamanhos || "[]"),
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

router.get("/produtos", (req, res) => {
  try {
    const linhas = db.prepare("SELECT * FROM produtos ORDER BY nome ASC").all();
    res.json(linhas.map(formatarProduto));
  } catch (erro) {
    console.error("Erro ao listar produtos (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

router.post("/produtos", (req, res) => {
  try {
    const dados = req.body || {};
    const erroValidacao = validarDadosProduto(dados);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const id = dados.id || `p-${crypto.randomBytes(5).toString("hex")}`;

    db.prepare(`
      INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, imagem, estoque, ativo)
      VALUES (@id, @nome, @categoria, @preco, @precoDe, @parcelas, @cores, @tamanhos, @selo, @imagem, @estoque, @ativo)
    `).run({
      id,
      nome: String(dados.nome).trim(),
      categoria: dados.categoria,
      preco: Number(dados.preco),
      precoDe: dados.precoDe ? Number(dados.precoDe) : null,
      parcelas: dados.parcelas || null,
      cores: JSON.stringify(dados.cores || []),
      tamanhos: JSON.stringify(dados.tamanhos || []),
      selo: dados.selo || null,
      imagem: dados.imagem || null,
      estoque: Number.isFinite(Number(dados.estoque)) ? Number(dados.estoque) : 100,
      ativo: dados.ativo === false ? 0 : 1,
    });

    const linha = db.prepare("SELECT * FROM produtos WHERE id = ?").get(id);
    res.status(201).json(formatarProduto(linha));
  } catch (erro) {
    console.error("Erro ao criar produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao criar produto." });
  }
});

router.put("/produtos/:id", (req, res) => {
  try {
    const existente = db.prepare("SELECT * FROM produtos WHERE id = ?").get(req.params.id);
    if (!existente) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const dados = req.body || {};
    const erroValidacao = validarDadosProduto(dados);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    db.prepare(`
      UPDATE produtos SET
        nome = @nome,
        categoria = @categoria,
        preco = @preco,
        preco_de = @precoDe,
        parcelas = @parcelas,
        cores = @cores,
        tamanhos = @tamanhos,
        selo = @selo,
        imagem = @imagem,
        estoque = @estoque,
        ativo = @ativo
      WHERE id = @id
    `).run({
      id: req.params.id,
      nome: String(dados.nome).trim(),
      categoria: dados.categoria,
      preco: Number(dados.preco),
      precoDe: dados.precoDe ? Number(dados.precoDe) : null,
      parcelas: dados.parcelas || null,
      cores: JSON.stringify(dados.cores || []),
      tamanhos: JSON.stringify(dados.tamanhos || []),
      selo: dados.selo || null,
      imagem: dados.imagem || null,
      estoque: Number.isFinite(Number(dados.estoque)) ? Number(dados.estoque) : existente.estoque,
      ativo: dados.ativo === false ? 0 : 1,
    });

    const linha = db.prepare("SELECT * FROM produtos WHERE id = ?").get(req.params.id);
    res.json(formatarProduto(linha));
  } catch (erro) {
    console.error("Erro ao atualizar produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao atualizar produto." });
  }
});

router.delete("/produtos/:id", (req, res) => {
  try {
    const existente = db.prepare("SELECT * FROM produtos WHERE id = ?").get(req.params.id);
    if (!existente) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    db.prepare("DELETE FROM produtos WHERE id = ?").run(req.params.id);
    res.json({ sucesso: true });
  } catch (erro) {
    console.error("Erro ao excluir produto (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao excluir produto." });
  }
});

router.get("/pedidos", (req, res) => {
  try {
    const pedidos = db
      .prepare(
        `SELECT id, cliente_nome, cliente_email, status, total, frete, desconto,
                cupom_codigo, codigo_rastreio, metodo_pagamento, criado_em
         FROM pedidos ORDER BY criado_em DESC`,
      )
      .all();

    res.json(pedidos);
  } catch (erro) {
    console.error("Erro ao listar pedidos (admin):", erro.message);
    res.status(500).json({ erro: "Erro ao listar pedidos." });
  }
});

module.exports = router;
