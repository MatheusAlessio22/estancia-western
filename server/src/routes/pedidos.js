const express = require("express");
const { db } = require("../database/db");

const router = express.Router();

router.get("/:id", (req, res) => {
  try {
    const pedido = db
      .prepare(
        "SELECT id, cliente_email, status, total, frete, criado_em FROM pedidos WHERE id = ?",
      )
      .get(req.params.id);

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    res.json(pedido);
  } catch (erro) {
    console.error("Erro ao buscar pedido:", erro);
    res.status(500).json({ erro: "Erro ao buscar pedido." });
  }
});

router.get("/:id/status", (req, res) => {
  try {
    const pedido = db
      .prepare("SELECT id, status, total, criado_em FROM pedidos WHERE id = ?")
      .get(req.params.id);

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    res.json(pedido);
  } catch (erro) {
    console.error("Erro ao consultar status do pedido:", erro);
    res.status(500).json({ erro: "Erro ao consultar status do pedido." });
  }
});

if (process.env.NODE_ENV !== "production") {
  router.post("/:id/simular-pagamento", (req, res) => {
    try {
      const resultado = db
        .prepare("UPDATE pedidos SET status = 'pago' WHERE id = ?")
        .run(req.params.id);

      if (resultado.changes === 0) {
        return res.status(404).json({ erro: "Pedido não encontrado." });
      }

      res.json({ ok: true });
    } catch (erro) {
      console.error("Erro ao simular pagamento:", erro);
      res.status(500).json({ erro: "Erro ao simular pagamento." });
    }
  });
}

module.exports = router;
