const express = require("express");
const { buscarArvoreCategorias } = require("../database/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const arvore = await buscarArvoreCategorias();
    res.json(arvore);
  } catch (erro) {
    console.error("Erro ao listar categorias:", erro);
    res.status(500).json({ erro: "Erro ao listar categorias." });
  }
});

module.exports = router;
