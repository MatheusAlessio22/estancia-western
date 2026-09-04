/**
 * Checkout — integrado à API do backend (server/src).
 * Endereço via ViaCEP, pagamento Pix dinâmico via Mercado Pago (com modo simulação),
 * e polling de status até confirmação do pagamento.
 */

const PIX_POLLING_INTERVALO_MS = 3000;
let pixPollingTimer = null;

let opcoesFreteCheckout = [];
let freteSelecionado = null;
let enderecoConfirmado = null;

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

  atualizarResumoCheckout();
}

function atualizarResumoCheckout() {
  const subtotalEl = document.querySelector("[data-resumo-subtotal]");
  const freteEl = document.querySelector("[data-resumo-frete]");
  const totalEl = document.querySelector("[data-resumo-total]");
  const enderecoEl = document.querySelector("[data-resumo-endereco]");

  const subtotal = subtotalCarrinho();
  const valorFreteSelecionado = freteSelecionado ? freteSelecionado.valor : 0;

  if (subtotalEl) subtotalEl.textContent = formatarPreco(subtotal);

  if (freteEl) {
    if (!freteSelecionado) {
      freteEl.textContent = "Calcule o CEP";
    } else if (freteSelecionado.gratis) {
      freteEl.textContent = "Grátis";
    } else {
      freteEl.textContent = formatarPreco(valorFreteSelecionado);
    }
  }

  if (totalEl) totalEl.textContent = formatarPreco(subtotal + valorFreteSelecionado);

  if (enderecoEl) {
    if (enderecoConfirmado) {
      const numero = document.getElementById("numero")?.value.trim() || "";
      enderecoEl.textContent = `Entregar em: ${enderecoConfirmado.endereco}${numero ? `, ${numero}` : ""} — ${enderecoConfirmado.cidade}/${enderecoConfirmado.estado}, CEP ${aplicarMascaraCep(enderecoConfirmado.cep)}`;
      enderecoEl.hidden = false;
    } else {
      enderecoEl.hidden = true;
    }
  }
}

function renderizarOpcoesFreteCheckout(opcoes) {
  const secao = document.querySelector("[data-frete-secao]");
  const container = document.querySelector("[data-checkout-frete-opcoes]");
  if (!secao || !container) return;

  opcoesFreteCheckout = opcoes;
  freteSelecionado = opcoes[0] || null;

  container.innerHTML = opcoes
    .map((opcao, indice) => {
      const tagHtml = opcao.gratis
        ? `<span class="frete-tag frete-tag--gratis">Frete Grátis</span>`
        : opcao.tipo === "SEDEX"
          ? `<span class="frete-tag frete-tag--expresso">Mais rápido</span>`
          : `<span class="frete-tag">Econômico</span>`;
      const valorHtml = opcao.gratis
        ? `<span class="frete-opcao__valor is-gratis">Frete Grátis</span>`
        : `<span class="frete-opcao__valor">${formatarPreco(opcao.valor)}</span>`;

      return `
        <label class="frete-opcao${opcao.gratis ? " is-gratis" : ""}">
          <span class="frete-opcao__info">
            <input type="radio" name="frete-checkout-opcao" value="${opcao.tipo}" ${indice === 0 ? "checked" : ""}>
            <span>
              <span class="frete-opcao__tipo">${opcao.tipo}</span> ${tagHtml}<br>
              <span class="frete-opcao__prazo">${opcao.prazo}</span>
            </span>
          </span>
          ${valorHtml}
        </label>
      `;
    })
    .join("");

  container.querySelectorAll('input[name="frete-checkout-opcao"]').forEach((input) => {
    input.addEventListener("change", () => {
      freteSelecionado = opcoesFreteCheckout.find((o) => o.tipo === input.value) || null;
      atualizarResumoCheckout();
    });
  });

  secao.hidden = false;
  atualizarResumoCheckout();
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

function definirErroCampo(campo, mensagem) {
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

function aplicarMascaraCep(valor) {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function simularOpcoesFreteLocalCheckout(total) {
  const valorTotal = Number(total) || 0;
  const freteGratis = valorTotal >= FRETE_GRATIS_A_PARTIR_DE;

  return {
    endereco: null,
    opcoes: [
      { tipo: "PAC", valor: freteGratis ? 0 : 24.9, prazo: "6 a 9 dias úteis", gratis: freteGratis },
      { tipo: "SEDEX", valor: 39.9, prazo: "2 a 4 dias úteis", gratis: false },
    ],
  };
}

function inicializarAutocompleteCep() {
  const campoCep = document.getElementById("cep");
  if (!campoCep) return;

  const campoEndereco = document.getElementById("endereco");
  const campoCidade = document.getElementById("cidade");
  const campoEstado = document.getElementById("estado");
  const carregandoEl = document.querySelector("[data-checkout-frete-carregando]");

  const cepSalvo = localStorage.getItem("estancia_cep");
  if (cepSalvo) {
    campoCep.value = aplicarMascaraCep(cepSalvo);
  }

  campoCep.addEventListener("input", () => {
    campoCep.value = aplicarMascaraCep(campoCep.value);
  });

  campoCep.addEventListener("blur", async () => {
    const cepLimpo = campoCep.value.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    if (carregandoEl) carregandoEl.hidden = false;

    try {
      const resposta = await fetch("/api/frete/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cepLimpo, total: subtotalCarrinho() }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        definirErroCampo(campoCep, dados.erro || "CEP não encontrado.");
        return;
      }

      definirErroCampo(campoCep, "");
      localStorage.setItem("estancia_cep", cepLimpo);

      if (campoEndereco && dados.endereco.logradouro) {
        campoEndereco.value = dados.endereco.logradouro;
      }
      if (campoCidade) campoCidade.value = dados.endereco.cidade;
      if (campoEstado) campoEstado.value = dados.endereco.estado;

      enderecoConfirmado = {
        endereco: campoEndereco ? campoEndereco.value.trim() : "",
        cidade: campoCidade ? campoCidade.value.trim() : "",
        estado: campoEstado ? campoEstado.value.trim() : "",
        cep: cepLimpo,
      };

      renderizarOpcoesFreteCheckout(dados.opcoes);
    } catch (erro) {
      console.warn("Backend de frete indisponível, usando simulação local.", erro);
      definirErroCampo(campoCep, "");
      localStorage.setItem("estancia_cep", cepLimpo);
      enderecoConfirmado = {
        endereco: campoEndereco ? campoEndereco.value.trim() : "",
        cidade: campoCidade ? campoCidade.value.trim() : "",
        estado: campoEstado ? campoEstado.value.trim() : "",
        cep: cepLimpo,
      };
      const dadosSimulados = simularOpcoesFreteLocalCheckout(subtotalCarrinho());
      renderizarOpcoesFreteCheckout(dadosSimulados.opcoes);
    } finally {
      if (carregandoEl) carregandoEl.hidden = true;
    }
  });
}

function definirBotaoCheckoutCarregando(botao, carregando) {
  if (!botao) return;

  if (carregando) {
    if (!botao.dataset.textoOriginal) {
      botao.dataset.textoOriginal = botao.textContent;
    }
    botao.disabled = true;
    botao.classList.add("is-enviando");
    botao.textContent = "Processando pedido...";
  } else {
    botao.disabled = false;
    botao.classList.remove("is-enviando");
    botao.textContent = botao.dataset.textoOriginal || "Confirmar Pedido";
  }
}

function inicializarFormularioCheckout() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  const botaoConfirmar = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const camposObrigatorios = Array.from(form.querySelectorAll("[required]")).filter(
      (campo) => !campo.closest("[data-pagamento-painel]") || !campo.closest("[data-pagamento-painel]").hidden,
    );
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

    if (!freteSelecionado) {
      const secaoFrete = document.querySelector("[data-frete-secao]");
      if (secaoFrete) {
        secaoFrete.hidden = false;
        secaoFrete.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      definirErroCampo(document.getElementById("cep"), "Informe o CEP para calcular o frete antes de continuar.");
      document.getElementById("cep").focus();
      return;
    }

    definirBotaoCheckoutCarregando(botaoConfirmar, true);

    const metodoPagamento = form.querySelector('input[name="pagamento"]:checked')?.value;

    try {
      if (metodoPagamento === "pix") {
        await iniciarPagamentoPix(form);
      } else {
        await finalizarPedidoSimulado(form, metodoPagamento);
      }
    } finally {
      definirBotaoCheckoutCarregando(botaoConfirmar, false);
    }
  });
}

function coletarDadosCliente(form) {
  return {
    nome: form.querySelector("#nome").value.trim(),
    email: form.querySelector("#email").value.trim(),
    telefone: form.querySelector("#telefone").value.trim(),
    cep: form.querySelector("#cep").value.replace(/\D/g, ""),
    endereco: form.querySelector("#endereco").value.trim(),
    numero: form.querySelector("#numero").value.trim(),
    complemento: form.querySelector("#complemento")?.value.trim() || "",
    cidade: form.querySelector("#cidade").value.trim(),
    estado: form.querySelector("#estado").value.trim(),
  };
}

function coletarItensCarrinho() {
  return lerCarrinho().map((item) => ({
    produtoId: item.produtoId,
    quantidade: item.quantidade,
    tamanho: item.tamanho,
    cor: item.cor,
  }));
}

async function iniciarPagamentoPix(form) {
  abrirModalPix();
  mostrarEstadoModalPix("carregando");

  const dadosCliente = coletarDadosCliente(form);

  try {
    const resposta = await fetch("/api/checkout/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: dadosCliente,
        itens: coletarItensCarrinho(),
        tipoFrete: freteSelecionado ? freteSelecionado.tipo : null,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível gerar o pagamento Pix.");
    }

    preencherModalPix(dados);
    mostrarEstadoModalPix("conteudo");
    iniciarPollingStatusPedido(dados.pedidoId, dadosCliente.email);
  } catch (erro) {
    console.error("Erro ao iniciar pagamento Pix:", erro);
    document.querySelector("[data-modal-pix-erro-mensagem]").textContent =
      erro.message || "Erro inesperado. Tente novamente.";
    mostrarEstadoModalPix("erro");
  }
}

function preencherModalPix(dados) {
  const valorEl = document.querySelector("[data-modal-pix-valor]");
  const qrCodeEl = document.querySelector("[data-modal-pix-qrcode]");
  const codigoEl = document.querySelector("[data-modal-pix-codigo]");

  if (valorEl) valorEl.textContent = formatarPreco(dados.total);
  if (qrCodeEl) {
    const mimeType = dados.qrCodeMimeType || "image/png";
    qrCodeEl.src = `data:${mimeType};base64,${dados.qrCodeBase64}`;
  }
  if (codigoEl) codigoEl.textContent = dados.copiaECola;
  if (codigoEl) codigoEl.title = dados.copiaECola;

  const modal = document.querySelector("[data-modal-pix]");
  if (modal) modal.dataset.pedidoId = dados.pedidoId;
}

function mostrarEstadoModalPix(estado) {
  const blocos = {
    carregando: document.querySelector("[data-modal-pix-carregando]"),
    conteudo: document.querySelector("[data-modal-pix-conteudo]"),
    erro: document.querySelector("[data-modal-pix-erro]"),
    sucesso: document.querySelector("[data-modal-pix-sucesso]"),
  };

  Object.entries(blocos).forEach(([chave, elemento]) => {
    if (elemento) elemento.hidden = chave !== estado;
  });
}

function abrirModalPix() {
  const modal = document.querySelector("[data-modal-pix]");
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function fecharModalPix() {
  const modal = document.querySelector("[data-modal-pix]");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
  pararPollingStatusPedido();
}

function iniciarPollingStatusPedido(pedidoId, email) {
  pararPollingStatusPedido();

  pixPollingTimer = setInterval(async () => {
    try {
      const resposta = await fetch(`/api/pedidos/${pedidoId}/status`);
      if (!resposta.ok) return;

      const pedido = await resposta.json();

      if (pedido.status === "pago") {
        pararPollingStatusPedido();
        exibirSucessoPix(pedidoId, email, pedido.total);
      } else if (pedido.status === "cancelado") {
        pararPollingStatusPedido();
        document.querySelector("[data-modal-pix-erro-mensagem]").textContent =
          "O pagamento foi cancelado. Tente novamente.";
        mostrarEstadoModalPix("erro");
      }
    } catch (erro) {
      console.warn("Erro ao consultar status do pedido:", erro);
    }
  }, PIX_POLLING_INTERVALO_MS);
}

function pararPollingStatusPedido() {
  if (pixPollingTimer) {
    clearInterval(pixPollingTimer);
    pixPollingTimer = null;
  }
}

function exibirSucessoPix(pedidoId, email, total) {
  const numeroPedido = `EW${String(pedidoId).padStart(6, "0")}`;
  const numeroEl = document.querySelector("[data-modal-pix-numero-pedido]");
  if (numeroEl) numeroEl.textContent = numeroPedido;

  salvarPedidoLocal({
    numero: numeroPedido,
    email: email || "",
    total: Number(total) || subtotalCarrinho() + (freteSelecionado ? freteSelecionado.valor : 0),
    metodoPagamento: "pix",
    etapa: "pagamento-confirmado",
    criadoEm: new Date().toISOString(),
  });

  mostrarEstadoModalPix("sucesso");
  esvaziarCarrinho();
}

function inicializarModalPix() {
  const modal = document.querySelector("[data-modal-pix]");
  if (!modal) return;

  modal.querySelectorAll("[data-modal-pix-fechar]").forEach((botao) => {
    botao.addEventListener("click", fecharModalPix);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) {
      fecharModalPix();
    }
  });

  const botaoCopiar = document.querySelector("[data-modal-pix-copiar]");
  if (botaoCopiar) {
    botaoCopiar.addEventListener("click", async () => {
      const codigo = document.querySelector("[data-modal-pix-codigo]")?.textContent || "";
      try {
        await navigator.clipboard.writeText(codigo);
        botaoCopiar.textContent = "Copiado!";
        botaoCopiar.classList.add("is-copiado");
        setTimeout(() => {
          botaoCopiar.textContent = "Copiar Código Pix";
          botaoCopiar.classList.remove("is-copiado");
        }, 2000);
      } catch (erro) {
        console.warn("Não foi possível copiar o código Pix.", erro);
      }
    });
  }
}

function finalizarPedidoSimulado(form, metodoPagamento) {
  const numeroPedido = "EW" + Math.floor(100000 + Math.random() * 900000);
  const email = form?.querySelector("#email")?.value.trim() || "";

  salvarPedidoLocal({
    numero: numeroPedido,
    email,
    total: subtotalCarrinho() + (freteSelecionado ? freteSelecionado.valor : 0),
    metodoPagamento: metodoPagamento || "cartao",
    etapa: "pagamento-confirmado",
    criadoEm: new Date().toISOString(),
  });

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
  inicializarAutocompleteCep();
  inicializarFormularioCheckout();
  inicializarModalPix();
});
