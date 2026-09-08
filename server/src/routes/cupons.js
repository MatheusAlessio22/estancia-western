const express = require("express");
const { validarCupom } = require("../database/db");

const router = express.Router();

router.post("/validar", (req, res) => {
  try {
    const { codigo, subtotal } = req.body;

    const resultado = validarCupom(codigo, subtotal);

    if (!resultado.valido) {
      return res.status(resultado.status).json({ erro: resultado.mensagem });
    }

    res.json({
      valido: true,
      desconto: resultado.desconto,
      codigo: resultado.codigo,
      mensagem: resultado.mensagem,
    });
  } catch (erro) {
    console.error("Erro ao validar cupom:", erro);
    res.status(500).json({ erro: "Erro ao validar cupom. Tente novamente." });
  }
});

module.exports = router;
