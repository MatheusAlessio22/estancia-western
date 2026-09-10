/**
 * Galeria de produto — thumbnails, fade de troca, zoom e modal ampliado.
 * Carregado apenas em pages/produto.html, depois de produto-variacoes.js.
 *
 * DEV: não há fotos reais por produto no catálogo mock (js/products.js).
 * Convenção esperada quando o cliente enviar fotos: `produto.imagens` como
 * array de URLs (uma por foto, ordem = ordem de exibição), por exemplo:
 *   imagens: [
 *     "/assets/images/produtos/p01-camisa-xadrez-01.jpg",
 *     "/assets/images/produtos/p01-camisa-xadrez-02.jpg",
 *   ]
 * Nome de arquivo sugerido: "{id-do-produto}-{slug-do-nome}-{indice}.jpg".
 * Até essa integração existir, todas as fotos caem no mesmo placeholder e o
 * número de thumbnails é fixado em `TOTAL_FOTOS_PLACEHOLDER`.
 */

const TOTAL_FOTOS_PLACEHOLDER = 4;

function renderizarGaleria(produto) {
  const principalContainer = document.querySelector(
    "[data-galeria-principal-container]",
  );
  const imagemPrincipal = document.querySelector("[data-galeria-principal]");
  const thumbsContainer = document.querySelector("[data-galeria-thumbs]");
  if (!imagemPrincipal || !thumbsContainer) return;

  const imagens =
    Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? produto.imagens
      : produto.imagem
        ? [produto.imagem]
        : Array.from({ length: TOTAL_FOTOS_PLACEHOLDER }, () => PLACEHOLDER_IMG);

  let indiceAtual = 0;

  imagemPrincipal.src = imagens[0];
  imagemPrincipal.alt = `${produto.nome} — foto 1 de ${imagens.length}`;

  thumbsContainer.innerHTML = imagens
    .map(
      (_, i) => `
        <button
          type="button"
          class="foco-visivel ${i === 0 ? "is-ativo" : ""}"
          data-thumb="${i}"
          aria-label="Ver foto ${i + 1} de ${imagens.length}"
          aria-current="${i === 0 ? "true" : "false"}"
        >
          <img src="${imagens[i]}" alt="" loading="${i === 0 ? "eager" : "lazy"}" width="72" height="72">
        </button>
      `,
    )
    .join("");

  function trocarImagem(indice) {
    if (indice === indiceAtual) return;
    indice = ((indice % imagens.length) + imagens.length) % imagens.length;

    const novaUrl = imagens[indice];
    const imagemNova = new Image();

    principalContainer.classList.add("is-carregando");

    imagemNova.onload = () => {
      imagemPrincipal.src = novaUrl;
      imagemPrincipal.alt = `${produto.nome} — foto ${indice + 1} de ${imagens.length}`;
      principalContainer.classList.remove("is-carregando");
      principalContainer.classList.remove("is-trocando");
      // Força reflow para poder reexecutar o fade em trocas consecutivas.
      void imagemPrincipal.offsetWidth;
      principalContainer.classList.add("is-trocando");
    };
    imagemNova.onerror = () => {
      principalContainer.classList.remove("is-carregando");
    };
    imagemNova.src = novaUrl;

    thumbsContainer.querySelectorAll("[data-thumb]").forEach((btn, i) => {
      btn.classList.toggle("is-ativo", i === indice);
      btn.setAttribute("aria-current", i === indice ? "true" : "false");
    });

    indiceAtual = indice;
  }

  thumbsContainer.querySelectorAll("[data-thumb]").forEach((btn) => {
    btn.addEventListener("click", () => {
      trocarImagem(Number(btn.dataset.thumb));
    });
  });

  // Swipe horizontal em mobile, sem interferir na rolagem vertical da página.
  let toqueInicioX = 0;
  let toqueInicioY = 0;

  principalContainer.addEventListener(
    "touchstart",
    (evento) => {
      toqueInicioX = evento.touches[0].clientX;
      toqueInicioY = evento.touches[0].clientY;
    },
    { passive: true },
  );

  principalContainer.addEventListener(
    "touchend",
    (evento) => {
      const deltaX = evento.changedTouches[0].clientX - toqueInicioX;
      const deltaY = evento.changedTouches[0].clientY - toqueInicioY;

      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

      trocarImagem(indiceAtual + (deltaX < 0 ? 1 : -1));
    },
    { passive: true },
  );

  // Zoom por clique (acessível via mouse, teclado e toque — sem depender de hover).
  imagemPrincipal.addEventListener("click", () => {
    abrirModalZoom(imagens, indiceAtual, produto.nome);
  });
  imagemPrincipal.setAttribute("tabindex", "0");
  imagemPrincipal.setAttribute("role", "button");
  imagemPrincipal.setAttribute("aria-label", "Ampliar imagem do produto");
  imagemPrincipal.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrirModalZoom(imagens, indiceAtual, produto.nome);
    }
  });

  return {
    obterIndiceAtual: () => indiceAtual,
  };
}

/* ---- Modal de zoom (mesmo padrão de foco/Esc/overlay do drawer de carrinho) ---- */

const MODAL_ZOOM_HTML = `
  <div class="modal-zoom__overlay" data-modal-zoom-overlay hidden></div>
  <div class="modal-zoom" data-modal-zoom role="dialog" aria-modal="true" aria-label="Imagem ampliada do produto" hidden>
    <button type="button" class="btn-icone modal-zoom__fechar foco-visivel" data-modal-zoom-fechar aria-label="Fechar imagem ampliada">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <img data-modal-zoom-imagem src="" alt="">
  </div>
`;

let modalZoomInicializado = false;
let elementoQueAbriuModalZoom = null;

function inicializarModalZoom() {
  if (modalZoomInicializado) return;
  modalZoomInicializado = true;

  const host = document.createElement("div");
  host.innerHTML = MODAL_ZOOM_HTML;
  document.body.appendChild(host);

  const overlay = document.querySelector("[data-modal-zoom-overlay]");
  const modal = document.querySelector("[data-modal-zoom]");
  const fechar = () => fecharModalZoom();

  overlay.addEventListener("click", fechar);
  document
    .querySelector("[data-modal-zoom-fechar]")
    .addEventListener("click", fechar);

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    if (modal.hidden) return;
    fechar();
  });

  modal.addEventListener("keydown", (evento) => {
    if (evento.key !== "Tab") return;
    evento.preventDefault();
    document.querySelector("[data-modal-zoom-fechar]").focus();
  });
}

function abrirModalZoom(imagens, indice, nomeProduto) {
  inicializarModalZoom();
  elementoQueAbriuModalZoom = document.activeElement;

  const overlay = document.querySelector("[data-modal-zoom-overlay]");
  const modal = document.querySelector("[data-modal-zoom]");
  const imagemEl = document.querySelector("[data-modal-zoom-imagem]");

  imagemEl.src = imagens[indice];
  imagemEl.alt = `${nomeProduto} — imagem ampliada`;

  overlay.hidden = false;
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add("is-visivel");
      modal.classList.add("is-aberto");
      document.querySelector("[data-modal-zoom-fechar]").focus();
    });
  });
}

function fecharModalZoom() {
  const overlay = document.querySelector("[data-modal-zoom-overlay]");
  const modal = document.querySelector("[data-modal-zoom]");
  if (!modal || modal.hidden) return;

  overlay.classList.remove("is-visivel");
  modal.classList.remove("is-aberto");
  document.body.style.overflow = "";

  const duracaoMotion = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-duracao-lenta")
    .trim();
  const duracaoMs = parseFloat(duracaoMotion) || 320;

  window.setTimeout(() => {
    overlay.hidden = true;
    modal.hidden = true;
  }, duracaoMs);

  if (elementoQueAbriuModalZoom && typeof elementoQueAbriuModalZoom.focus === "function") {
    elementoQueAbriuModalZoom.focus();
  }
  elementoQueAbriuModalZoom = null;
}
