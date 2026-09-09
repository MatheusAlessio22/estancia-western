const express = require("express");
const { db } = require("../database/db");

const router = express.Router();

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
  };
}

router.get("/", (req, res) => {
  try {
    const { categoria, busca } = req.query;

    let sql = "SELECT * FROM produtos WHERE ativo = 1";
    const params = [];

    if (categoria) {
      sql += " AND categoria = ?";
      params.push(categoria);
    }

    if (busca) {
      sql += " AND nome LIKE ?";
      params.push(`%${busca}%`);
    }

    sql += " ORDER BY nome ASC";

    const linhas = db.prepare(sql).all(...params);
    res.json(linhas.map(formatarProduto));
  } catch (erro) {
    console.error("Erro ao listar produtos:", erro);
    res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

router.get("/:id", (req, res) => {
  try {
    const linha = db.prepare("SELECT * FROM produtos WHERE id = ? AND ativo = 1").get(req.params.id);
    if (!linha) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }
    res.json(formatarProduto(linha));
  } catch (erro) {
    console.error("Erro ao buscar produto:", erro);
    res.status(500).json({ erro: "Erro ao buscar produto." });
  }
});

module.exports = router;
