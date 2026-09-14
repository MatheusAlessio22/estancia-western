const express = require("express");
const { cadastrarNewsletter } = require("../database/db");
const { enviarEmailNewsletterBoasVindas } = require("../services/email");

const router = express.Router();

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", async (req, res) => {
  try {
    const { email, telefone } = req.body;
    const emailNormalizado = String(email || "").trim().toLowerCase();

    if (!REGEX_EMAIL.test(emailNormalizado)) {
      return res.status(400).json({ erro: "Informe um e-mail válido." });
    }

    const { novoCadastro } = await cadastrarNewsletter(emailNormalizado, telefone);

    if (novoCadastro) {
      await enviarEmailNewsletterBoasVindas({ para: emailNormalizado });
    }

    res.json({ sucesso: true, mensagem: "Cadastro realizado! Fique de olho no seu e-mail. 🤠" });
  } catch (erro) {
    console.error("Erro ao cadastrar e-mail na newsletter:", erro);
    res.status(500).json({ erro: "Erro ao cadastrar seu e-mail. Tente novamente." });
  }
});

module.exports = router;
