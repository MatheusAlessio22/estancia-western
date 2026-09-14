const { CORES, FONTE_TITULO, shellEmail } = require("./emailBase");

function assuntoNewsletterBoasVindas() {
  return "Bem-vindo à Estância Western — 10% OFF na primeira compra";
}

function templateNewsletterBoasVindas() {
  const conteudoHtml = `
    <p style="margin:0 0 16px;">Seu e-mail foi cadastrado com sucesso na nossa newsletter.</p>
    <p style="margin:0 0 16px;">A partir de agora você recebe em primeira mão os lançamentos, promoções exclusivas e novidades da Estância Western.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CORES.begeSuave};border:1px solid ${CORES.bordaSuave};border-radius:8px;padding:16px 20px;margin:0 0 16px;text-align:center;">
      <tr>
        <td>
          <div style="font-family:${FONTE_TITULO};font-size:13px;letter-spacing:0.5px;color:${CORES.cinza};">USE O CUPOM</div>
          <div style="font-family:${FONTE_TITULO};font-size:22px;font-weight:800;color:${CORES.marromCouro};margin-top:4px;">PRIMEIRACOMPRA</div>
          <div style="font-size:12px;color:${CORES.metadado};margin-top:4px;">10% de desconto na sua primeira compra</div>
        </td>
      </tr>
    </table>
    <p style="margin:0;">Vista a alma do campo. 🤠</p>
  `;

  return shellEmail({
    tituloTopo: "Bem-vindo à Estância Western",
    subtituloTopo: "Cadastro na newsletter confirmado",
    conteudoHtml,
    preheader: "Seu cadastro foi confirmado — use PRIMEIRACOMPRA e ganhe 10% OFF.",
  });
}

module.exports = { templateNewsletterBoasVindas, assuntoNewsletterBoasVindas };
