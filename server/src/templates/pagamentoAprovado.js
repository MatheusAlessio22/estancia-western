const {
  CORES,
  FONTE_TITULO,
  shellEmail,
  tabelaItensHtml,
  enderecoHtml,
  formatarPreco,
  escaparHtml,
  primeiroNome,
  WHATSAPP_LINK,
} = require("./emailBase");

function assuntoPagamentoAprovado(pedidoId) {
  return `Pagamento Confirmado! Pedido #${pedidoId} em separação — Estância Western`;
}

const ICONE_VERIFICADO = `
  <div style="width:40px;height:40px;border-radius:50%;background-color:${CORES.verdeSucesso};margin:0 auto 10px;line-height:40px;text-align:center;">
    <span style="font-size:20px;color:#ffffff;">&#10003;</span>
  </div>`;

/**
 * Timeline de 4 etapas do pedido. `etapaAtual` = 3 (Em Separação) é o
 * único status que este e-mail representa hoje — quando o rastreio for
 * implementado, o e-mail seguinte usará etapaAtual = 4.
 */
function timelineHtml(etapaAtual = 3) {
  const etapas = [
    "Pedido Recebido",
    "Pagamento Aprovado",
    "Em Separação e Embalagem",
    "Enviado / Rastreamento",
  ];

  const linhas = etapas
    .map((titulo, indice) => {
      const numero = indice + 1;
      const concluida = numero < etapaAtual;
      const emAndamento = numero === etapaAtual;
      const pendente = numero > etapaAtual;

      const corBolha = concluida || emAndamento ? CORES.verdeSucesso : CORES.bege;
      const corTexto = pendente ? CORES.cinza : CORES.carvao;
      const simbolo = concluida ? "&#10003;" : emAndamento ? "&#9679;" : "";
      const rotuloStatus = concluida ? "Concluído" : emAndamento ? "Em andamento" : "Aguardando";

      const conector = numero < etapas.length
        ? `<div style="width:2px;height:16px;background-color:${numero < etapaAtual ? CORES.verdeSucesso : CORES.bege};margin:2px auto;"></div>`
        : "";

      return `
        <tr>
          <td width="28" valign="top" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="20" height="20" style="background-color:${corBolha};border-radius:10px;">
              <tr><td align="center" valign="middle" style="font-size:11px;color:#ffffff;font-weight:700;">${simbolo}</td></tr>
            </table>
            ${conector}
          </td>
          <td style="padding:0 0 ${numero < etapas.length ? "10" : "0"}px 10px;" valign="top">
            <div style="font-family:${FONTE_TITULO};font-size:13px;color:${corTexto};font-weight:700;">${escaparHtml(titulo)}</div>
            <div style="font-size:12px;color:${pendente ? CORES.metadado : CORES.verdeSucesso};margin-top:1px;">${rotuloStatus}</div>
          </td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${linhas}</table>`;
}

function templatePagamentoAprovado({ pedido, itens }) {
  const nome = primeiroNome(pedido.cliente_nome);

  const conteudoHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.verdeSucessoFundo};border:1px solid ${CORES.verdeSucesso};border-radius:8px;padding:16px 20px;margin:0 0 16px;">
      <tr>
        <td align="center">
          ${ICONE_VERIFICADO}
          <div style="font-family:${FONTE_TITULO};font-size:13px;color:${CORES.verdeSucesso};font-weight:700;letter-spacing:0.4px;">
            PAGAMENTO APROVADO COM SUCESSO
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:19px;font-weight:700;line-height:1.3;color:${CORES.carvao};">
      Perfeito, <span style="color:${CORES.marromCouro};">${escaparHtml(nome)}</span>!
    </p>
    <p style="margin:-8px 0 16px;font-size:14px;line-height:1.55;color:${CORES.textoCorpo};">
      Seu pagamento de <strong>${formatarPreco(pedido.total)}</strong> foi confirmado. O pedido <strong>#${pedido.id}</strong>
      já está na esteira de preparação.
    </p>

    <h3 style="margin:0 0 8px;font-family:${FONTE_TITULO};font-size:15px;color:${CORES.marromCouro};border-bottom:1px solid ${CORES.divisor};padding-bottom:8px;">
      Acompanhe seu pedido
    </h3>
    ${timelineHtml(3)}

    <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${CORES.cinza};background-color:${CORES.begeSuave};border-radius:8px;padding:12px 14px;">
      Nossa equipe está embalando suas peças com todo o cuidado. Assim que o pedido for postado,
      você recebe um novo e-mail com o código de rastreamento dos Correios.
    </p>

    <h3 style="margin:0 0 8px;font-family:${FONTE_TITULO};font-size:15px;color:${CORES.marromCouro};border-bottom:1px solid ${CORES.divisor};padding-bottom:8px;">
      Resumo do pedido #${pedido.id}
    </h3>
    ${tabelaItensHtml(itens, { resumido: true })}

    ${enderecoHtml(pedido)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0 0 10px;font-size:13px;color:${CORES.cinza};">Alguma dúvida sobre a entrega?</p>
          <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background-color:${CORES.marromCouro};color:#ffffff;text-decoration:none;font-family:${FONTE_TITULO};font-size:13px;font-weight:700;letter-spacing:0.5px;padding:12px 24px;border-radius:20px;">
            Falar com o time no WhatsApp
          </a>
        </td>
      </tr>
    </table>
  `;

  return shellEmail({
    corTopo: CORES.verdeSucesso,
    tituloTopo: "Pagamento Confirmado",
    subtituloTopo: "Seu pedido já está em separação",
    iconeTopo: "",
    preheader: "Tudo certo! Seu pagamento foi aprovado e suas peças já estão na esteira de preparação.",
    conteudoHtml,
  });
}

module.exports = { templatePagamentoAprovado, assuntoPagamentoAprovado };
