/**
 * Central de rastreamento de pedidos (pages/conta.html).
 * Para testes de front-end, consulta os pedidos salvos em localStorage;
 * quando o backend estiver ativo, prioriza a rota GET /api/pedidos/:id.
 */

const ETAPAS_RASTREIO = ["pedido-recebido", "pagamento-confirmado", "em-separacao", "enviado"];

function definirErroCampoRastreio(campo, mensagem) {
  const grupo = campo.closest(".campo");
  const erroEl = grupo ? grupo.querySelector(".campo-erro") : null;
  if (erroEl) {
    if (!erroEl.id) erroEl.id = `${campo.id}-erro`;
    erroEl.setAttribute("role", "alert");
    erroEl.textContent = mensagem || "";
    campo.setAttribute("aria-describedby", erroEl.id);
    campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
  }
}

function mapearStatusParaEtapa(status) {
  if (status === "pago") return "pagamento-confirmado";
  if (status === "em_separacao") return "em-separacao";
  if (status === "enviado") return "enviado";
  return "pedido-recebido";
}

async function buscarPedidoParaRastreio(numero, email) {
  const idNumerico = String(numero || "").replace(/\D/g, "");

  if (idNumerico) {
    try {
      const resposta = await fetch(`/api/pedidos/${idNumerico}`);
      if (resposta.ok) {
        const pedido = await resposta.json();
        if (String(pedido.cliente_email || "").toLowerCase() === email.toLowerCase()) {
          return {
            numero,
            total: pedido.total,
            etapa: mapearStatusParaEtapa(pedido.status),
            codigoRastreio: pedido.codigo_rastreio || null,
          };
        }
      }
    } catch (erro) {
      console.warn("Backend de pedidos indisponível, usando dados locais.", erro);
    }
  }

  const pedidoLocal = buscarPedidoLocal(numero, email);
  return pedidoLocal;
}

function renderizarLinhaTempoRastreio(container, etapaAtual) {
  const indiceAtual = ETAPAS_RASTREIO.indexOf(etapaAtual);

  container.querySelectorAll("[data-etapa]").forEach((item) => {
    const indiceItem = ETAPAS_RASTREIO.indexOf(item.dataset.etapa);
    item.classList.toggle("is-concluida", indiceItem <= indiceAtual);
    item.classList.toggle("is-atual", indiceItem === indiceAtual);
  });
}

function inicializarRastreioPedido() {
  const form = document.querySelector("[data-rastreio-form]");
  if (!form) return;

  const campoEmail = document.getElementById("rastreio-email");
  const campoNumero = document.getElementById("rastreio-numero");
  const resultado = document.querySelector("[data-rastreio-resultado]");
  const naoEncontrado = document.querySelector("[data-rastreio-nao-encontrado]");
  const numeroEl = document.querySelector("[data-rastreio-numero]");
  const totalEl = document.querySelector("[data-rastreio-total]");
  const etapasEl = document.querySelector("[data-rastreio-etapas]");
  const codigoRastreioEl = document.querySelector("[data-rastreio-codigo]");
  const botao = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    resultado.hidden = true;
    naoEncontrado.hidden = true;

    const email = campoEmail.value.trim();
    const numero = campoNumero.value.trim();

    let valido = true;
    if (!email) {
      definirErroCampoRastreio(campoEmail, "Informe o e-mail usado na compra.");
      valido = false;
    } else {
      definirErroCampoRastreio(campoEmail, "");
    }
    if (!numero) {
      definirErroCampoRastreio(campoNumero, "Informe o número do pedido.");
      valido = false;
    } else {
      definirErroCampoRastreio(campoNumero, "");
    }
    if (!valido) return;

    botao.disabled = true;
    botao.classList.add("is-enviando");
    botao.textContent = "Rastreando...";

    try {
      const pedido = await buscarPedidoParaRastreio(numero, email);

      if (!pedido) {
        naoEncontrado.hidden = false;
        return;
      }

      numeroEl.textContent = pedido.numero;
      totalEl.textContent = typeof pedido.total === "number" ? formatarPreco(pedido.total) : "";
      renderizarLinhaTempoRastreio(etapasEl, pedido.etapa || "pedido-recebido");
      if (codigoRastreioEl) {
        if (pedido.codigoRastreio) {
          codigoRastreioEl.textContent = `Código de rastreio: ${pedido.codigoRastreio}`;
          codigoRastreioEl.hidden = false;
        } else {
          codigoRastreioEl.hidden = true;
        }
      }
      resultado.hidden = false;
      resultado.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      botao.disabled = false;
      botao.classList.remove("is-enviando");
      botao.textContent = "Rastrear Pedido";
    }
  });
}

document.addEventListener("DOMContentLoaded", inicializarRastreioPedido);
