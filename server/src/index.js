const path = require("path");
const express = require("express");
const app = require("./app");

// Espelha os rewrites de URL amigável configurados em vercel.json
// (/produto/:id -> pages/produto.html, /categoria/:cat -> pages/categoria.html)
// para que rodar o server Express sozinho se comporte igual à produção.
app.get("/produto/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "pages", "produto.html"));
});
app.get("/categoria/:cat", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "pages", "categoria.html"));
});

// Servir os arquivos estáticos do site só faz sentido rodando localmente
// (node server/src/index.js); na Vercel, os estáticos já são servidos
// diretamente pela CDN e este arquivo nem é usado (veja api/index.js).
app.use(express.static(path.join(__dirname, "..", "..")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Estância Western rodando em http://localhost:${PORT}`);
});
