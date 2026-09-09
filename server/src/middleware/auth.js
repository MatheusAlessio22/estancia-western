const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "estancia_segredo_token_2026";

function verificarAdmin(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Acesso negado. Faça login no painel." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ erro: "Acesso negado. Faça login no painel." });
  }
}

module.exports = { verificarAdmin, JWT_SECRET };
