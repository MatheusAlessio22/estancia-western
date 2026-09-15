const express = require("express");
const rateLimit = require("express-rate-limit");
const { listarAvaliacoes, criarAvaliacao } = require("../database/db");

const router = express.Router();

const limitadorEnvio = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas avaliações enviadas. Aguarde um minuto e tente novamente." },
});

router.get("/:produtoId", async (req, res) => {
  try {
    const resultado = await listarAvaliacoes(req.params.produtoId);
    res.json(resultado);
  } catch (erro) {
    console.error("Erro ao listar avaliações:", erro);
    res.status(500).json({ erro: "Erro ao carregar avaliações. Tente novamente." });
  }
});

router.post("/:produtoId", limitadorEnvio, async (req, res) => {
  try {
    const { nomeCliente, notaEstrelas, comentario } = req.body;
    const produtoId = req.params.produtoId;

    const nomeNormalizado = String(nomeCliente || "").trim();
    if (!nomeNormalizado) {
      return res.status(400).json({ erro: "Informe seu nome." });
    }

    const nota = Number(notaEstrelas);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ erro: "A nota deve ser um número inteiro de 1 a 5 estrelas." });
    }

    const comentarioNormalizado = String(comentario || "").trim().slice(0, 1000);

    const avaliacao = await criarAvaliacao({
      produtoId,
      nomeCliente: nomeNormalizado.slice(0, 100),
      notaEstrelas: nota,
      comentario: comentarioNormalizado,
    });

    if (!avaliacao) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.status(201).json({ sucesso: true, avaliacao });
  } catch (erro) {
    console.error("Erro ao criar avaliação:", erro);
    res.status(500).json({ erro: "Erro ao enviar sua avaliação. Tente novamente." });
  }
});

module.exports = router;
