const express = require("express");
const { db } = require("../database/db");
const { calcularOpcoesFrete } = require("../services/frete");
const { criarPagamentoPix } = require("../services/mercadopago");

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
    const { cliente, itens, tipoFrete } = req.body;

    const erroCliente = validarDadosCliente(cliente);
    if (erroCliente) {
      return res.status(400).json({ erro: erroCliente });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: "O carrinho está vazio." });
    }

    const produtoStmt = db.prepare("SELECT * FROM produtos WHERE id = ? AND ativo = 1");
    let subtotal = 0;
    const itensValidados = [];

    for (const item of itens) {
      const produto = produtoStmt.get(item.produtoId);
      if (!produto) {
        return res.status(400).json({ erro: `Produto não encontrado: ${item.produtoId}` });
      }

      const quantidade = Number(item.quantidade) || 1;
      subtotal += produto.preco * quantidade;

      itensValidados.push({
        produtoId: produto.id,
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
    const total = subtotal + frete;

    const inserirPedido = db.prepare(`
      INSERT INTO pedidos (
        cliente_nome, cliente_email, cliente_telefone, cep, endereco, numero,
        complemento, bairro, cidade, estado, total, frete, status, metodo_pagamento
      ) VALUES (
        @nome, @email, @telefone, @cep, @endereco, @numero,
        @complemento, @bairro, @cidade, @estado, @total, @frete, 'pendente', 'pix'
      )
    `);

    const resultado = inserirPedido.run({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cep: cliente.cep,
      endereco: cliente.endereco,
      numero: cliente.numero,
      complemento: cliente.complemento || null,
      bairro: cliente.bairro || null,
      cidade: cliente.cidade,
      estado: cliente.estado,
      total,
      frete,
    });

    const pedidoId = resultado.lastInsertRowid;

    const inserirItem = db.prepare(`
      INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, tamanho, cor)
      VALUES (@pedidoId, @produtoId, @quantidade, @precoUnitario, @tamanho, @cor)
    `);

    const transacaoItens = db.transaction((lista) => {
      for (const item of lista) {
        inserirItem.run({ pedidoId, ...item });
      }
    });
    transacaoItens(itensValidados);

    const pagamento = await criarPagamentoPix({
      pedidoId,
      valor: total,
      clienteNome: cliente.nome,
      clienteEmail: cliente.email,
    });

    db.prepare(`
      UPDATE pedidos
      SET mp_payment_id = ?, pix_copia_cola = ?, pix_qr_code_base64 = ?
      WHERE id = ?
    `).run(pagamento.mpPaymentId, pagamento.copiaECola, pagamento.qrCodeBase64, pedidoId);

    res.json({
      pedidoId,
      qrCodeBase64: pagamento.qrCodeBase64,
      qrCodeMimeType: pagamento.qrCodeMimeType,
      copiaECola: pagamento.copiaECola,
      total,
      simulado: pagamento.simulado,
    });
  } catch (erro) {
    console.error("Erro ao processar checkout Pix:", erro);
    res.status(500).json({ erro: "Erro ao processar o pedido. Tente novamente." });
  }
});

module.exports = router;
