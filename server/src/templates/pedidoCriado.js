const {
  CORES,
  FONTE_TITULO,
  shellEmail,
  tabelaItensHtml,
  resumoFinanceiroHtml,
  enderecoHtml,
  formatarPreco,
  escaparHtml,
  primeiroNome,
} = require("./emailBase");

function assuntoPedidoCriado(pedidoId) {
  return `Pedido #${pedidoId} recebido! Conclua seu pagamento via PIX — Estância Western`;
}

function passoNumeradoHtml(numero, texto) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;">
      <tr>
        <td width="26" valign="top">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="22" height="22" style="background-color:${CORES.marromCouro};border-radius:11px;">
            <tr>
              <td align="center" valign="middle" style="font-family:${FONTE_TITULO};font-size:12px;color:#ffffff;font-weight:700;">${numero}</td>
            </tr>
          </table>
        </td>
        <td style="padding-left:10px;font-size:13px;color:${CORES.carvao};line-height:1.5;" valign="middle">${texto}</td>
      </tr>
    </table>`;
}

function templatePedidoCriado({ pedido, itens, dadosPix }) {
  const nome = primeiroNome(pedido.cliente_nome);

  const blocoPix = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.begeSuave};border:1px solid ${CORES.bege};border-radius:10px;padding:22px;margin:0 0 22px;">
      <tr>
        <td align="center">
          <div style="font-family:${FONTE_TITULO};font-size:12px;color:${CORES.marromCafe};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Valor a pagar via PIX</div>
          <div style="font-family:${FONTE_TITULO};font-size:30px;color:${CORES.marromCouro};font-weight:700;margin:8px 0 14px;">${formatarPreco(pedido.total)}</div>
          <span style="display:inline-block;background-color:${CORES.marromCafe};color:#ffffff;font-family:${FONTE_TITULO};font-size:11px;font-weight:700;letter-spacing:0.4px;padding:6px 16px;border-radius:14px;">
            ⏱ TEMPO RESTANTE: 30 MINUTOS PARA GARANTIR SUA RESERVA
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-top:18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid ${CORES.bege};border-radius:8px;padding:14px;">
            <tr>
              <td style="font-size:11px;color:${CORES.cinza};padding-bottom:8px;font-weight:700;letter-spacing:0.4px;">CÓDIGO PIX COPIA E COLA</td>
            </tr>
            <tr>
              <td id="codigo-pix" style="font-size:12px;color:${CORES.carvao};word-break:break-all;font-family:'Courier New',Courier,monospace;background-color:${CORES.begeSuave};border-radius:6px;padding:12px;">
                ${escaparHtml(dadosPix.copiaECola)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color:${CORES.marromCouro};border-radius:8px;">
                <a href="#codigo-pix" style="display:block;padding:14px 20px;font-family:${FONTE_TITULO};font-size:14px;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.6px;">
                  TOQUE E SEGURE O CÓDIGO ACIMA PARA COPIAR
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  const passos = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td>
          ${passoNumeradoHtml(1, "Copie a chave PIX acima (toque e segure para selecionar tudo)")}
          ${passoNumeradoHtml(2, "Abra o aplicativo do seu banco na opção <strong>PIX Copia e Cola</strong>")}
          ${passoNumeradoHtml(3, "Cole o código e confirme o pagamento")}
        </td>
      </tr>
    </table>`;

  const conteudoHtml = `
    <p style="margin:0 0 6px;font-size:18px;color:${CORES.carvao};">Olá, <strong style="color:${CORES.marromCouro};">${escaparHtml(nome)}</strong>!</p>
    <p style="margin:0 0 24px;color:${CORES.cinza};">
      Recebemos o seu pedido <strong>#${pedido.id}</strong>. Seus produtos já estão reservados e aguardam a confirmação do PIX.
    </p>

    ${blocoPix}
    ${passos}

    <h3 style="margin:0 0 4px;font-family:${FONTE_TITULO};font-size:15px;color:${CORES.marromCouro};border-bottom:2px solid ${CORES.bege};padding-bottom:10px;">
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
    corTopo: CORES.marromCouro,
    tituloTopo: "Pedido Recebido",
    subtituloTopo: "Aguardando pagamento via PIX",
    preheader: "Seu pedido foi reservado com sucesso. Copie o código PIX para garantir suas peças.",
    conteudoHtml,
  });
}

module.exports = { templatePedidoCriado, assuntoPedidoCriado };
