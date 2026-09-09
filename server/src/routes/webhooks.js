const express = require("express");
const { db } = require("../database/db");
const { consultarPagamento } = require("../services/mercadopago");
const { enviarEmailPagamentoAprovado } = require("../services/email");

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
      const { rows } = await db.query(
        "UPDATE pedidos SET status = $1 WHERE id = $2 AND status != $1 RETURNING *",
        [novoStatus, pedidoId],
      );

      // `rows` só vem preenchido quando o status realmente mudou agora
      // (evita reenviar o e-mail de aprovação em notificações duplicadas
      // que o Mercado Pago pode disparar para o mesmo pagamento).
      const pedidoAtualizado = rows[0];
      if (pedidoAtualizado && novoStatus === "pago") {
        const { rows: itensRows } = await db.query(
          `SELECT pi.quantidade, pi.preco_unitario AS "precoUnitario", pi.tamanho, pi.cor,
                  p.nome, p.imagem
           FROM pedido_itens pi
           JOIN produtos p ON p.id = pi.produto_id
           WHERE pi.pedido_id = $1`,
          [pedidoId],
        );

        enviarEmailPagamentoAprovado({
          pedido: pedidoAtualizado,
          itens: itensRows,
        }).catch((erro) => console.error("Falha ao enviar e-mail de pagamento aprovado:", erro.message));
      }
    }

    res.status(200).json({ recebido: true });
  } catch (erro) {
    console.error("Erro ao processar webhook do Mercado Pago:", erro);
    res.status(200).json({ recebido: true });
  }
});

module.exports = router;
