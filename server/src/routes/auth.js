const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../database/db");
const { verificarAdmin, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  try {
    const { email, senha } = req.body || {};

    if (!String(email || "").trim() || !senha) {
      return res.status(400).json({ erro: "Informe e-mail e senha." });
    }

    const admin = db
      .prepare("SELECT * FROM administradores WHERE email = ?")
      .get(String(email).trim().toLowerCase());

    if (!admin || !bcrypt.compareSync(senha, admin.senha_hash)) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }

    const token = jwt.sign(
      { id: admin.id, nome: admin.nome, email: admin.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      admin: { id: admin.id, nome: admin.nome, email: admin.email },
    });
  } catch (erro) {
    console.error("Erro ao autenticar administrador:", erro.message);
    res.status(500).json({ erro: "Erro ao autenticar. Tente novamente." });
  }
});

router.get("/verificar", verificarAdmin, (req, res) => {
  res.json({ valido: true, admin: req.admin });
});

module.exports = router;
