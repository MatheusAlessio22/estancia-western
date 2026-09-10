const express = require("express");
const { db } = require("../database/db");

const router = express.Router();

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
  };
}

router.get("/", async (req, res) => {
  try {
    const { categoria, busca } = req.query;

    let sql = "SELECT * FROM produtos WHERE ativo = true";
    const params = [];

    if (categoria) {
      params.push(categoria);
      sql += ` AND categoria = $${params.length}`;
    }

    if (busca) {
      params.push(`%${busca}%`);
      sql += ` AND nome ILIKE $${params.length}`;
    }

    sql += " ORDER BY nome ASC";

    const { rows } = await db.query(sql, params);
    res.json(rows.map(formatarProduto));
  } catch (erro) {
    console.error("Erro ao listar produtos:", erro);
    res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM produtos WHERE id = $1 AND ativo = true",
      [req.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }
    res.json(formatarProduto(rows[0]));
  } catch (erro) {
    console.error("Erro ao buscar produto:", erro);
    res.status(500).json({ erro: "Erro ao buscar produto." });
  }
});

module.exports = router;
