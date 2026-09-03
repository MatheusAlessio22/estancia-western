/**
 * Drawer lateral de confirmação de carrinho — componente global.
 * Carregado em todas as páginas, depois de cart.js e antes de main.js.
 * Uso: abrirDrawerCarrinho({ imagem, nome, cor, tamanho, quantidade, preco }).
 */

const DRAWER_HTML = `
  <div class="carrinho-drawer__overlay" data-drawer-overlay hidden></div>
  <aside class="carrinho-drawer" data-drawer-carrinho role="dialog" aria-modal="true" aria-labelledby="drawer-carrinho-titulo" hidden>
    <div class="carrinho-drawer__topo">
      <h2 id="drawer-carrinho-titulo">Produto adicionado à sacola</h2>
      <button type="button" class="btn-icone foco-visivel" data-drawer-fechar aria-label="Fechar carrinho">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div data-drawer-corpo>
      <div class="carrinho-drawer__item" data-drawer-item hidden>
        <div class="carrinho-drawer__item-img">
          <img data-drawer-imagem src="" alt="" width="88" height="100">
        </div>
        <div class="carrinho-drawer__item-info">
          <p class="carrinho-drawer__item-nome" data-drawer-nome></p>
          <p class="carrinho-drawer__item-variacao" data-drawer-variacao></p>
          <p class="carrinho-drawer__item-qtd" data-drawer-qtd></p>
          <p class="carrinho-drawer__item-preco" data-drawer-preco></p>
        </div>
      </div>

      <div class="carrinho-drawer__subtotal" data-drawer-subtotal-linha>
        <span>Subtotal da sacola</span>
        <strong data-drawer-subtotal></strong>
      </div>

      <div class="carrinho-drawer__vazio" data-drawer-vazio hidden>
        <p>Sua sacola está vazia.</p>
        <a href="/index.html" class="btn btn--primario">Ver produtos</a>
      </div>
    </div>

    <div class="carrinho-drawer__acoes" data-drawer-acoes>
      <a href="/pages/carrinho.html" class="btn btn--primario btn--bloco">Ir para o carrinho</a>
      <button type="button" class="btn btn--secundario btn--bloco" data-drawer-continuar>Continuar comprando</button>
    </div>
  </aside>
`;

let drawerInicializado = false;
let elementoQueAbriuDrawer = null;

function inicializarDrawerCarrinho() {
  if (drawerInicializado) return;
  drawerInicializado = true;

  const host = document.createElement("div");
  host.innerHTML = DRAWER_HTML;
  document.body.appendChild(host);

  const overlay = document.querySelector("[data-drawer-overlay]");
  const drawer = document.querySelector("[data-drawer-carrinho]");

  const fechar = () => fecharDrawerCarrinho();

  overlay.addEventListener("click", fechar);
  document
    .querySelector("[data-drawer-fechar]")
    .addEventListener("click", fechar);
  document
    .querySelector("[data-drawer-continuar]")
    .addEventListener("click", fechar);

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    if (drawer.hidden) return;
    fechar();
  });

  drawer.addEventListener("keydown", (evento) => {
    if (evento.key !== "Tab") return;

    const focaveis = Array.from(
      drawer.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled])',
      ),
    ).filter((el) => el.offsetParent !== null);

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
  });
}

function preencherDrawer(item) {
  const itemBloco = document.querySelector("[data-drawer-item]");
  const vazioBloco = document.querySelector("[data-drawer-vazio]");
  const subtotalLinha = document.querySelector("[data-drawer-subtotal-linha]");
  const acoes = document.querySelector("[data-drawer-acoes]");

  if (!item) {
    itemBloco.hidden = true;
    subtotalLinha.hidden = true;
    acoes.hidden = true;
    vazioBloco.hidden = false;
    return;
  }

  vazioBloco.hidden = true;
  acoes.hidden = false;
  subtotalLinha.hidden = false;
  itemBloco.hidden = false;

  const imagemEl = document.querySelector("[data-drawer-imagem]");
  imagemEl.src = item.imagem || PLACEHOLDER_IMG;
  imagemEl.alt = item.nome;

  document.querySelector("[data-drawer-nome]").textContent = item.nome;

  const variacaoTexto = [
    item.cor ? `Cor: ${typeof nomeCor === "function" ? nomeCor(item.cor) : item.cor}` : "",
    item.tamanho ? `Tam: ${item.tamanho}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  document.querySelector("[data-drawer-variacao]").textContent =
    variacaoTexto || "Padrão";

  document.querySelector("[data-drawer-qtd]").textContent =
    `Quantidade: ${item.quantidade}`;
  document.querySelector("[data-drawer-preco]").textContent = formatarPreco(
    item.preco * item.quantidade,
  );

  document.querySelector("[data-drawer-subtotal]").textContent =
    formatarPreco(subtotalCarrinho());
}

function abrirDrawerCarrinho(item) {
  inicializarDrawerCarrinho();
  preencherDrawer(item);

  elementoQueAbriuDrawer = document.activeElement;

  const overlay = document.querySelector("[data-drawer-overlay]");
  const drawer = document.querySelector("[data-drawer-carrinho]");

  overlay.hidden = false;
  drawer.hidden = false;
  document.body.style.overflow = "hidden";

  // Duplo rAF garante que o navegador aplique o estado inicial (hidden→visível)
  // antes de ativar a classe que dispara a transição de slide/fade.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-visivel");
      drawer.classList.add("is-aberto");
      document.querySelector("[data-drawer-fechar]").focus();
    });
  });
}

function fecharDrawerCarrinho() {
  const overlay = document.querySelector("[data-drawer-overlay]");
  const drawer = document.querySelector("[data-drawer-carrinho]");
  if (!drawer || drawer.hidden) return;

  overlay.classList.remove("is-visivel");
  drawer.classList.remove("is-aberto");
  document.body.style.overflow = "";

  const aoTerminar = () => {
    overlay.hidden = true;
    drawer.hidden = true;
  };

  const duracaoMotion = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-duracao-lenta")
    .trim();
  const duracaoMs = parseFloat(duracaoMotion) || 320;

  window.setTimeout(aoTerminar, duracaoMs);

  if (elementoQueAbriuDrawer && typeof elementoQueAbriuDrawer.focus === "function") {
    elementoQueAbriuDrawer.focus();
  }
  elementoQueAbriuDrawer = null;
}
