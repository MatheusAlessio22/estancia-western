/**
 * Comportamentos globais: menu mobile, busca, newsletter,
 * ano do rodapé e renderização de vitrines de produto.
 */

let elementoAntesDoMenuMobile = null;
let elementoAntesDaBusca = null;

function elementosFocaveis(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled])',
    ),
  ).filter((el) => el.offsetParent !== null);
}

function prenderFoco(container, evento) {
  if (evento.key !== "Tab") return;
  const focaveis = elementosFocaveis(container);
  if (focaveis.length === 0) return;

  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];

  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primeiro.focus();
  }
}

function alternarMenuMobile(abrir) {
  const menu = document.querySelector("[data-menu-mobile]");
  const overlay = document.querySelector("[data-overlay-fundo]");
  if (!menu) return;
  if (menu.classList.contains("is-aberto") === abrir) return;

  menu.classList.toggle("is-aberto", abrir);
  if (overlay) overlay.hidden = !abrir;
  document.body.style.overflow = abrir ? "hidden" : "";

  if (abrir) {
    elementoAntesDoMenuMobile = document.activeElement;
    const fechar = menu.querySelector("[data-fechar-menu]");
    if (fechar) fechar.focus();
  } else if (elementoAntesDoMenuMobile) {
    elementoAntesDoMenuMobile.focus();
    elementoAntesDoMenuMobile = null;
  }
}

function renderizarResultadosBusca(termo) {
  const resultadosEl = document.querySelector("[data-busca-resultados]");
  if (!resultadosEl) return;

  const termoLimpo = termo.trim().toLowerCase();

  if (!termoLimpo) {
    resultadosEl.innerHTML = "";
    resultadosEl.hidden = true;
    return;
  }

  const encontrados =
    typeof PRODUTOS !== "undefined"
      ? PRODUTOS.filter((p) => p.nome.toLowerCase().includes(termoLimpo)).slice(0, 6)
      : [];

  resultadosEl.hidden = false;

  if (encontrados.length === 0) {
    resultadosEl.innerHTML = `
      <div class="busca-resultados__vazio">
        <p>Não encontramos produtos para esta busca.</p>
        <a href="/pages/categoria.html?cat=lancamentos" class="btn btn--secundario btn--pequeno">Ver novidades</a>
      </div>
    `;
    return;
  }

  resultadosEl.innerHTML = `
    <ul class="busca-resultados__lista">
      ${encontrados
        .map(
          (p) => `
        <li>
          <a href="/pages/produto.html?id=${p.id}" class="foco-visivel">
            <img src="${PLACEHOLDER_IMG}" alt="" width="48" height="56" loading="lazy">
            <span>
              <span class="busca-resultados__nome">${p.nome}</span>
              <span class="busca-resultados__preco">${formatarPreco(p.preco)}</span>
            </span>
          </a>
        </li>
      `,
        )
        .join("")}
    </ul>
  `;
}

function alternarBusca(abrir) {
  const busca = document.querySelector("[data-busca-overlay]");
  const botaoAbrir = document.querySelector("[data-abrir-busca]");
  if (!busca) return;
  if (!busca.hidden === abrir) return;

  busca.hidden = !abrir;
  if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", abrir ? "true" : "false");

  if (abrir) {
    elementoAntesDaBusca = document.activeElement;
    const input = busca.querySelector("[data-busca-input]");
    if (input) {
      input.value = "";
      input.focus();
    }
    renderizarResultadosBusca("");
  } else if (elementoAntesDaBusca) {
    elementoAntesDaBusca.focus();
    elementoAntesDaBusca = null;
  }
}

function alternarDropdownCategorias(abrir) {
  const toggle = document.querySelector("[data-abrir-categorias]");
  const menu = document.querySelector("[data-menu-categorias]");
  if (!toggle || !menu) return;

  menu.hidden = !abrir;
  toggle.setAttribute("aria-expanded", abrir ? "true" : "false");

  if (abrir) {
    menu.innerHTML =
      typeof CATEGORIAS !== "undefined"
        ? CATEGORIAS.map(
            (c) =>
              `<li><a href="/pages/categoria.html?cat=${c.slug}" class="foco-visivel">${c.nome}</a></li>`,
          ).join("")
        : "";
  }
}

function inicializarHeader() {
  document.querySelectorAll("[data-abrir-menu]").forEach((btn) => {
    btn.addEventListener("click", () => alternarMenuMobile(true));
  });
  document.querySelectorAll("[data-fechar-menu]").forEach((btn) => {
    btn.addEventListener("click", () => alternarMenuMobile(false));
  });
  document.querySelectorAll("[data-abrir-busca]").forEach((btn) => {
    btn.addEventListener("click", () => alternarBusca(true));
  });
  document.querySelectorAll("[data-fechar-busca]").forEach((btn) => {
    btn.addEventListener("click", () => alternarBusca(false));
  });
  const overlay = document.querySelector("[data-overlay-fundo]");
  if (overlay)
    overlay.addEventListener("click", () => alternarMenuMobile(false));

  const menuMobile = document.querySelector("[data-menu-mobile]");
  if (menuMobile) {
    menuMobile.addEventListener("keydown", (evento) => prenderFoco(menuMobile, evento));
  }

  const buscaOverlay = document.querySelector("[data-busca-overlay]");
  if (buscaOverlay) {
    buscaOverlay.addEventListener("click", (evento) => {
      if (evento.target === buscaOverlay) alternarBusca(false);
    });
    const buscaCaixa = buscaOverlay.querySelector(".busca-caixa");
    buscaCaixa.addEventListener("keydown", (evento) => prenderFoco(buscaCaixa, evento));

    const buscaForm = buscaOverlay.querySelector("[data-busca-form]");
    const buscaInput = buscaOverlay.querySelector("[data-busca-input]");
    buscaForm.addEventListener("submit", (evento) => {
      evento.preventDefault();
      renderizarResultadosBusca(buscaInput.value);
    });
    buscaInput.addEventListener("input", () => {
      renderizarResultadosBusca(buscaInput.value);
    });
  }

  // Dropdown de categorias (desktop) — clique para abrir/fechar, Esc e clique fora fecham.
  const toggleCategorias = document.querySelector("[data-abrir-categorias]");
  const menuCategorias = document.querySelector("[data-menu-categorias]");
  if (toggleCategorias && menuCategorias) {
    toggleCategorias.addEventListener("click", () => {
      alternarDropdownCategorias(menuCategorias.hidden);
    });

    document.addEventListener("click", (evento) => {
      if (menuCategorias.hidden) return;
      const dentro =
        toggleCategorias.contains(evento.target) || menuCategorias.contains(evento.target);
      if (!dentro) alternarDropdownCategorias(false);
    });

    document.addEventListener("focusin", (evento) => {
      if (menuCategorias.hidden) return;
      const dentro =
        toggleCategorias.contains(evento.target) || menuCategorias.contains(evento.target);
      if (!dentro) alternarDropdownCategorias(false);
    });
  }

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    alternarMenuMobile(false);
    alternarBusca(false);
    alternarDropdownCategorias(false);
  });
}

function inicializarNewsletter() {
  const forms = document.querySelectorAll("[data-newsletter-form]");
  forms.forEach((form) => {
    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const aviso = form.parentElement.querySelector("[data-newsletter-aviso]");
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());

      if (!aviso) return;

      if (!emailValido) {
        aviso.textContent = "Digite um e-mail válido.";
        aviso.className = "newsletter__aviso erro";
        return;
      }

      // Integração futura: enviar `input.value` para Mailchimp/RD Station.
      aviso.textContent = "Cadastro realizado! Fique de olho no seu e-mail. 🤠";
      aviso.className = "newsletter__aviso sucesso";
      form.reset();
    });
  });
}

function cartaoProdutoHTML(produto) {
  const precoDe = produto.precoDe
    ? `<span class="card-produto__preco-de">${formatarPreco(produto.precoDe)}</span>`
    : "";
  const selo = produto.selo
    ? `<span class="card-produto__selo">${produto.selo}</span>`
    : "";
  const parcelas = produto.parcelas
    ? `<span class="card-produto__parcelas">${produto.parcelas}</span>`
    : "";
  const urlProduto = `/pages/produto.html?id=${produto.id}`;

  return `
    <article class="card-produto">
      <div class="card-produto__imagem">
        ${selo}
        <img src="${PLACEHOLDER_IMG}" alt="${produto.nome}" loading="lazy" width="480" height="600">
      </div>
      <div class="card-produto__corpo">
        <span class="card-produto__categoria">${nomeCategoria(produto.categoria)}</span>
        <h3 class="card-produto__nome">
          <a href="${urlProduto}" class="card-produto__link">${produto.nome}</a>
        </h3>
        <div class="card-produto__preco">
          ${precoDe}
          <span class="card-produto__preco-por">${formatarPreco(produto.preco)}</span>
        </div>
        ${parcelas}
        <button type="button" class="btn btn--secundario btn--pequeno card-produto__btn" data-adicionar-rapido="${produto.id}">
          Adicionar ao Carrinho
        </button>
      </div>
    </article>
  `;
}

function renderizarVitrines() {
  const grids = [
    { seletor: "[data-grid-lancamentos]", filtro: (p) => p.novo, limite: 8 },
    {
      seletor: "[data-grid-mais-vendidos]",
      filtro: (p) => p.maisVendido,
      limite: 8,
    },
  ];

  grids.forEach(({ seletor, filtro, limite }) => {
    const container = document.querySelector(seletor);
    if (!container || typeof PRODUTOS === "undefined") return;
    const produtos = PRODUTOS.filter(filtro).slice(0, limite);
    container.innerHTML = produtos.map(cartaoProdutoHTML).join("");
  });

  document.querySelectorAll("[data-adicionar-rapido]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.adicionarRapido;
      btn.classList.add("is-carregando");
      const itens = adicionarAoCarrinho(id, { quantidade: 1 });
      const itemAdicionado = itens.find(
        (item) => item.chave === `${id}||`,
      );
      btn.classList.remove("is-carregando");
      abrirDrawerCarrinho(itemAdicionado);
    });
  });
}

function mostrarToast(mensagem) {
  let toast = document.querySelector("[data-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("data-toast", "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("is-visivel");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("is-visivel"), 2500);
}

function inicializarAnoRodape() {
  document.querySelectorAll("[data-ano-atual]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarHeader();
  inicializarNewsletter();
  renderizarVitrines();
  inicializarAnoRodape();
});
