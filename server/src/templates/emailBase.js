const WHATSAPP_LINK = "https://wa.me/5546999244179";
const CNPJ = "66.510.101/0001-10";
const ANO_ATUAL = new Date().getFullYear();

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
 * Envolve o conteúdo de cada e-mail num shell HTML único: mesma tabela de
 * layout, cabeçalho e rodapé para os dois templates, evitando duplicar
 * boilerplate de compatibilidade (Gmail/Outlook/Apple Mail exigem tabelas
 * com estilos inline, não flexbox/grid nem <style> externo confiável).
 */
function shellEmail({ corTopo = "#5F3A2A", tituloTopo, subtituloTopo, conteudoHtml, iconeTopo = "" }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Estância Western</title>
</head>
<body style="margin:0;padding:0;background-color:#F4E4D7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4E4D7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">

          <tr>
            <td align="center" style="background-color:${corTopo};padding:32px 24px;">
              ${iconeTopo}
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:1px;color:#ffffff;font-weight:bold;">
                ESTÂNCIA WESTERN
              </div>
              <div style="width:48px;height:2px;background-color:#D9C3A8;margin:12px auto;"></div>
              <div style="font-size:18px;color:#ffffff;font-weight:bold;">${tituloTopo}</div>
              ${subtituloTopo ? `<div style="font-size:13px;color:#F4E4D7;margin-top:6px;">${subtituloTopo}</div>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;color:#1C1C1C;font-size:15px;line-height:1.6;">
              ${conteudoHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color:#F4E4D7;padding:24px 28px;text-align:center;">
              <p style="margin:0 0 12px;font-size:13px;color:#5F3A2A;">
                Dúvidas sobre seu pedido? Fale com a gente:
              </p>
              <a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background-color:#2E7D32;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:10px 20px;border-radius:24px;margin-bottom:16px;">
                Falar no WhatsApp
              </a>
              <p style="margin:0;font-size:11px;color:#8a7a6d;">
                Estância Western · CNPJ ${CNPJ}<br>
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
      const variacao = [item.cor ? `Cor: ${escaparHtml(item.cor)}` : "", item.tamanho ? `Tam: ${escaparHtml(item.tamanho)}` : ""]
        .filter(Boolean)
        .join(" · ") || "Padrão";

      const imagemHtml = !resumido && item.imagem
        ? `<td style="padding:10px 8px;width:64px;" valign="top">
             <img src="${escaparHtml(item.imagem)}" width="56" height="64" alt="${escaparHtml(item.nome)}" style="display:block;border-radius:4px;object-fit:cover;border:1px solid #D9C3A8;">
           </td>`
        : "";

      return `
        <tr>
          ${imagemHtml}
          <td style="padding:10px 8px;border-bottom:1px solid #F4E4D7;" valign="top">
            <div style="font-size:14px;color:#1C1C1C;font-weight:bold;">${escaparHtml(item.nome)}</div>
            <div style="font-size:12px;color:#8a7a6d;margin-top:2px;">${variacao} · Qtd: ${Number(item.quantidade) || 1}</div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #F4E4D7;text-align:right;white-space:nowrap;" valign="top">
            <span style="font-size:14px;color:#1C1C1C;font-weight:bold;">${formatarPreco(item.precoUnitario * (Number(item.quantidade) || 1))}</span>
          </td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">${linhas}</table>`;
}

function resumoFinanceiroHtml({ subtotal, frete, desconto, cupomCodigo, total }) {
  const linhaDesconto = desconto > 0
    ? `<tr>
         <td style="padding:4px 0;font-size:13px;color:#2E7D32;">Desconto${cupomCodigo ? ` (${escaparHtml(cupomCodigo)})` : ""}</td>
         <td style="padding:4px 0;font-size:13px;color:#2E7D32;text-align:right;">-${formatarPreco(desconto)}</td>
       </tr>`
    : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4E4D7;border-radius:6px;padding:16px;margin:16px 0;">
      <tr>
        <td colspan="2" style="padding:0 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#5F3A2A;">Subtotal</td>
              <td style="padding:4px 0;font-size:13px;color:#5F3A2A;text-align:right;">${formatarPreco(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#5F3A2A;">Frete</td>
              <td style="padding:4px 0;font-size:13px;color:#5F3A2A;text-align:right;">${frete === 0 ? "Grátis" : formatarPreco(frete)}</td>
            </tr>
            ${linhaDesconto}
            <tr>
              <td style="padding:10px 0 0;font-size:16px;color:#1C1C1C;font-weight:bold;border-top:1px solid #D9C3A8;">Total</td>
              <td style="padding:10px 0 0;font-size:16px;color:#1C1C1C;font-weight:bold;text-align:right;border-top:1px solid #D9C3A8;">${formatarPreco(total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function enderecoHtml(pedido) {
  const linhaComplemento = pedido.complemento ? `, ${escaparHtml(pedido.complemento)}` : "";
  const linhaBairro = pedido.bairro ? ` - ${escaparHtml(pedido.bairro)}` : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #D9C3A8;border-radius:6px;padding:14px;margin:16px 0;">
      <tr>
        <td style="font-size:13px;color:#1C1C1C;line-height:1.6;">
          <strong style="color:#5F3A2A;">Endereço de entrega</strong><br>
          ${escaparHtml(pedido.endereco)}, ${escaparHtml(pedido.numero)}${linhaComplemento}${linhaBairro}<br>
          ${escaparHtml(pedido.cidade)} - ${escaparHtml(pedido.estado)} · CEP ${escaparHtml(pedido.cep)}
        </td>
      </tr>
    </table>`;
}

module.exports = {
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
