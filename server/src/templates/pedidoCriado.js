const {
  shellEmail,
  tabelaItensHtml,
  resumoFinanceiroHtml,
  enderecoHtml,
  formatarPreco,
  escaparHtml,
  primeiroNome,
} = require("./emailBase");

function assuntoPedidoCriado(pedidoId) {
  return `Pedido #${pedidoId} recebido! Finalize seu pagamento via PIX — Estância Western`;
}

function templatePedidoCriado({ pedido, itens, dadosPix }) {
  const nome = primeiroNome(pedido.cliente_nome);

  const blocoPix = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#5F3A2A;border-radius:8px;padding:20px;margin:20px 0;">
      <tr>
        <td align="center">
          <div style="font-size:13px;color:#F4E4D7;text-transform:uppercase;letter-spacing:1px;">Valor a pagar via PIX</div>
          <div style="font-size:32px;color:#ffffff;font-weight:bold;margin:6px 0 16px;">${formatarPreco(pedido.total)}</div>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:6px;padding:12px;">
            <tr>
              <td style="font-size:11px;color:#8a7a6d;padding-bottom:6px;">PIX Copia e Cola</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#1C1C1C;word-break:break-all;font-family:'Courier New',monospace;background-color:#F4E4D7;border-radius:4px;padding:10px;">
                ${escaparHtml(dadosPix.copiaECola)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:12px;text-align:center;">
          <span style="display:inline-block;background-color:#D9C3A8;color:#5F3A2A;font-size:12px;font-weight:bold;padding:6px 14px;border-radius:14px;">
            ⏱ Código válido por 30 minutos
          </span>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="font-size:13px;color:#1C1C1C;line-height:1.8;">
          <strong style="color:#5F3A2A;">Como pagar:</strong><br>
          1&#41; Copie o código PIX acima (toque e segure para selecionar tudo)<br>
          2&#41; Abra o aplicativo do seu banco<br>
          3&#41; Escolha a opção <strong>PIX Copia e Cola</strong><br>
          4&#41; Cole o código e confirme o pagamento
        </td>
      </tr>
    </table>`;

  const conteudoHtml = `
    <p style="margin:0 0 4px;font-size:17px;color:#1C1C1C;">Olá, <strong>${escaparHtml(nome)}</strong>!</p>
    <p style="margin:0 0 20px;color:#4a4a4a;">
      Recebemos seu pedido e ele já está reservado no nosso sistema. Falta só concluir o pagamento via PIX para
      seguirmos com a separação e o envio.
    </p>

    ${blocoPix}

    <h3 style="margin:0 0 4px;font-size:15px;color:#5F3A2A;border-bottom:2px solid #D9C3A8;padding-bottom:8px;">
      Itens do pedido #${pedido.id}
    </h3>
    ${tabelaItensHtml(itens)}

    ${resumoFinanceiroHtml({
      subtotal: itens.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0),
      frete: Number(pedido.frete) || 0,
      desconto: Number(pedido.desconto) || 0,
      cupomCodigo: pedido.cupom_codigo,
      total: pedido.total,
    })}

    ${enderecoHtml(pedido)}
  `;

  return shellEmail({
    corTopo: "#5F3A2A",
    tituloTopo: "Pedido Recebido",
    subtituloTopo: "Aguardando pagamento via PIX",
    conteudoHtml,
  });
}

module.exports = { templatePedidoCriado, assuntoPedidoCriado };
