const express = require("express");
const { consultarViaCep, calcularOpcoesFrete } = require("../services/frete");

const router = express.Router();

router.post("/calcular", async (req, res) => {
  try {
    const { cep, total } = req.body;

    if (!cep) {
      return res.status(400).json({ erro: "CEP é obrigatório." });
    }

    const endereco = await consultarViaCep(cep);
    const opcoes = calcularOpcoesFrete(total);

    res.json({ endereco, opcoes });
  } catch (erro) {
    res.status(400).json({ erro: erro.message || "Erro ao calcular frete." });
  }
});

module.exports = router;
