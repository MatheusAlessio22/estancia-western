const express = require("express");
const { obterArtigo, listarArtigos } = require("../services/blog");

const router = express.Router();

router.get("/", (req, res) => {
  const artigos = listarArtigos().map(({ htmlConteudo, ...resumo }) => resumo);
  res.json(artigos);
});

router.get("/:slug", (req, res) => {
  const artigo = obterArtigo(req.params.slug);
  if (!artigo) {
    return res.status(404).json({ erro: "Artigo não encontrado." });
  }
  res.json(artigo);
});

module.exports = router;
