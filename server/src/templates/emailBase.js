const WHATSAPP_LINK = "https://wa.me/5546999244179";
const CNPJ = "66.510.101/0001-10";
const ANO_ATUAL = new Date().getFullYear();
const URL_BASE_SITE = process.env.URL_BASE_SITE || "https://estancia-western.vercel.app";
const LOGO_EMAIL_URL = `${URL_BASE_SITE.replace(/\/$/, "")}/assets/logos/logo-transparente-bege.png`;

const CORES = {
  fundo: "#F4E4D7",
  card: "#FFFFFF",
  bordaCard: "#E3D5C8",
  marromCouro: "#5F3A2A",
  marromCafe: "#402714",
  bege: "#D9C3A8",
  begeSuave: "#FAF6F2",
  carvao: "#1C1C1C",
  cinza: "#6B625B",
  verdeSucesso: "#3B693A",
  verdeSucessoFundo: "#EBF3EC",
};

const FONTE_TITULO = "'Plus Jakarta Sans','Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const FONTE_CORPO = "Arial,Helvetica,sans-serif";

function formatarPreco(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
}

function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primeiroNome(nomeCompleto) {
  return String(nomeCompleto || "").trim().split(" ")[0] || "Cliente";
}

/**
 * Envolve o conteúdo de cada e-mail num shell HTML único: mesmo cabeçalho,
 * rodapé e reset de compatibilidade para os dois templates, evitando
 * duplicar boilerplate (Gmail/Outlook/Apple Mail exigem tabelas com
 * estilos inline, não flexbox/grid nem <style> externo confiável).
 *
 * `preheader` é o texto de pré-visualização mostrado pelo cliente de
 * e-mail ao lado do assunto (ex: na lista de e-mails do Gmail) — fica
 * oculto no corpo renderizado via a técnica padrão de esconder com
 * `display:none` + tamanho zero, sem depender de CSS externo.
 */
function shellEmail({ corTopo = CORES.marromCouro, tituloTopo, subtituloTopo, conteudoHtml, iconeTopo = "", preheader = "" }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="format-detection" content="telephone=no">
<title>Estância Western</title>
</head>
<body style="margin:0;padding:0;background-color:${CORES.fundo};font-family:${FONTE_CORPO};-webkit-text-size-adjust:none;text-size-adjust:none;">
  ${preheader ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${CORES.fundo};">${escaparHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.fundo};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${CORES.card};border:1px solid ${CORES.bordaCard};border-radius:12px;overflow:hidden;">

          <tr>
            <td align="center" style="background-color:${corTopo};padding:36px 24px;">
              ${iconeTopo}
              <img src="${LOGO_EMAIL_URL}" width="220" alt="Estância Western — Moda Country" style="display:block;width:220px;max-width:70%;height:auto;margin:0 auto;">
              <div style="font-family:${FONTE_TITULO};font-size:11px;letter-spacing:3px;color:${CORES.bege};margin-top:10px;">
                VISTA A ALMA DO CAMPO
              </div>
              <div style="width:48px;height:2px;background-color:${CORES.bege};margin:16px auto;"></div>
              <div style="font-family:${FONTE_TITULO};font-size:18px;color:#ffffff;font-weight:700;">${tituloTopo}</div>
              ${subtituloTopo ? `<div style="font-size:13px;color:${CORES.fundo};margin-top:6px;">${subtituloTopo}</div>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;color:${CORES.carvao};font-size:15px;line-height:1.6;">
              ${conteudoHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color:${CORES.fundo};padding:28px;text-align:center;">
              <p style="margin:0 0 14px;font-size:13px;color:${CORES.marromCouro};">
                Dúvidas sobre seu pedido? Fale com a gente:
              </p>
              <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background-color:${CORES.marromCouro};color:#ffffff;text-decoration:none;font-family:${FONTE_TITULO};font-size:13px;font-weight:700;padding:12px 26px;border-radius:24px;margin-bottom:18px;">
                Falar no WhatsApp
              </a>
              <p style="margin:0;font-size:11px;color:${CORES.cinza};">
                Estância Western LTDA · CNPJ ${CNPJ}<br>
                &copy; ${ANO_ATUAL} Estância Western. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Lista de itens do pedido em formato de tabela, reaproveitada pelos dois
 * e-mails (o de pagamento aprovado usa a versão enxuta via `resumido`).
 */
function tabelaItensHtml(itens, { resumido = false } = {}) {
  const linhas = itens
    .map((item) => {
      const variacao = [item.tamanho ? `Tamanho: ${escaparHtml(item.tamanho)}` : "", item.cor ? `Cor: ${escaparHtml(item.cor)}` : ""]
        .filter(Boolean)
        .join(" | ") || "Padrão";

      const imagemHtml = !resumido && item.imagem
        ? `<td style="padding:12px 10px;width:64px;" valign="top">
             <img src="${escaparHtml(item.imagem)}" width="56" height="64" alt="${escaparHtml(item.nome)}" style="display:block;border-radius:6px;object-fit:cover;border:1px solid ${CORES.bege};">
           </td>`
        : "";

      return `
        <tr>
          ${imagemHtml}
          <td style="padding:12px 10px;border-bottom:1px solid ${CORES.fundo};" valign="top">
            <div style="font-family:${FONTE_TITULO};font-size:14px;color:${CORES.carvao};font-weight:700;">${escaparHtml(item.nome)}</div>
            <div style="font-size:12px;color:${CORES.cinza};margin-top:3px;">${variacao} · Qtd: ${Number(item.quantidade) || 1}</div>
          </td>
          <td style="padding:12px 10px;border-bottom:1px solid ${CORES.fundo};text-align:right;white-space:nowrap;" valign="top">
            <span style="font-family:${FONTE_TITULO};font-size:14px;color:${CORES.carvao};font-weight:700;">${formatarPreco(item.precoUnitario * (Number(item.quantidade) || 1))}</span>
          </td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">${linhas}</table>`;
}

function resumoFinanceiroHtml({ subtotal, frete, desconto, cupomCodigo, total }) {
  const linhaDesconto = desconto > 0
    ? `<tr>
         <td style="padding:5px 0;font-size:13px;color:${CORES.verdeSucesso};">Desconto${cupomCodigo ? ` (${escaparHtml(cupomCodigo)})` : ""}</td>
         <td style="padding:5px 0;font-size:13px;color:${CORES.verdeSucesso};text-align:right;">-${formatarPreco(desconto)}</td>
       </tr>`
    : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.begeSuave};border:1px solid ${CORES.bege};border-radius:8px;padding:18px;margin:0 0 20px;">
      <tr>
        <td colspan="2" style="padding:0 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:${CORES.marromCouro};">Subtotal</td>
              <td style="padding:5px 0;font-size:13px;color:${CORES.marromCouro};text-align:right;">${formatarPreco(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:${CORES.marromCouro};">Frete</td>
              <td style="padding:5px 0;font-size:13px;color:${frete === 0 ? CORES.verdeSucesso : CORES.marromCouro};text-align:right;${frete === 0 ? "font-weight:700;" : ""}">${frete === 0 ? "Grátis" : formatarPreco(frete)}</td>
            </tr>
            ${linhaDesconto}
            <tr>
              <td style="padding:12px 0 0;font-family:${FONTE_TITULO};font-size:17px;color:${CORES.marromCafe};font-weight:700;border-top:1px solid ${CORES.bege};">Total</td>
              <td style="padding:12px 0 0;font-family:${FONTE_TITULO};font-size:17px;color:${CORES.marromCafe};font-weight:700;text-align:right;border-top:1px solid ${CORES.bege};">${formatarPreco(total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function enderecoHtml(pedido) {
  const linhaComplemento = pedido.complemento ? `, ${escaparHtml(pedido.complemento)}` : "";
  const linhaBairro = pedido.bairro ? ` — ${escaparHtml(pedido.bairro)}` : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.card};border:1px solid ${CORES.bordaCard};border-radius:8px;padding:16px;margin:0 0 20px;">
      <tr>
        <td style="font-size:13px;color:${CORES.carvao};line-height:1.7;">
          <strong style="font-family:${FONTE_TITULO};color:${CORES.marromCouro};">Endereço de entrega</strong><br>
          ${escaparHtml(pedido.cliente_nome)}<br>
          ${escaparHtml(pedido.endereco)}, ${escaparHtml(pedido.numero)}${linhaComplemento}${linhaBairro}<br>
          ${escaparHtml(pedido.cidade)} - ${escaparHtml(pedido.estado)} · CEP ${escaparHtml(pedido.cep)}
        </td>
      </tr>
    </table>`;
}

module.exports = {
  CORES,
  FONTE_TITULO,
  FONTE_CORPO,
  LOGO_EMAIL_URL,
  shellEmail,
  tabelaItensHtml,
  resumoFinanceiroHtml,
  enderecoHtml,
  formatarPreco,
  escaparHtml,
  primeiroNome,
  WHATSAPP_LINK,
  CNPJ,
};
