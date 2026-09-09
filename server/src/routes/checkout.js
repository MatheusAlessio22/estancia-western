const express = require("express");
const { db, validarCupom } = require("../database/db");
const { calcularOpcoesFrete } = require("../services/frete");
const { criarPagamentoPix } = require("../services/mercadopago");
const { enviarEmailPedidoCriado } = require("../services/email");

const router = express.Router();

function validarDadosCliente(cliente) {
  const camposObrigatorios = [
    "nome",
    "email",
    "telefone",
    "cep",
    "endereco",
    "numero",
    "cidade",
    "estado",
  ];

  for (const campo of camposObrigatorios) {
    if (!cliente || !String(cliente[campo] || "").trim()) {
      return `Campo obrigatório ausente: ${campo}.`;
    }
  }

  return null;
}

router.post("/pix", async (req, res) => {
  try {
    const { cliente, itens, tipoFrete, cupom } = req.body;

    const erroCliente = validarDadosCliente(cliente);
    if (erroCliente) {
      return res.status(400).json({ erro: erroCliente });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: "O carrinho está vazio." });
    }

    let subtotal = 0;
    const itensValidados = [];

    for (const item of itens) {
      const { rows } = await db.query(
        "SELECT * FROM produtos WHERE id = $1 AND ativo = true",
        [item.produtoId],
      );
      const produto = rows[0];
      if (!produto) {
        return res.status(400).json({ erro: `Produto não encontrado: ${item.produtoId}` });
      }

      const quantidade = Number(item.quantidade) || 1;
      subtotal += produto.preco * quantidade;

      itensValidados.push({
        produtoId: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        quantidade,
        precoUnitario: produto.preco,
        tamanho: item.tamanho || null,
        cor: item.cor || null,
      });
    }

    const opcoesFrete = calcularOpcoesFrete(subtotal);
    const opcaoFrete =
      opcoesFrete.find((opcao) => opcao.tipo === tipoFrete) || opcoesFrete[0];
    const frete = opcaoFrete.valor;

    let desconto = 0;
    let cupomCodigo = null;

    if (cupom) {
      const resultadoCupom = await validarCupom(cupom, subtotal);
      if (!resultadoCupom.valido) {
        return res.status(resultadoCupom.status).json({ erro: resultadoCupom.mensagem });
      }
      desconto = resultadoCupom.desconto;
      cupomCodigo = resultadoCupom.codigo;
    }

    const total = subtotal + frete - desconto;

    const client = await db.pool.connect();
    let pedidoId;

    try {
      await client.query("BEGIN");

      const inserirPedido = await client.query(
        `INSERT INTO pedidos (
          cliente_nome, cliente_email, cliente_telefone, cep, endereco, numero,
          complemento, bairro, cidade, estado, total, frete, status, metodo_pagamento,
          cupom_codigo, desconto
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pendente', 'pix', $13, $14)
        RETURNING id`,
        [
          cliente.nome,
          cliente.email,
          cliente.telefone,
          cliente.cep,
          cliente.endereco,
          cliente.numero,
          cliente.complemento || null,
          cliente.bairro || null,
          cliente.cidade,
          cliente.estado,
          total,
          frete,
          cupomCodigo,
          desconto,
        ],
      );

      pedidoId = inserirPedido.rows[0].id;

      for (const item of itensValidados) {
        await client.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, tamanho, cor)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [pedidoId, item.produtoId, item.quantidade, item.precoUnitario, item.tamanho, item.cor],
        );
      }

      await client.query("COMMIT");
    } catch (erroTransacao) {
      await client.query("ROLLBACK");
      throw erroTransacao;
    } finally {
      client.release();
    }

    const pagamento = await criarPagamentoPix({
      pedidoId,
      valor: total,
      clienteNome: cliente.nome,
      clienteEmail: cliente.email,
      clienteCpf: cliente.cpf,
    });

    await db.query(
      `UPDATE pedidos
       SET mp_payment_id = $1, pix_copia_cola = $2, pix_qr_code_base64 = $3
       WHERE id = $4`,
      [pagamento.mpPaymentId, pagamento.copiaECola, pagamento.qrCodeBase64, pedidoId],
    );

    // Disparo assíncrono e não-bloqueante: o cliente não deve esperar o
    // envio do e-mail para receber a resposta do checkout, e uma falha
    // aqui nunca deve derrubar o fluxo de pagamento.
    const pedidoParaEmail = {
      id: pedidoId,
      cliente_nome: cliente.nome,
      cliente_email: cliente.email,
      cep: cliente.cep,
      endereco: cliente.endereco,
      numero: cliente.numero,
      complemento: cliente.complemento || null,
      bairro: cliente.bairro || null,
      cidade: cliente.cidade,
      estado: cliente.estado,
      total,
      frete,
      desconto,
      cupom_codigo: cupomCodigo,
    };

    enviarEmailPedidoCriado({
      pedido: pedidoParaEmail,
      itens: itensValidados,
      dadosPix: pagamento,
    }).catch((erro) => console.error("Falha ao enviar e-mail de pedido criado:", erro.message));

    res.json({
      sucesso: true,
      pedidoId,
      qrCodeBase64: pagamento.qrCodeBase64,
      qrCodeMimeType: pagamento.qrCodeMimeType,
      copiaECola: pagamento.copiaECola,
      total,
      desconto,
      cupom: cupomCodigo,
      simulado: pagamento.simulado,
      expiraEm: 1800,
    });
  } catch (erro) {
    console.error("Erro ao processar checkout Pix:", erro);
    res.status(500).json({ erro: "Erro ao processar o pedido. Tente novamente." });
  }
});

module.exports = router;
