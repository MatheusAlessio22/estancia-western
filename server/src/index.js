const path = require("path");
const express = require("express");
const app = require("./app");

// Servir os arquivos estáticos do site só faz sentido rodando localmente
// (node server/src/index.js); na Vercel, os estáticos já são servidos
// diretamente pela CDN e este arquivo nem é usado (veja api/index.js).
app.use(express.static(path.join(__dirname, "..", "..")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Estância Western rodando em http://localhost:${PORT}`);
});
