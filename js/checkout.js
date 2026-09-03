/**
 * Checkout simulado — fluxo de UI completo, sem gateway de pagamento real.
 * Ao finalizar, o carrinho é esvaziado e um número de pedido fictício é exibido.
 */

function popularResumoCheckout() {
  const container = document.querySelector("[data-checkout-itens]");
  const itens = lerCarrinho();

  if (itens.length === 0) {
    window.location.href = "/pages/carrinho.html";
    return;
  }

  if (container) {
    container.innerHTML = itens
      .map(
        (item) => `
      <div class="carrinho-resumo__linha">
        <span>${item.quantidade}× ${item.nome}${item.tamanho ? ` (${item.tamanho})` : ""}</span>
        <span>${formatarPreco(item.preco * item.quantidade)}</span>
      </div>
    `,
      )
      .join("");
  }

  atualizarResumoCarrinho();
}

function inicializarSelecaoPagamento() {
  const opcoes = document.querySelectorAll("[data-pagamento-opcao]");
  const paineis = document.querySelectorAll("[data-pagamento-painel]");

  opcoes.forEach((opcao) => {
    opcao.addEventListener("click", () => {
      opcoes.forEach((o) => o.classList.remove("is-selecionada"));
      opcao.classList.add("is-selecionada");
      opcao.querySelector('input[type="radio"]').checked = true;

      const tipo = opcao.dataset.pagamentoOpcao;
      paineis.forEach((painel) => {
        painel.hidden = painel.dataset.pagamentoPainel !== tipo;
      });
    });
  });
}

function validarCampoObrigatorio(campo) {
  const grupo = campo.closest(".campo");
  const erroEl = grupo ? grupo.querySelector(".campo-erro") : null;
  const valido = campo.value.trim().length > 0;

  if (erroEl) {
    if (!erroEl.id) erroEl.id = `${campo.id}-erro`;
    erroEl.setAttribute("role", "alert");
    erroEl.textContent = valido ? "" : "Campo obrigatório.";
    campo.setAttribute("aria-describedby", erroEl.id);
    campo.setAttribute("aria-invalid", valido ? "false" : "true");
  }

  return valido;
}

function inicializarFormularioCheckout() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const camposObrigatorios = form.querySelectorAll("[required]");
    let formularioValido = true;

    camposObrigatorios.forEach((campo) => {
      if (!validarCampoObrigatorio(campo)) {
        formularioValido = false;
      }
    });

    if (!formularioValido) {
      const primeiroInvalido = form.querySelector('[aria-invalid="true"]');
      if (primeiroInvalido) {
        primeiroInvalido.closest(".campo").scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        primeiroInvalido.focus();
      }
      return;
    }

    finalizarPedido();
  });
}

function finalizarPedido() {
  const numeroPedido = "EW" + Math.floor(100000 + Math.random() * 900000);

  document
    .querySelectorAll(".checkout-etapas span")
    .forEach((el) => el.classList.add("is-ativa"));
  document
    .querySelectorAll("[data-checkout-etapa]")
    .forEach((el) => (el.hidden = true));

  const sucesso = document.querySelector("[data-checkout-sucesso]");
  const numeroEl = document.querySelector("[data-numero-pedido]");
  if (numeroEl) numeroEl.textContent = numeroPedido;
  if (sucesso) sucesso.hidden = false;

  esvaziarCarrinho();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  popularResumoCheckout();
  inicializarSelecaoPagamento();
  inicializarFormularioCheckout();
});
