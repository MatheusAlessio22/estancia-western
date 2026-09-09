const {
  shellEmail,
  tabelaItensHtml,
  enderecoHtml,
  formatarPreco,
  escaparHtml,
  primeiroNome,
  WHATSAPP_LINK,
} = require("./emailBase");

function assuntoPagamentoAprovado(pedidoId) {
  return `Pagamento Aprovado! Seu pedido #${pedidoId} já está sendo preparado — Estância Western`;
}

const ICONE_VERIFICADO = `
  <div style="width:48px;height:48px;border-radius:50%;background-color:#2E7D32;margin:0 auto 12px;line-height:48px;text-align:center;">
    <span style="font-size:26px;color:#ffffff;">&#10003;</span>
  </div>`;

function templatePagamentoAprovado({ pedido, itens }) {
  const nome = primeiroNome(pedido.cliente_nome);

  const conteudoHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EAF5EB;border:1px solid #2E7D32;border-radius:8px;padding:18px;margin:0 0 20px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:17px;color:#1C1C1C;">
            Tudo certo, <strong>${escaparHtml(nome)}</strong>! Seu pagamento foi confirmado com sucesso.
          </p>
          <p style="margin:0;font-size:13px;color:#2E7D32;font-weight:bold;">
            Status: Em Separação / Preparação para Envio
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;color:#4a4a4a;">
      Seu pedido #${pedido.id} entrou na fila de separação e será despachado em até
      <strong>1 a 2 dias úteis</strong>. Assim que o código de rastreio dos Correios for gerado,
      você recebe um novo e-mail com todos os detalhes do envio.
    </p>

    <h3 style="margin:0 0 4px;font-size:15px;color:#5F3A2A;border-bottom:2px solid #D9C3A8;padding-bottom:8px;">
      Resumo do pedido #${pedido.id}
    </h3>
    ${tabelaItensHtml(itens, { resumido: true })}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 4px;">
      <tr>
        <td style="font-size:14px;color:#1C1C1C;font-weight:bold;text-align:right;">
          Total pago: ${formatarPreco(pedido.total)}
        </td>
      </tr>
    </table>

    ${enderecoHtml(pedido)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0 0 12px;font-size:13px;color:#4a4a4a;">Alguma dúvida sobre a entrega?</p>
          <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background-color:#5F3A2A;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:24px;">
            Falar com o time no WhatsApp
          </a>
        </td>
      </tr>
    </table>
  `;

  return shellEmail({
    corTopo: "#2E7D32",
    tituloTopo: "Pagamento Confirmado",
    subtituloTopo: "Seu pedido já está sendo preparado",
    iconeTopo: ICONE_VERIFICADO,
    conteudoHtml,
  });
}

module.exports = { templatePagamentoAprovado, assuntoPagamentoAprovado };
