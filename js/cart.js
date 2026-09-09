/**
 * Carrinho de compras — persistido em localStorage.
 * Protótipo front-end: não processa pagamento real.
 */
const CARRINHO_CHAVE = "ew_carrinho";
const FRETE_GRATIS_A_PARTIR_DE = 299;
const VALOR_FRETE_PADRAO = 29.9;

const CUPOM_CHAVE = "ew_cupom";
const CUPONS_VALIDOS = {
  PRIMEIRACOMPRA: 0.1,
  ESTANCIA10: 0.1,
};

let cupomAplicado = lerCupomSalvo();

function lerCupomSalvo() {
  try {
    const codigo = localStorage.getItem(CUPOM_CHAVE);
    return codigo && CUPONS_VALIDOS[codigo] ? codigo : null;
  } catch (erro) {
    return null;
  }
}

function percentualDesconto() {
  return cupomAplicado ? CUPONS_VALIDOS[cupomAplicado] : 0;
}

function valorDesconto() {
  return subtotalCarrinho() * percentualDesconto();
}

function inicializarCupom(aoAplicar) {
  const form = document.querySelector("[data-cupom-form]");
  if (!form) return;

  const campo = form.querySelector("[data-cupom-input]");
  const mensagemEl = document.querySelector("[data-cupom-mensagem]");

  if (cupomAplicado && campo) {
    campo.value = cupomAplicado;
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const codigoDigitado = (campo?.value || "").trim().toUpperCase();

    if (!codigoDigitado) return;

    if (CUPONS_VALIDOS[codigoDigitado]) {
      cupomAplicado = codigoDigitado;
      localStorage.setItem(CUPOM_CHAVE, codigoDigitado);
      if (mensagemEl) {
        mensagemEl.textContent = "Cupom aplicado com sucesso!";
        mensagemEl.className = "cupom-mensagem is-sucesso";
        mensagemEl.hidden = false;
      }
    } else {
      cupomAplicado = null;
      localStorage.removeItem(CUPOM_CHAVE);
      if (mensagemEl) {
        mensagemEl.textContent = "Cupom inválido.";
        mensagemEl.className = "cupom-mensagem is-erro";
        mensagemEl.hidden = false;
      }
    }

    if (typeof aoAplicar === "function") aoAplicar();
  });
}

function lerCarrinho() {
  try {
    const dados = localStorage.getItem(CARRINHO_CHAVE);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.warn("Não foi possível ler o carrinho salvo.", erro);
    return [];
  }
}

function salvarCarrinho(itens) {
  localStorage.setItem(CARRINHO_CHAVE, JSON.stringify(itens));
  atualizarBadgeCarrinho();
}

function chaveItem(produtoId, cor, tamanho) {
  return [produtoId, cor || "", tamanho || ""].join("|");
}

function adicionarAoCarrinho(
  produtoId,
  { cor = null, tamanho = null, quantidade = 1 } = {},
) {
  const produto =
    typeof buscarProdutoPorId === "function"
      ? buscarProdutoPorId(produtoId)
      : null;
  if (!produto) return lerCarrinho();

  const itens = lerCarrinho();
  const chave = chaveItem(produtoId, cor, tamanho);
  const existente = itens.find((item) => item.chave === chave);

  if (existente) {
    existente.quantidade += quantidade;
  } else {
    itens.push({
      chave,
      produtoId,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem || (produto.imagens && produto.imagens[0]) || PLACEHOLDER_IMG,
      cor,
      tamanho,
      quantidade,
    });
  }

  salvarCarrinho(itens);
  return itens;
}

function removerDoCarrinho(chave) {
  const itens = lerCarrinho().filter((item) => item.chave !== chave);
  salvarCarrinho(itens);
  return itens;
}

function atualizarQuantidade(chave, quantidade) {
  const itens = lerCarrinho();
  const item = itens.find((i) => i.chave === chave);
  if (!item) return itens;

  if (quantidade < 1) {
    return removerDoCarrinho(chave);
  }

  item.quantidade = quantidade;
  salvarCarrinho(itens);
  return itens;
}

function esvaziarCarrinho() {
  salvarCarrinho([]);
  cupomAplicado = null;
  localStorage.removeItem(CUPOM_CHAVE);
}

function totalItensCarrinho() {
  return lerCarrinho().reduce((total, item) => total + item.quantidade, 0);
}

function subtotalCarrinho() {
  return lerCarrinho().reduce(
    (total, item) => total + item.preco * item.quantidade,
    0,
  );
}

function valorFrete() {
  const subtotal = subtotalCarrinho();
  if (subtotal === 0) return 0;
  return subtotal >= FRETE_GRATIS_A_PARTIR_DE ? 0 : VALOR_FRETE_PADRAO;
}

function totalCarrinho() {
  return subtotalCarrinho() + valorFrete();
}

function atualizarBadgeCarrinho() {
  document.querySelectorAll("[data-carrinho-contador]").forEach((el) => {
    const total = totalItensCarrinho();
    el.textContent = total;
    el.hidden = total === 0;
  });
}

function renderizarPaginaCarrinho() {
  const lista = document.querySelector("[data-carrinho-lista]");
  const vazio = document.querySelector("[data-carrinho-vazio]");
  const resumo = document.querySelector("[data-carrinho-resumo]");
  if (!lista) return;

  const itens = lerCarrinho();

  if (itens.length === 0) {
    lista.hidden = true;
    if (resumo) resumo.hidden = true;
    if (vazio) vazio.hidden = false;
    return;
  }

  if (vazio) vazio.hidden = true;
  lista.hidden = false;
  if (resumo) resumo.hidden = false;

  lista.innerHTML = itens
    .map(
      (item) => `
    <div class="carrinho-item" data-chave="${item.chave}">
      <div class="carrinho-item__img">
        <img src="${item.imagem}" alt="${item.nome}" loading="lazy" width="88" height="100">
      </div>
      <div>
        <p class="carrinho-item__nome">${item.nome}</p>
        <p class="carrinho-item__variacao">${[item.cor ? `Cor: ${item.cor}` : "", item.tamanho ? `Tam: ${item.tamanho}` : ""].filter(Boolean).join(" · ") || "Padrão"}</p>
        <div class="produto-quantidade__controle" style="width:120px">
          <button type="button" data-diminuir aria-label="Diminuir quantidade">−</button>
          <input type="text" value="${item.quantidade}" readonly aria-label="Quantidade">
          <button type="button" data-aumentar aria-label="Aumentar quantidade">+</button>
        </div>
        <button type="button" class="carrinho-item__remover" data-remover>Remover</button>
      </div>
      <p class="carrinho-item__preco">${formatarPreco(item.preco * item.quantidade)}</p>
    </div>
  `,
    )
    .join("");

  lista.querySelectorAll("[data-chave]").forEach((linha) => {
    const chave = linha.dataset.chave;
    linha.querySelector("[data-aumentar]").addEventListener("click", () => {
      const item = lerCarrinho().find((i) => i.chave === chave);
      atualizarQuantidade(chave, item.quantidade + 1);
      renderizarPaginaCarrinho();
    });
    linha.querySelector("[data-diminuir]").addEventListener("click", () => {
      const item = lerCarrinho().find((i) => i.chave === chave);
      atualizarQuantidade(chave, item.quantidade - 1);
      renderizarPaginaCarrinho();
    });
    linha.querySelector("[data-remover]").addEventListener("click", () => {
      removerDoCarrinho(chave);
      renderizarPaginaCarrinho();
    });
  });

  atualizarResumoCarrinho();
}

function atualizarResumoCarrinho() {
  const subtotalEl = document.querySelector("[data-resumo-subtotal]");
  const freteEl = document.querySelector("[data-resumo-frete]");
  const totalEl = document.querySelector("[data-resumo-total]");
  const avisoFreteEl = document.querySelector("[data-resumo-aviso-frete]");
  const descontoLinhaEl = document.querySelector(
    "[data-resumo-desconto-linha]",
  );
  const descontoEl = document.querySelector("[data-resumo-desconto]");

  const subtotal = subtotalCarrinho();
  const frete = valorFrete();
  const desconto = valorDesconto();

  if (subtotalEl) subtotalEl.textContent = formatarPreco(subtotal);
  if (freteEl)
    freteEl.textContent = frete === 0 ? "Grátis" : formatarPreco(frete);
  if (totalEl) totalEl.textContent = formatarPreco(subtotal + frete - desconto);

  if (descontoLinhaEl) descontoLinhaEl.hidden = desconto <= 0;
  if (descontoEl) descontoEl.textContent = `-${formatarPreco(desconto)}`;

  if (avisoFreteEl) {
    const faltam = FRETE_GRATIS_A_PARTIR_DE - subtotal;
    avisoFreteEl.textContent =
      faltam > 0
        ? `Faltam ${formatarPreco(faltam)} para frete grátis!`
        : "Você garantiu frete grátis! 🎉";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarBadgeCarrinho();
  renderizarPaginaCarrinho();
  inicializarCupom(atualizarResumoCarrinho);
});
