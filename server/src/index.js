require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const { inicializarBanco } = require("./database/db");

const produtosRouter = require("./routes/produtos");
const freteRouter = require("./routes/frete");
const checkoutRouter = require("./routes/checkout");
const pedidosRouter = require("./routes/pedidos");
const webhooksRouter = require("./routes/webhooks");

inicializarBanco();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(require("path").join(__dirname, "..", "..")));

app.use("/api/produtos", produtosRouter);
app.use("/api/frete", freteRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/webhooks", webhooksRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

app.use((erro, req, res, next) => {
  console.error("Erro não tratado:", erro);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor Estância Western rodando em http://localhost:${PORT}`);
});
