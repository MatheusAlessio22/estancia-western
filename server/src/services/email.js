const { Resend } = require("resend");
const { templatePedidoCriado, assuntoPedidoCriado } = require("../templates/pedidoCriado");
const { templatePagamentoAprovado, assuntoPagamentoAprovado } = require("../templates/pagamentoAprovado");

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Enquanto a loja não verificar um domínio próprio no Resend, usa o
// domínio de testes onboarding@resend.dev — ele só entrega para o
// e-mail cadastrado na conta Resend, nunca para clientes reais.
const EMAIL_REMETENTE = process.env.EMAIL_REMETENTE || "Estância Western <onboarding@resend.dev>";

const credencialValida = Boolean(RESEND_API_KEY);
const resend = credencialValida ? new Resend(RESEND_API_KEY) : null;

if (!credencialValida) {
  console.warn(
    "RESEND_API_KEY não configurada: e-mails transacionais serão apenas logados no console, não enviados.",
  );
}

/**
 * Envia um e-mail via Resend sem nunca lançar erro para quem chamou.
 * Falha de envio de e-mail é sempre não-crítica: checkout e webhook do
 * Mercado Pago já responderam ao cliente/gateway antes desta chamada e
 * não podem quebrar por causa de um provedor de e-mail fora do ar.
 */
async function enviarEmailSeguro({ para, assunto, html }) {
  if (!credencialValida) {
    console.log(`[email] (modo simulação, RESEND_API_KEY ausente) Para: ${para} | Assunto: ${assunto}`);
    return { enviado: false, motivo: "RESEND_API_KEY não configurada" };
  }

  try {
    const resultado = await resend.emails.send({
      from: EMAIL_REMETENTE,
      to: para,
      subject: assunto,
      html,
    });

    if (resultado.error) {
      console.error("Falha ao enviar e-mail via Resend:", resultado.error);
      return { enviado: false, motivo: resultado.error.message };
    }

    return { enviado: true, id: resultado.data?.id };
  } catch (erro) {
    console.error("Erro inesperado ao enviar e-mail via Resend:", erro.message);
    return { enviado: false, motivo: erro.message };
  }
}

/**
 * Dispara o e-mail de "Pedido Recebido — Aguardando Pagamento PIX".
 * `pedido` é a linha da tabela `pedidos`, `itens` é a lista de
 * `pedido_itens` (já com `nome`/`imagem` do produto agregados pela rota
 * chamadora) e `dadosPix` é o retorno de `criarPagamentoPix`.
 */
async function enviarEmailPedidoCriado({ pedido, itens, dadosPix }) {
  try {
    const html = templatePedidoCriado({ pedido, itens, dadosPix });
    return await enviarEmailSeguro({
      para: pedido.cliente_email,
      assunto: assuntoPedidoCriado(pedido.id),
      html,
    });
  } catch (erro) {
    console.error("Erro ao montar e-mail de pedido criado:", erro.message);
    return { enviado: false, motivo: erro.message };
  }
}

/**
 * Dispara o e-mail de "Pagamento Confirmado — Pedido em Separação".
 */
async function enviarEmailPagamentoAprovado({ pedido, itens }) {
  try {
    const html = templatePagamentoAprovado({ pedido, itens });
    return await enviarEmailSeguro({
      para: pedido.cliente_email,
      assunto: assuntoPagamentoAprovado(pedido.id),
      html,
    });
  } catch (erro) {
    console.error("Erro ao montar e-mail de pagamento aprovado:", erro.message);
    return { enviado: false, motivo: erro.message };
  }
}

module.exports = { enviarEmailPedidoCriado, enviarEmailPagamentoAprovado };
