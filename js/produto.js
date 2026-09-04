/**
 * Simulador de frete na página do produto.
 * Consulta /api/frete/calcular; se o backend estiver offline, cai em
 * uma simulação local (mesmas regras de frete grátis do carrinho).
 */
const FRETE_CEP_STORAGE_KEY = "estancia_cep";

function aplicarMascaraCep(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function simularOpcoesFreteLocal(total) {
  const valorTotal = Number(total) || 0;
  const freteGratis = valorTotal >= FRETE_GRATIS_A_PARTIR_DE;

  return {
    endereco: null,
    opcoes: [
      {
        tipo: "PAC",
        valor: freteGratis ? 0 : 24.9,
        prazo: "6 a 9 dias úteis",
        gratis: freteGratis,
      },
      {
        tipo: "SEDEX",
        valor: 39.9,
        prazo: "2 a 4 dias úteis",
        gratis: false,
      },
    ],
  };
}

async function calcularFrete(cep, total) {
  const cepLimpo = cep.replace(/\D/g, "");

  try {
    const resposta = await fetch("/api/frete/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: cepLimpo, total }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw { tratado: true, mensagem: dados.erro || "CEP inválido." };
    }

    return dados;
  } catch (erro) {
    if (erro && erro.tratado) throw erro;
    console.warn("Backend de frete indisponível, usando simulação local.", erro);
    return simularOpcoesFreteLocal(total);
  }
}

function renderizarOpcoesFrete(container, opcoes) {
  container.innerHTML = opcoes
    .map((opcao, indice) => {
      const icone = opcao.tipo === "SEDEX" ? "⚡" : "🚚";
      const valorHtml = opcao.gratis
        ? `<span class="frete-opcao__valor is-gratis">Frete Grátis</span>`
        : `<span class="frete-opcao__valor">${formatarPreco(opcao.valor)}</span>`;

      return `
        <label class="frete-opcao${opcao.gratis ? " is-gratis" : ""}${opcoes.length === 1 ? " is-unica" : ""}">
          <span class="frete-opcao__info">
            <input type="radio" name="frete-produto-opcao" value="${opcao.tipo}" ${indice === 0 ? "checked" : ""}>
            <span aria-hidden="true">${icone}</span>
            <span>
              <span class="frete-opcao__tipo">${opcao.tipo}</span><br>
              <span class="frete-opcao__prazo">${opcao.prazo}</span>
            </span>
          </span>
          ${valorHtml}
        </label>
      `;
    })
    .join("");
}

function inicializarFreteProduto() {
  const card = document.querySelector("[data-frete-card]");
  if (!card) return;

  const form = card.querySelector("[data-frete-form]");
  const campoCep = card.querySelector("#cep-produto");
  const erroEl = card.querySelector("[data-frete-erro]");
  const carregandoEl = card.querySelector("[data-frete-carregando]");
  const opcoesEl = card.querySelector("[data-frete-opcoes]");

  const cepSalvo = localStorage.getItem(FRETE_CEP_STORAGE_KEY);
  if (cepSalvo) {
    campoCep.value = aplicarMascaraCep(cepSalvo);
  }

  campoCep.addEventListener("input", () => {
    campoCep.value = aplicarMascaraCep(campoCep.value);
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const cepLimpo = campoCep.value.replace(/\D/g, "");
    erroEl.textContent = "";
    opcoesEl.hidden = true;

    if (cepLimpo.length !== 8) {
      erroEl.textContent = "Informe um CEP válido com 8 dígitos.";
      return;
    }

    carregandoEl.hidden = false;

    try {
      const total =
        typeof subtotalCarrinho === "function" ? subtotalCarrinho() : 0;
      const dados = await calcularFrete(cepLimpo, total);

      renderizarOpcoesFrete(opcoesEl, dados.opcoes);
      opcoesEl.hidden = false;
      localStorage.setItem(FRETE_CEP_STORAGE_KEY, cepLimpo);
    } catch (erro) {
      erroEl.textContent =
        (erro && erro.mensagem) || "Não foi possível calcular o frete agora.";
    } finally {
      carregandoEl.hidden = true;
    }
  });
}

document.addEventListener("DOMContentLoaded", inicializarFreteProduto);
