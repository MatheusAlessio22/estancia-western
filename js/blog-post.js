/**
 * Página de artigo do blog (pages/blog-post.html).
 *
 * Em produção (Vercel), o HTML já chega pronto: api/blog/[slug].js faz
 * o SSR do artigo (título, meta tags, corpo do texto) antes de servir a
 * página, para SEO — o Google não depende de JS para indexar o texto.
 * Este script só busca o artigo de novo (via fetch) para descobrir a
 * categoria e montar o carrossel de produtos sugeridos, e serve de
 * fallback (preenchendo o conteúdo do zero) em ambientes onde o SSR não
 * rodou, como o servidor Express local.
 */

function formatarDataArtigo(dataIso) {
  if (!dataIso) return '';
  try {
    return new Date(`${dataIso}T00:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function preencherConteudoDoZero(artigo) {
  document.title = `${artigo.titulo} — Estância Western`;
  document.querySelector('[data-descricao-pagina]')?.setAttribute('content', artigo.descricao);

  const capaContainer = document.querySelector('[data-blog-post-capa-container]');
  const capaImg = document.querySelector('[data-blog-post-capa]');
  if (artigo.imagemCapa) {
    capaImg.src = artigo.imagemCapa;
    capaImg.alt = artigo.titulo;
  } else {
    capaContainer.hidden = true;
  }

  const categoriaNome = artigo.categoria ? nomeCategoria(artigo.categoria) : 'Blog';
  document.querySelector('[data-blog-post-categoria]').textContent = categoriaNome;
  document.querySelector('[data-blog-post-titulo]').textContent = artigo.titulo;
  document.querySelector('[data-blog-post-titulo-breadcrumb]').textContent = artigo.titulo;
  document.querySelector('[data-blog-post-autor]').textContent = artigo.autor;

  const dataEl = document.querySelector('[data-blog-post-data]');
  dataEl.textContent = formatarDataArtigo(artigo.dataPublicacao);
  dataEl.setAttribute('datetime', artigo.dataPublicacao);

  document.querySelector('[data-blog-post-corpo]').innerHTML = artigo.htmlConteudo;
}

async function montarCarrosselSugestoes(categoria) {
  const secao = document.querySelector('[data-blog-post-sugestoes-secao]');
  const carrossel = document.querySelector('[data-carrossel-produtos]');
  if (!secao || !carrossel) return;

  const catalogo = await carregarCatalogoProdutos();
  const sugeridos = (categoria ? catalogo.filter((p) => p.categoria === categoria) : catalogo).slice(0, 8);

  if (sugeridos.length === 0) return;

  carrossel.innerHTML = sugeridos.map(cartaoProdutoHTML).join('');
  secao.hidden = false;

  carrossel.querySelectorAll('[data-adicionar-rapido]').forEach((btn) => {
    btn.addEventListener('click', () => {
      adicionarAoCarrinho(btn.dataset.adicionarRapido, { quantidade: 1 });
      mostrarToast('Produto adicionado ao carrinho!');
    });
  });

  const wrapper = carrossel.closest('[data-carrossel]');
  if (wrapper) inicializarCarrossel(wrapper);
}

async function inicializarBlogPost() {
  const correspondenciaPath = window.location.pathname.match(/^\/blog\/([^/]+)/);
  const slug = correspondenciaPath ? decodeURIComponent(correspondenciaPath[1]) : null;

  if (!slug) {
    document.querySelector('[data-blog-post-nao-encontrado]').hidden = false;
    return;
  }

  let artigo;
  try {
    const resposta = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
    if (!resposta.ok) throw new Error('Artigo não encontrado.');
    artigo = await resposta.json();
  } catch {
    // Se o SSR já preencheu a página (produção), não há erro real —
    // só a chamada de reforço que falhou. Só mostra "não encontrado"
    // quando a página também está vazia.
    const post = document.querySelector('[data-blog-post]');
    if (post.hidden) {
      document.querySelector('[data-blog-post-nao-encontrado]').hidden = false;
    }
    return;
  }

  const post = document.querySelector('[data-blog-post]');
  const jaRenderizadoPeloSSR = !post.hidden;

  if (!jaRenderizadoPeloSSR) {
    preencherConteudoDoZero(artigo);
    post.hidden = false;

    document.querySelector('[data-schema-artigo]').textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: artigo.titulo,
      description: artigo.descricao,
      image: artigo.imagemCapa ? `${window.location.origin}${artigo.imagemCapa}` : undefined,
      author: { '@type': 'Organization', name: artigo.autor },
      datePublished: artigo.dataPublicacao,
      url: `${window.location.origin}/blog/${artigo.slug}`,
    });
  }

  await montarCarrosselSugestoes(artigo.categoria);
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarHeader();
  inicializarBlogPost();
  inicializarAnoRodape();
});
