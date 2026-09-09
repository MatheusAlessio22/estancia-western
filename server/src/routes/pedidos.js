const express = require("express");
const { db } = require("../database/db");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, cliente_email, status, total, frete, desconto, cupom_codigo,
              codigo_rastreio, criado_em
       FROM pedidos WHERE id = $1`,
      [req.params.id],
    );
    const pedido = rows[0];

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    const itensResultado = await db.query(
      `SELECT produto_id, quantidade, preco_unitario, tamanho, cor
       FROM pedido_itens WHERE pedido_id = $1`,
      [req.params.id],
    );

    res.json({ ...pedido, itens: itensResultado.rows });
  } catch (erro) {
    console.error("Erro ao buscar pedido:", erro);
    res.status(500).json({ erro: "Erro ao buscar pedido." });
  }
});

router.get("/:id/status", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, status, total, criado_em FROM pedidos WHERE id = $1",
      [req.params.id],
    );

    if (!rows[0]) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    res.json(rows[0]);
  } catch (erro) {
    console.error("Erro ao consultar status do pedido:", erro);
    res.status(500).json({ erro: "Erro ao consultar status do pedido." });
  }
});

if (process.env.NODE_ENV !== "production") {
  router.post("/:id/simular-pagamento", async (req, res) => {
    try {
      const resultado = await db.query(
        "UPDATE pedidos SET status = 'pago' WHERE id = $1",
        [req.params.id],
      );

      if (resultado.rowCount === 0) {
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
