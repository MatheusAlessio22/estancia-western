const crypto = require("crypto");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
const credencialValida = accessToken && !accessToken.includes("SEU-ACCESS-TOKEN");

let paymentClient = null;
if (credencialValida) {
  const client = new MercadoPagoConfig({ accessToken });
  paymentClient = new Payment(client);
}

function gerarChavePixSimulada(pedidoId) {
  const hash = crypto.createHash("sha256").update(`ew-pedido-${pedidoId}-${Date.now()}`).digest("hex");
  return `00020126580014BR.GOV.BCB.PIX0136${hash.slice(0, 32)}5204000053039865802BR5920ESTANCIA WESTERN LTDA6009SAO PAULO62070503***6304${hash.slice(0, 4).toUpperCase()}`;
}

function gerarQrCodeSimuladoBase64(copiaECola) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <rect width="240" height="240" fill="#ffffff"/>
    <rect x="10" y="10" width="220" height="220" fill="none" stroke="#1C1C1C" stroke-width="4"/>
    <text x="120" y="110" font-family="monospace" font-size="12" text-anchor="middle" fill="#1C1C1C">QR CODE PIX</text>
    <text x="120" y="130" font-family="monospace" font-size="10" text-anchor="middle" fill="#5F3A2A">(modo simulação)</text>
  </svg>`;
  return Buffer.from(svg).toString("base64");
}

async function criarPagamentoPix({ pedidoId, valor, clienteNome, clienteEmail, clienteCpf }) {
  if (!credencialValida || !paymentClient) {
    const copiaECola = gerarChavePixSimulada(pedidoId);
    return {
      simulado: true,
      mpPaymentId: `SIMULADO-${pedidoId}`,
      copiaECola,
      qrCodeBase64: gerarQrCodeSimuladoBase64(copiaECola),
      qrCodeMimeType: "image/svg+xml",
    };
  }

  try {
    const [primeiroNome, ...resto] = clienteNome.trim().split(" ");
    const sobrenome = resto.join(" ") || primeiroNome;

    const resultado = await paymentClient.create({
      body: {
        transaction_amount: Number(valor.toFixed(2)),
        description: `Pedido Estância Western #${pedidoId}`,
        payment_method_id: "pix",
        payer: {
          email: clienteEmail,
          first_name: primeiroNome,
          last_name: sobrenome,
          identification: {
            type: "CPF",
            number: String(clienteCpf || "").replace(/\D/g, "") || "00000000000",
          },
        },
        external_reference: String(pedidoId),
      },
    });

    const transacao = resultado.point_of_interaction?.transaction_data;
    if (!transacao?.qr_code) {
      throw new Error("Resposta do Mercado Pago sem dados de QR Code.");
    }

    return {
      simulado: false,
      mpPaymentId: String(resultado.id),
      copiaECola: transacao.qr_code,
      qrCodeBase64: transacao.qr_code_base64,
      qrCodeMimeType: "image/png",
    };
  } catch (erro) {
    console.warn("Falha ao criar pagamento Pix no Mercado Pago, usando modo simulação:", erro.message);
    const copiaECola = gerarChavePixSimulada(pedidoId);
    return {
      simulado: true,
      mpPaymentId: `SIMULADO-${pedidoId}`,
      copiaECola,
      qrCodeBase64: gerarQrCodeSimuladoBase64(copiaECola),
      qrCodeMimeType: "image/svg+xml",
    };
  }
}

async function consultarPagamento(mpPaymentId) {
  if (!credencialValida || !paymentClient || String(mpPaymentId).startsWith("SIMULADO-")) {
    return null;
  }

  try {
    return await paymentClient.get({ id: mpPaymentId });
  } catch (erro) {
    console.warn("Falha ao consultar pagamento no Mercado Pago:", erro.message);
    return null;
  }
}

module.exports = { criarPagamentoPix, consultarPagamento, credencialValida };
