/**
 * Header e footer compartilhados entre todas as páginas.
 * Injetados de forma síncrona (sem fetch) para funcionar em qualquer servidor estático.
 */
const WHATSAPP_LINK = "https://wa.me/5546999244179";

function estrelaSVG() {
  return '<svg viewBox="0 0 20 20"><polygon points="10,1 12.5,7 19,7.5 14,12 15.5,18.5 10,15 4.5,18.5 6,12 1,7.5 7.5,7"/></svg>';
}

function HEADER_HTML(paginaAtiva = "") {
  const itemNav = (href, label, chave) =>
    `<li><a href="${href}" ${paginaAtiva === chave ? "aria-current='page'" : ""}>${label}</a></li>`;

  return `
    <header class="header">
      <div class="header__topo">Frete grátis para todo o Brasil em compras acima de R$ 299</div>
      <div class="container header__principal">
        <button type="button" class="btn-icone header__menu-toggle" data-abrir-menu aria-label="Abrir menu">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <a href="/index.html" class="header__logo">
          <img src="/assets/logos/logo-transparente-marrom.png" alt="Estância Western — Moda Country">
        </a>

        <nav class="header__nav" aria-label="Navegação principal">
          <ul>
            ${itemNav("/pages/categoria.html?cat=lancamentos", "Lançamentos", "lancamentos")}
            <li class="header__nav-item-dropdown">
              <button type="button" class="header__nav-dropdown-toggle foco-visivel" data-abrir-categorias aria-expanded="false" aria-haspopup="true" aria-controls="menu-categorias">
                Categorias
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><polyline points="6,9 12,15 18,9"/></svg>
              </button>
              <ul class="header__dropdown-categorias" id="menu-categorias" data-menu-categorias hidden></ul>
            </li>
            ${itemNav("/pages/categoria.html?cat=promocoes", "Promoções", "promocoes")}
          </ul>
        </nav>

        <div class="header__acoes">
          <button type="button" class="btn-icone" data-abrir-busca aria-label="Buscar" aria-haspopup="true" aria-expanded="false">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <a href="/pages/conta.html" class="btn-icone" aria-label="Minha conta">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
          <a href="/pages/carrinho.html" class="btn-icone" aria-label="Carrinho de compras">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="header__carrinho-contador" data-carrinho-contador hidden>0</span>
          </a>
        </div>
      </div>
    </header>

    <div class="overlay-fundo" data-overlay-fundo hidden></div>

    <nav class="menu-mobile" data-menu-mobile aria-label="Menu mobile">
      <button type="button" class="btn-icone menu-mobile__fechar foco-visivel" data-fechar-menu aria-label="Fechar menu">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <ul>
        <li><a href="/pages/categoria.html?cat=lancamentos" class="foco-visivel">Lançamentos</a></li>
        <li><a href="/pages/categoria.html?cat=camisas" class="foco-visivel">Camisas</a></li>
        <li><a href="/pages/categoria.html?cat=calcas-jeans" class="foco-visivel">Jeans</a></li>
        <li><a href="/pages/categoria.html?cat=botas-calcados" class="foco-visivel">Botas</a></li>
        <li><a href="/pages/categoria.html?cat=chapeus-bones" class="foco-visivel">Chapéus &amp; Bonés</a></li>
        <li><a href="/pages/categoria.html?cat=cintos-fivelas" class="foco-visivel">Cintos &amp; Fivelas</a></li>
        <li><a href="/pages/categoria.html?cat=acessorios" class="foco-visivel">Acessórios</a></li>
        <li><a href="/pages/sobre.html" class="foco-visivel">Sobre Nós</a></li>
        <li><a href="/pages/contato.html" class="foco-visivel">Fale Conosco</a></li>
      </ul>
    </nav>

    <div class="busca-overlay" data-busca-overlay hidden>
      <div class="busca-caixa" role="dialog" aria-modal="true" aria-label="Buscar produtos">
        <form role="search" data-busca-form>
          <input type="search" placeholder="O que você procura?" aria-label="Buscar produtos" data-busca-input>
          <button type="submit" class="btn btn--primario">Buscar</button>
        </form>
        <button type="button" class="btn-icone busca-caixa__fechar foco-visivel" data-fechar-busca aria-label="Fechar busca">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="busca-resultados" data-busca-resultados></div>
      </div>
    </div>
  `;
}

function FOOTER_HTML() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="grid footer__grid">
          <div class="footer__marca">
            <img src="/assets/logos/logo-transparente-bege.png" alt="Estância Western" style="height:44px;width:auto;">
            <p>Moda country autêntica, inspirada na tradição do campo. Vista a alma do campo com a Estância Western.</p>
            <div class="footer__redes" style="margin-top:var(--espaco-4);">
              <a href="https://www.instagram.com/estancia.western" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg></a>
            </div>
          </div>
          <div class="footer__coluna">
            <h4>Institucional</h4>
            <ul>
              <li><a href="/pages/sobre.html">Sobre Nós</a></li>
              <li><a href="/pages/politicas.html#trocas">Política de Trocas e Devoluções</a></li>
              <li><a href="/pages/politicas.html#privacidade">Política de Privacidade</a></li>
              <li><a href="/pages/politicas.html#termos">Termos de Uso</a></li>
              <li><a href="/pages/contato.html">Trabalhe Conosco</a></li>
            </ul>
          </div>
          <div class="footer__coluna">
            <h4>Atendimento</h4>
            <ul>
              <li><a href="/pages/contato.html">Central de Ajuda</a></li>
              <li><a href="/pages/contato.html">Fale Conosco</a></li>
              <li><a href="${WHATSAPP_LINK}" target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a href="/pages/conta.html">Rastreie seu Pedido</a></li>
            </ul>
          </div>
          <div class="footer__coluna">
            <h4>Formas de Pagamento</h4>
            <div class="footer__pagamentos">
              <span>Visa</span><span>Mastercard</span><span>Elo</span><span>Pix</span><span>Boleto</span>
            </div>
            <h4 style="margin-top:var(--espaco-5);">Compra 100% Segura</h4>
          </div>
        </div>
        <div class="footer__base">
          <span>&copy; <span data-ano-atual>2026</span> Estância Western — Moda Country. Todos os direitos reservados.</span>
          <span>CNPJ 66.510.101/0001-10</span>
        </div>
      </div>
    </footer>

    <a class="whatsapp-flutuante" href="${WHATSAPP_LINK}" target="_blank" rel="noopener" aria-label="Fale conosco no WhatsApp">
      <svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.4 5.14L2 22l5.11-1.5a9.87 9.87 0 0 0 4.93 1.32h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.11c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.03.27-3.47-.73-2.92-1.2-4.79-4.14-4.94-4.34-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36l.55.01c.18.01.42-.07.65.5.24.58.82 1.98.89 2.13.07.14.11.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.28-.12.55.16.27.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.2 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.27.14.44.2.5.31.07.12.07.66-.17 1.34z"/></svg>
    </a>
  `;
}

function injetarParciais(paginaAtiva = "") {
  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  if (headerEl) headerEl.innerHTML = HEADER_HTML(paginaAtiva);
  if (footerEl) footerEl.innerHTML = FOOTER_HTML();
}
