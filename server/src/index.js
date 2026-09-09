require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { inicializarBanco } = require("./database/db");

const produtosRouter = require("./routes/produtos");
const freteRouter = require("./routes/frete");
const checkoutRouter = require("./routes/checkout");
const pedidosRouter = require("./routes/pedidos");
const webhooksRouter = require("./routes/webhooks");
const cuponsRouter = require("./routes/cupons");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");

inicializarBanco();

const app = express();
const PORT = process.env.PORT || 3000;

const ORIGENS_PERMITIDAS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "https://estancia-western.vercel.app",
];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin(origem, callback) {
      if (!origem || ORIGENS_PERMITIDAS.includes(origem)) {
        return callback(null, true);
      }
      callback(new Error("Origem não permitida pela política de CORS."));
    },
  }),
);
app.use(express.json());
app.use(express.static(require("path").join(__dirname, "..", "..")));

const limitadorCheckout = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de checkout. Aguarde um minuto e tente novamente." },
});

const limitadorFrete = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas requisições de frete. Aguarde um minuto e tente novamente." },
});

app.use("/api/produtos", produtosRouter);
app.use("/api/frete", limitadorFrete, freteRouter);
app.use("/api/checkout", limitadorCheckout, checkoutRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/cupons", cuponsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

app.use((erro, req, res, next) => {
  if (erro && erro.message === "Origem não permitida pela política de CORS.") {
    console.warn("Bloqueado pelo CORS:", req.headers.origin);
    return res.status(403).json({ erro: erro.message });
  }

  console.error("Erro não tratado:", erro);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor Estância Western rodando em http://localhost:${PORT}`);
});
