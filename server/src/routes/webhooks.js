const express = require("express");
const { db } = require("../database/db");
const { consultarPagamento } = require("../services/mercadopago");

const router = express.Router();

router.post("/mercadopago", async (req, res) => {
  try {
    const { type, action, data } = req.body;
    const evento = type || action;

    if (evento !== "payment" && !String(action || "").startsWith("payment")) {
      return res.status(200).json({ recebido: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(200).json({ recebido: true });
    }

    const pagamento = await consultarPagamento(paymentId);
    if (!pagamento) {
      return res.status(200).json({ recebido: true });
    }

    const pedidoId = Number(pagamento.external_reference);
    if (!pedidoId) {
      return res.status(200).json({ recebido: true });
    }

    let novoStatus = null;
    if (pagamento.status === "approved") {
      novoStatus = "pago";
    } else if (pagamento.status === "cancelled" || pagamento.status === "rejected") {
      novoStatus = "cancelado";
    }

    if (novoStatus) {
      db.prepare("UPDATE pedidos SET status = ? WHERE id = ?").run(novoStatus, pedidoId);
    }

    res.status(200).json({ recebido: true });
  } catch (erro) {
    console.error("Erro ao processar webhook do Mercado Pago:", erro);
    res.status(200).json({ recebido: true });
  }
});

module.exports = router;
