/**
 * Checkout — integrado à API do backend (server/src).
 * Endereço via ViaCEP, pagamento Pix dinâmico via Mercado Pago (com modo simulação),
 * e polling de status até confirmação do pagamento.
 */

const PIX_POLLING_INTERVALO_MS = 3000;
let pixPollingTimer = null;
let pixContadorTimer = null;

const CARTAO_PARCELAS_MAXIMAS = 6;
const CARTAO_PARCELA_MINIMA = 10;

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
  const descontoLinhaEl = document.querySelector(
    "[data-resumo-desconto-linha]",
  );
  const descontoEl = document.querySelector("[data-resumo-desconto]");

  const subtotal = subtotalCarrinho();
  const valorFreteSelecionado = freteSelecionado ? freteSelecionado.valor : 0;
  const desconto = valorDesconto();

  if (subtotalEl) subtotalEl.textContent = formatarPreco(subtotal);

  if (descontoLinhaEl) descontoLinhaEl.hidden = desconto <= 0;
  if (descontoEl) descontoEl.textContent = `-${formatarPreco(desconto)}`;

  if (freteEl) {
    if (!freteSelecionado) {
      freteEl.textContent = "Calcule o CEP";
    } else if (freteSelecionado.gratis) {
      freteEl.textContent = "Grátis";
    } else {
      freteEl.textContent = formatarPreco(valorFreteSelecionado);
    }
  }

  const total = subtotal + valorFreteSelecionado - desconto;

  if (totalEl) totalEl.textContent = formatarPreco(total);

  atualizarOpcoesParcelas(total);

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

function atualizarOpcoesParcelas(total) {
  const campoParcelas = document.getElementById("cartao-parcelas");
  if (!campoParcelas) return;

  const valorSelecionado = campoParcelas.value;
  const maxParcelas = Math.max(
    1,
    Math.min(
      CARTAO_PARCELAS_MAXIMAS,
      Math.floor(total / CARTAO_PARCELA_MINIMA) || 1,
    ),
  );

  const opcoes = [];
  for (let parcela = 1; parcela <= maxParcelas; parcela += 1) {
    const valorParcela = total / parcela;
    const texto =
      parcela === 1
        ? `1x de ${formatarPreco(valorParcela)} à vista`
        : `${parcela}x de ${formatarPreco(valorParcela)} sem juros`;
    opcoes.push({ valor: String(parcela), texto });
  }

  campoParcelas.innerHTML = opcoes
    .map((opcao) => `<option value="${opcao.valor}">${opcao.texto}</option>`)
    .join("");

  const selecaoValida = opcoes.some(
    (opcao) => opcao.valor === valorSelecionado,
  );
  if (selecaoValida) {
    campoParcelas.value = valorSelecionado;
  }

  renderizarSeletorParcelasCustom(opcoes, campoParcelas.value);
}

function renderizarSeletorParcelasCustom(opcoes, valorAtual) {
  const wrapper = document.querySelector("[data-seletor-parcelas]");
  const menu = document.querySelector("[data-seletor-parcelas-menu]");
  const textoGatilho = document.querySelector("[data-seletor-parcelas-texto]");
  const campoParcelas = document.getElementById("cartao-parcelas");
  if (!wrapper || !menu || !campoParcelas) return;

  menu.innerHTML = opcoes
    .map(
      (opcao) => `
        <button type="button" class="seletor-parcelas-custom__opcao${opcao.valor === valorAtual ? " is-selecionada" : ""}" role="option" aria-selected="${opcao.valor === valorAtual}" data-valor="${opcao.valor}">
          ${opcao.texto}
        </button>
      `,
    )
    .join("");

  const selecionada = opcoes.find((opcao) => opcao.valor === valorAtual);
  if (textoGatilho && selecionada) {
    textoGatilho.textContent = selecionada.texto;
  }

  menu.querySelectorAll("[data-valor]").forEach((botao) => {
    botao.addEventListener("click", () => {
      campoParcelas.value = botao.dataset.valor;
      campoParcelas.dispatchEvent(new Event("change", { bubbles: true }));

      if (textoGatilho) textoGatilho.textContent = botao.textContent.trim();
      menu
        .querySelectorAll(".seletor-parcelas-custom__opcao")
        .forEach((el) => {
          el.classList.toggle("is-selecionada", el === botao);
          el.setAttribute("aria-selected", el === botao ? "true" : "false");
        });

      fecharSeletorParcelasCustom();
    });
  });
}

function abrirSeletorParcelasCustom() {
  const wrapper = document.querySelector("[data-seletor-parcelas]");
  const menu = document.querySelector("[data-seletor-parcelas-menu]");
  const gatilho = document.querySelector("[data-seletor-parcelas-gatilho]");
  if (!wrapper || !menu || !gatilho) return;

  wrapper.classList.add("is-aberto");
  menu.hidden = false;
  gatilho.setAttribute("aria-expanded", "true");
}

function fecharSeletorParcelasCustom() {
  const wrapper = document.querySelector("[data-seletor-parcelas]");
  const menu = document.querySelector("[data-seletor-parcelas-menu]");
  const gatilho = document.querySelector("[data-seletor-parcelas-gatilho]");
  if (!wrapper || !menu || !gatilho) return;

  wrapper.classList.remove("is-aberto");
  menu.hidden = true;
  gatilho.setAttribute("aria-expanded", "false");
}

function inicializarSeletorParcelasCustom() {
  const wrapper = document.querySelector("[data-seletor-parcelas]");
  const gatilho = document.querySelector("[data-seletor-parcelas-gatilho]");
  if (!wrapper || !gatilho) return;

  gatilho.addEventListener("click", () => {
    const aberto = wrapper.classList.contains("is-aberto");
    if (aberto) {
      fecharSeletorParcelasCustom();
    } else {
      abrirSeletorParcelasCustom();
    }
  });

  document.addEventListener("click", (evento) => {
    if (!wrapper.contains(evento.target)) {
      fecharSeletorParcelasCustom();
    }
  });

  wrapper.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      fecharSeletorParcelasCustom();
      gatilho.focus();
    }
  });
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

  container
    .querySelectorAll('input[name="frete-checkout-opcao"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        freteSelecionado =
          opcoesFreteCheckout.find((o) => o.tipo === input.value) || null;
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
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function aplicarMascaraTelefone(valor) {
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (digitos.length <= 2) return digitos.replace(/^(\d*)/, "($1");

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (digitos.length <= 10)
    return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5, 9)}`;
}

function aplicarMascaraCartaoNumero(valor) {
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 16);
  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function aplicarMascaraCartaoValidade(valor) {
  const digitos = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

function aplicarMascaraCartaoCvv(valor) {
  return String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 4);
}

function inicializarMascarasFormulario() {
  const campoTelefone = document.getElementById("telefone");
  const campoCartaoNumero = document.getElementById("cartao-numero");
  const campoCartaoValidade = document.getElementById("cartao-validade");
  const campoCartaoCvv = document.getElementById("cartao-cvv");

  if (campoTelefone) {
    campoTelefone.addEventListener("input", () => {
      campoTelefone.value = aplicarMascaraTelefone(campoTelefone.value);
    });
  }

  if (campoCartaoNumero) {
    campoCartaoNumero.addEventListener("input", () => {
      campoCartaoNumero.value = aplicarMascaraCartaoNumero(
        campoCartaoNumero.value,
      );
    });
  }

  if (campoCartaoValidade) {
    campoCartaoValidade.addEventListener("input", () => {
      campoCartaoValidade.value = aplicarMascaraCartaoValidade(
        campoCartaoValidade.value,
      );
    });
  }

  if (campoCartaoCvv) {
    campoCartaoCvv.addEventListener("input", () => {
      campoCartaoCvv.value = aplicarMascaraCartaoCvv(campoCartaoCvv.value);
    });
  }
}

function simularOpcoesFreteLocalCheckout(total) {
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
      { tipo: "SEDEX", valor: 39.9, prazo: "2 a 4 dias úteis", gratis: false },
    ],
  };
}

const IBGE_ESTADOS_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome";
const IBGE_MUNICIPIOS_URL = (uf) =>
  `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`;

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

async function carregarEstadosIbge(campoEstado) {
  try {
    const resposta = await fetch(IBGE_ESTADOS_URL);
    if (!resposta.ok)
      throw new Error("Resposta inesperada da API de estados do IBGE.");

    const estados = await resposta.json();

    campoEstado.innerHTML =
      `<option value="">Selecione o estado</option>` +
      estados
        .map(
          (estado) => `<option value="${estado.sigla}">${estado.nome}</option>`,
        )
        .join("");
  } catch (erro) {
    console.warn(
      "API do IBGE indisponível, não foi possível carregar os estados.",
      erro,
    );
    definirErroCampo(
      campoEstado,
      "Não foi possível carregar a lista de estados agora.",
    );
  }
}

async function carregarMunicipiosIbge(uf, campoCidade, cidadeParaSelecionar) {
  campoCidade.disabled = true;
  campoCidade.innerHTML = `<option value="">Carregando cidades...</option>`;

  if (!uf) {
    campoCidade.innerHTML = `<option value="">Selecione o estado primeiro</option>`;
    return;
  }

  try {
    const resposta = await fetch(IBGE_MUNICIPIOS_URL(uf));
    if (!resposta.ok)
      throw new Error("Resposta inesperada da API de municípios do IBGE.");

    const municipios = await resposta.json();

    campoCidade.innerHTML =
      `<option value="">Selecione a cidade</option>` +
      municipios
        .map(
          (municipio) =>
            `<option value="${municipio.nome}">${municipio.nome}</option>`,
        )
        .join("");
    campoCidade.disabled = false;

    if (cidadeParaSelecionar) {
      const alvo = normalizarTexto(cidadeParaSelecionar);
      const opcao = Array.from(campoCidade.options).find(
        (option) => normalizarTexto(option.value) === alvo,
      );
      if (opcao) campoCidade.value = opcao.value;
    }
  } catch (erro) {
    console.warn(
      "API do IBGE indisponível, não foi possível carregar as cidades.",
      erro,
    );
    campoCidade.innerHTML = `<option value="">Não foi possível carregar as cidades</option>`;
    definirErroCampo(
      campoCidade,
      "Não foi possível carregar a lista de cidades agora.",
    );
  }
}

function inicializarSeletoresEstadoCidade() {
  const campoEstado = document.getElementById("estado");
  const campoCidade = document.getElementById("cidade");
  if (!campoEstado || !campoCidade) return;

  carregarEstadosIbge(campoEstado);

  campoEstado.addEventListener("change", () => {
    definirErroCampo(campoCidade, "");
    carregarMunicipiosIbge(campoEstado.value, campoCidade);
  });
}

function inicializarAutocompleteCep() {
  const campoCep = document.getElementById("cep");
  if (!campoCep) return;

  const campoEndereco = document.getElementById("endereco");
  const campoBairro = document.getElementById("bairro");
  const campoCidade = document.getElementById("cidade");
  const campoEstado = document.getElementById("estado");
  const carregandoEl = document.querySelector(
    "[data-checkout-frete-carregando]",
  );

  const cepSalvo = localStorage.getItem("estancia_cep");
  if (cepSalvo) {
    campoCep.value = aplicarMascaraCep(cepSalvo);
  }

  campoCep.addEventListener("input", () => {
    campoCep.value = aplicarMascaraCep(campoCep.value);
  });

  async function aplicarEnderecoDoCep(endereco) {
    if (campoEndereco && endereco.logradouro) {
      campoEndereco.value = endereco.logradouro;
    }
    if (campoBairro) {
      campoBairro.value = endereco.bairro || "";
    }
    if (campoEstado && endereco.estado) {
      campoEstado.value = endereco.estado;
      await carregarMunicipiosIbge(
        endereco.estado,
        campoCidade,
        endereco.cidade,
      );
    }
  }

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

      await aplicarEnderecoDoCep(dados.endereco);

      enderecoConfirmado = {
        endereco: campoEndereco ? campoEndereco.value.trim() : "",
        cidade: campoCidade ? campoCidade.value.trim() : "",
        estado: campoEstado ? campoEstado.value.trim() : "",
        cep: cepLimpo,
      };

      renderizarOpcoesFreteCheckout(dados.opcoes);
    } catch (erro) {
      console.warn(
        "Backend de frete indisponível, usando simulação local.",
        erro,
      );
      definirErroCampo(campoCep, "");
      localStorage.setItem("estancia_cep", cepLimpo);
      enderecoConfirmado = {
        endereco: campoEndereco ? campoEndereco.value.trim() : "",
        cidade: campoCidade ? campoCidade.value.trim() : "",
        estado: campoEstado ? campoEstado.value.trim() : "",
        cep: cepLimpo,
      };
      const dadosSimulados =
        simularOpcoesFreteLocalCheckout(subtotalCarrinho());
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

    const camposObrigatorios = Array.from(
      form.querySelectorAll("[required]"),
    ).filter(
      (campo) =>
        !campo.closest("[data-pagamento-painel]") ||
        !campo.closest("[data-pagamento-painel]").hidden,
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
      definirErroCampo(
        document.getElementById("cep"),
        "Informe o CEP para calcular o frete antes de continuar.",
      );
      document.getElementById("cep").focus();
      return;
    }

    definirBotaoCheckoutCarregando(botaoConfirmar, true);

    const metodoPagamento = form.querySelector(
      'input[name="pagamento"]:checked',
    )?.value;

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
    bairro: form.querySelector("#bairro")?.value.trim() || "",
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
        cupom: typeof cupomAplicado !== "undefined" ? cupomAplicado : null,
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

  iniciarContadorExpiracaoPix(dados.expiraEm || 1800);
}

function formatarTempoContador(segundosRestantes) {
  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

function iniciarContadorExpiracaoPix(segundosIniciais) {
  pararContadorExpiracaoPix();

  const expiraEl = document.querySelector("[data-modal-pix-expira]");
  if (!expiraEl) return;

  let segundosRestantes = segundosIniciais;

  const atualizar = () => {
    if (segundosRestantes <= 0) {
      expiraEl.textContent = "Este código Pix expirou.";
      pararContadorExpiracaoPix();
      return;
    }
    expiraEl.textContent = `Este código expira em ${formatarTempoContador(segundosRestantes)}`;
    segundosRestantes -= 1;
  };

  atualizar();
  pixContadorTimer = setInterval(atualizar, 1000);
}

function pararContadorExpiracaoPix() {
  if (pixContadorTimer) {
    clearInterval(pixContadorTimer);
    pixContadorTimer = null;
  }
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
  pararContadorExpiracaoPix();
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
  pararContadorExpiracaoPix();

  const numeroPedido = `EW${String(pedidoId).padStart(6, "0")}`;
  const numeroEl = document.querySelector("[data-modal-pix-numero-pedido]");
  if (numeroEl) numeroEl.textContent = numeroPedido;

  salvarPedidoLocal({
    numero: numeroPedido,
    email: email || "",
    total:
      Number(total) ||
      subtotalCarrinho() +
        (freteSelecionado ? freteSelecionado.valor : 0) -
        valorDesconto(),
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
      const codigo =
        document.querySelector("[data-modal-pix-codigo]")?.textContent || "";
      try {
        await navigator.clipboard.writeText(codigo);
        botaoCopiar.textContent = "Código copiado!";
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
  const parcelas =
    metodoPagamento === "cartao"
      ? Number(form?.querySelector("#cartao-parcelas")?.value) || 1
      : 1;

  salvarPedidoLocal({
    numero: numeroPedido,
    email,
    total:
      subtotalCarrinho() +
      (freteSelecionado ? freteSelecionado.valor : 0) -
      valorDesconto(),
    metodoPagamento: metodoPagamento || "cartao",
    parcelas,
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
  inicializarSeletoresEstadoCidade();
  inicializarAutocompleteCep();
  inicializarMascarasFormulario();
  inicializarSeletorParcelasCustom();
  inicializarFormularioCheckout();
  inicializarModalPix();
  inicializarCupom(atualizarResumoCheckout);
});
