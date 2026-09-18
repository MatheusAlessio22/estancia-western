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
          <ul data-mega-menu-lista>
            ${itemNav("/categoria/lancamentos", "Lançamentos", "lancamentos")}
            ${itemNav("/categoria/promocoes", "Promoções", "promocoes")}
            ${itemNav("/blog", "Blog", "blog")}
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
        <li><a href="/categoria/lancamentos" class="foco-visivel">Lançamentos</a></li>
        <li><a href="/categoria/camisas" class="foco-visivel">Camisas</a></li>
        <li><a href="/categoria/calcas-jeans" class="foco-visivel">Jeans</a></li>
        <li><a href="/categoria/botas-calcados" class="foco-visivel">Botas</a></li>
        <li><a href="/categoria/chapeus-bones" class="foco-visivel">Chapéus &amp; Bonés</a></li>
        <li><a href="/categoria/cintos-fivelas" class="foco-visivel">Cintos &amp; Fivelas</a></li>
        <li><a href="/categoria/acessorios" class="foco-visivel">Acessórios</a></li>
        <li><a href="/blog" class="foco-visivel">Blog</a></li>
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
              <span class="footer__pagamento-logo" aria-label="Visa">
                <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.6 15.7h-3.9l2.4-15.3h3.9l-2.4 15.3z" fill="#1A1F71"/>
                  <path d="M35.9.7c-.8-.3-2-.6-3.5-.6-3.9 0-6.6 2.1-6.6 5 0 2.2 1.9 3.4 3.4 4.1 1.5.7 2 1.2 2 1.9 0 1-1.2 1.5-2.3 1.5-1.6 0-2.4-.2-3.7-.8l-.5-.2-.6 3.4c.9.4 2.6.8 4.4.8 4.1 0 6.8-2.1 6.8-5.2 0-1.7-1-3-3.3-4.1-1.4-.7-2.2-1.2-2.2-1.9 0-.6.7-1.3 2.2-1.3 1.3 0 2.2.3 2.9.6l.4.2.5-3.4z" fill="#1A1F71"/>
                  <path d="M41.6.4h-3c-.9 0-1.6.3-2 1.2l-5.7 13.7h4.1l.8-2.3h5l.5 2.3h3.6L41.6.4zm-4.8 9.9 1.5-4.1c0 .1.3-.8.5-1.4l.3 1.2 .9 4.3h-3.2z" fill="#1A1F71"/>
                  <path d="M14 .4l-3.8 10.4-.4-2.1C9.1 6 6.9 3.2 4.4 1.8l3.5 13.9h4.1L18.1.4H14z" fill="#1A1F71"/>
                  <path d="M6.9.4H.5L.4.8c4.9 1.3 8.2 4.4 9.5 8.1L8.6 1.6C8.4.7 7.7.4 6.9.4z" fill="#F9A51A"/>
                </svg>
              </span>
              <span class="footer__pagamento-logo" aria-label="Mastercard">
                <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="10" r="8" fill="#EB001B"/>
                  <circle cx="20" cy="10" r="8" fill="#F79E1B"/>
                  <path d="M16 3.9a8 8 0 0 1 0 12.2 8 8 0 0 1 0-12.2z" fill="#FF5F00"/>
                </svg>
              </span>
              <span class="footer__pagamento-logo" aria-label="Elo">
                <svg viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg">
                  <text x="30" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="18" font-style="italic">
                    <tspan fill="#FFCB05">e</tspan><tspan fill="#00A4E0">l</tspan><tspan fill="#EF4123">o</tspan>
                  </text>
                </svg>
              </span>
              <span class="footer__pagamento-logo" aria-label="Pix">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.3 3.1a2.6 2.6 0 0 1 1.8.8l2.5 2.5a1 1 0 0 0 .7.3h.5L14.4 3.3a4.6 4.6 0 0 0-3.3-1.4H10a4.6 4.6 0 0 0-3.3 1.4L3.3 6.7a1 1 0 0 0 .7.3h.5l2.5-2.5a2.6 2.6 0 0 1 1.8-.8h3.5z" fill="#32BCAD"/>
                  <path d="M7.6 16.9a2.6 2.6 0 0 1-1.8-.8l-2.5-2.5a1 1 0 0 0-.7-.3h-.5l3.4 3.4a4.6 4.6 0 0 0 3.3 1.4H10a4.6 4.6 0 0 0 3.3-1.4l3.4-3.4h-.5a1 1 0 0 0-.7.3l-2.5 2.5a2.6 2.6 0 0 1-1.8.8H7.6z" fill="#32BCAD"/>
                  <path d="M17.7 8.9 15.9 7a.4.4 0 0 1-.2 0h-1a2 2 0 0 1-1.4-.6l-2.5-2.5a1.6 1.6 0 0 0-1.1-.5H8.3a1.6 1.6 0 0 0-1.1.5L4.7 6.4a2 2 0 0 1-1.4.6h-1a.4.4 0 0 1-.2 0L.3 8.9a1.6 1.6 0 0 0 0 2.2l1.8 1.8a.4.4 0 0 1 .2 0h1a2 2 0 0 1 1.4.6l2.5 2.5c.3.3.7.5 1.1.5h1.4c.4 0 .8-.2 1.1-.5l2.5-2.5a2 2 0 0 1 1.4-.6h1a.4.4 0 0 1 .2 0l1.8-1.8a1.6 1.6 0 0 0 0-2.2zm-6.4 3-1 1a.4.4 0 0 1-.6 0l-1-1a.4.4 0 0 1-.1-.3v-3.2c0-.1 0-.2.1-.3l1-1a.4.4 0 0 1 .6 0l1 1c.1.1.1.2.1.3v3.2c0 .1 0 .2-.1.3z" fill="#32BCAD"/>
                </svg>
              </span>
              <span class="footer__pagamento-logo" aria-label="Boleto">
                <svg viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="2" width="2" height="16" fill="#1C1C1C"/>
                  <rect x="4" y="2" width="1" height="16" fill="#1C1C1C"/>
                  <rect x="6.5" y="2" width="2" height="16" fill="#1C1C1C"/>
                  <rect x="9.5" y="2" width="1" height="16" fill="#1C1C1C"/>
                  <rect x="11.5" y="2" width="2" height="16" fill="#1C1C1C"/>
                  <rect x="15" y="2" width="1" height="16" fill="#1C1C1C"/>
                  <rect x="17" y="2" width="2" height="16" fill="#1C1C1C"/>
                  <rect x="20" y="2" width="1" height="16" fill="#1C1C1C"/>
                  <rect x="22" y="2" width="1" height="16" fill="#1C1C1C"/>
                </svg>
              </span>
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
