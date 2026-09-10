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
  <div style="width:52px;height:52px;border-radius:50%;background-color:${CORES.verdeSucesso};margin:0 auto 14px;line-height:52px;text-align:center;">
    <span style="font-size:28px;color:#ffffff;">&#10003;</span>
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
        ? `<div style="width:2px;height:22px;background-color:${numero < etapaAtual ? CORES.verdeSucesso : CORES.bege};margin:2px auto;"></div>`
        : "";

      return `
        <tr>
          <td width="34" valign="top" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="26" height="26" style="background-color:${corBolha};border-radius:13px;">
              <tr><td align="center" valign="middle" style="font-size:13px;color:#ffffff;font-weight:700;">${simbolo}</td></tr>
            </table>
            ${conector}
          </td>
          <td style="padding:0 0 ${numero < etapas.length ? "18" : "0"}px 12px;" valign="top">
            <div style="font-family:${FONTE_TITULO};font-size:14px;color:${corTexto};font-weight:700;">${escaparHtml(titulo)}</div>
            <div style="font-size:12px;color:${pendente ? CORES.cinza : CORES.verdeSucesso};margin-top:2px;">${rotuloStatus}</div>
          </td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">${linhas}</table>`;
}

function templatePagamentoAprovado({ pedido, itens }) {
  const nome = primeiroNome(pedido.cliente_nome);

  const conteudoHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.verdeSucessoFundo};border:1px solid ${CORES.verdeSucesso};border-radius:10px;padding:20px;margin:0 0 22px;">
      <tr>
        <td align="center">
          ${ICONE_VERIFICADO}
          <div style="font-family:${FONTE_TITULO};font-size:14px;color:${CORES.verdeSucesso};font-weight:700;letter-spacing:0.6px;">
            PAGAMENTO APROVADO COM SUCESSO
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:15px;color:${CORES.carvao};">
      Perfeito, <strong style="color:${CORES.marromCouro};">${escaparHtml(nome)}</strong>! Seu pagamento de
      <strong>${formatarPreco(pedido.total)}</strong> foi confirmado. O pedido <strong>#${pedido.id}</strong>
      já está na esteira de preparação.
    </p>

    <h3 style="margin:0 0 14px;font-family:${FONTE_TITULO};font-size:15px;color:${CORES.marromCouro};border-bottom:2px solid ${CORES.bege};padding-bottom:10px;">
      Acompanhe seu pedido
    </h3>
    ${timelineHtml(3)}

    <p style="margin:0 0 24px;font-size:13px;color:${CORES.cinza};background-color:${CORES.begeSuave};border-radius:8px;padding:14px;">
      Nossa equipe está embalando suas peças com todo o cuidado. Assim que o pedido for postado,
      você recebe um novo e-mail com o código de rastreamento dos Correios.
    </p>

    <h3 style="margin:0 0 4px;font-family:${FONTE_TITULO};font-size:15px;color:${CORES.marromCouro};border-bottom:2px solid ${CORES.bege};padding-bottom:10px;">
      Resumo do pedido #${pedido.id}
    </h3>
    ${tabelaItensHtml(itens, { resumido: true })}

    ${enderecoHtml(pedido)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0 0 14px;font-size:13px;color:${CORES.cinza};">Alguma dúvida sobre a entrega?</p>
          <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background-color:${CORES.marromCouro};color:#ffffff;text-decoration:none;font-family:${FONTE_TITULO};font-size:14px;font-weight:700;padding:14px 30px;border-radius:24px;">
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
