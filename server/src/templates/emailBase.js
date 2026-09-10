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
  bordaSuave: "#E5D7C9",
  carvao: "#1C1C1C",
  textoCorpo: "#3D352F",
  cinza: "#6B625B",
  metadado: "#7A6F66",
  divisor: "#EADBCE",
  divisorTabela: "#F0E8DF",
  bordaFoto: "#ECE3D9",
  verdeSucesso: "#3B693A",
  verdeSucessoFundo: "#EBF3EC",
};

// Mesmas famílias do site (css/variables.css: --fonte-titulo / --fonte-corpo).
// Clientes de e-mail não confiam em @font-face de forma consistente
// (Outlook desktop ignora completamente), então a fonte web é carregada
// como enhancement progressivo — quem suporta (Gmail, Apple Mail) exibe
// Barlow Condensed / Plus Jakarta Sans; quem não suporta cai no fallback
// de sistema já listado na pilha.
const FONTE_TITULO = "'Barlow Condensed',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const FONTE_CORPO = "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif";

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
<!--[if !mso]><!-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  .ew-tabela-principal { width: 600px; }
  @media screen and (max-width: 600px) {
    .ew-tabela-principal { width: 100% !important; }
    .ew-card { padding-left: 16px !important; padding-right: 16px !important; }
    .ew-corpo { padding: 20px 16px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${CORES.fundo};font-family:${FONTE_CORPO};-webkit-text-size-adjust:none;text-size-adjust:none;">
  ${preheader ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${CORES.fundo};">${escaparHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.fundo};padding:16px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="ew-tabela-principal" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${CORES.card};border:1px solid ${CORES.bordaCard};border-radius:10px;overflow:hidden;">

          <tr>
            <td class="ew-card" align="center" style="background-color:${corTopo};padding-block:16px;padding-inline:24px;">
              ${iconeTopo}
              <img src="${LOGO_EMAIL_URL}" width="150" height="58" alt="Estância Western" style="display:block;width:150px;height:58px;margin:0 auto;border:0;outline:none;">
              <div style="font-family:${FONTE_TITULO};font-size:10px;letter-spacing:1.5px;color:${CORES.bege};opacity:0.85;margin-top:8px;">
                VISTA A ALMA DO CAMPO
              </div>
              <div style="width:36px;height:2px;background-color:${CORES.bege};margin:12px auto;"></div>
              <div style="font-family:${FONTE_TITULO};font-size:19px;letter-spacing:0.5px;color:#ffffff;font-weight:700;">${tituloTopo}</div>
              ${subtituloTopo ? `<div style="font-size:12px;color:${CORES.fundo};margin-top:4px;">${subtituloTopo}</div>` : ""}
            </td>
          </tr>

          <tr>
            <td class="ew-corpo" style="padding:24px 28px;color:${CORES.textoCorpo};font-size:14px;line-height:1.55;">
              ${conteudoHtml}
            </td>
          </tr>

          <tr>
            <td class="ew-card" style="background-color:${CORES.fundo};padding-block:20px;padding-inline:24px;text-align:center;">
              <p style="margin:0 0 10px;font-size:12px;color:${CORES.marromCouro};">
                Dúvidas sobre seu pedido? Fale com a gente:
              </p>
              <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background-color:${CORES.marromCouro};color:#ffffff;text-decoration:none;font-family:${FONTE_TITULO};font-size:12px;font-weight:700;letter-spacing:0.5px;padding:10px 22px;border-radius:20px;margin-bottom:14px;">
                Falar no WhatsApp
              </a>
              <p style="margin:0;font-size:11px;color:${CORES.metadado};">
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
      const variacao = [item.tamanho ? `Tam: ${escaparHtml(item.tamanho)}` : "", item.cor ? `Cor: ${escaparHtml(item.cor)}` : ""]
        .filter(Boolean)
        .join(" | ") || "Padrão";

      const imagemHtml = !resumido && item.imagem
        ? `<td style="padding:10px 10px 10px 0;width:56px;" valign="top">
             <img src="${escaparHtml(item.imagem)}" width="56" height="56" alt="${escaparHtml(item.nome)}" style="display:block;width:56px;height:56px;border-radius:6px;object-fit:cover;border:1px solid ${CORES.bordaFoto};">
           </td>`
        : "";

      return `
        <tr>
          ${imagemHtml}
          <td style="padding:10px 0;border-bottom:1px solid ${CORES.divisorTabela};" valign="top">
            <div style="font-family:${FONTE_TITULO};font-size:14px;color:${CORES.carvao};font-weight:700;">${escaparHtml(item.nome)}</div>
            <div style="font-size:12px;color:${CORES.metadado};margin-top:2px;">${variacao} · Qtd: ${Number(item.quantidade) || 1}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${CORES.divisorTabela};text-align:right;white-space:nowrap;" valign="top">
            <span style="font-family:${FONTE_TITULO};font-size:14px;color:${CORES.carvao};font-weight:600;">${formatarPreco(item.precoUnitario * (Number(item.quantidade) || 1))}</span>
          </td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;">${linhas}</table>`;
}

function resumoFinanceiroHtml({ subtotal, frete, desconto, cupomCodigo, total }) {
  const linhaDesconto = desconto > 0
    ? `<tr>
         <td style="padding:4px 0;font-size:13px;color:${CORES.verdeSucesso};">Desconto${cupomCodigo ? ` (${escaparHtml(cupomCodigo)})` : ""}</td>
         <td style="padding:4px 0;font-size:13px;color:${CORES.verdeSucesso};text-align:right;">-${formatarPreco(desconto)}</td>
       </tr>`
    : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.begeSuave};border:1px solid ${CORES.bordaSuave};border-radius:8px;padding:16px 20px;margin:0 0 16px;">
      <tr>
        <td colspan="2" style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:${CORES.cinza};">Subtotal</td>
              <td style="padding:4px 0;font-size:13px;color:${CORES.cinza};text-align:right;">${formatarPreco(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:${CORES.cinza};">Frete</td>
              <td style="padding:4px 0;font-size:13px;color:${frete === 0 ? CORES.verdeSucesso : CORES.cinza};text-align:right;${frete === 0 ? "font-weight:700;" : ""}">${frete === 0 ? "Grátis" : formatarPreco(frete)}</td>
            </tr>
            ${linhaDesconto}
            <tr>
              <td style="padding-top:10px;margin-top:6px;font-family:${FONTE_TITULO};font-size:16px;color:${CORES.marromCouro};font-weight:800;border-top:1px solid ${CORES.bordaCard};">Total</td>
              <td style="padding-top:10px;margin-top:6px;font-family:${FONTE_TITULO};font-size:16px;color:${CORES.marromCouro};font-weight:800;text-align:right;border-top:1px solid ${CORES.bordaCard};">${formatarPreco(total)}</td>
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.card};border:1px solid ${CORES.bordaCard};border-radius:8px;padding:14px 16px;margin:0 0 16px;">
      <tr>
        <td style="font-size:13px;color:${CORES.textoCorpo};line-height:1.6;">
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
