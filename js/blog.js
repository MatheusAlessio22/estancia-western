/**
 * Listagem do blog (pages/blog.html) — busca os artigos publicados em
 * /api/blog e renderiza um card por artigo.
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

function cartaoArtigoHTML(artigo) {
  return `
    <a href="/blog/${artigo.slug}" class="card-artigo">
      ${artigo.imagemCapa ? `<img src="${artigo.imagemCapa}" alt="" loading="lazy">` : ''}
      <div class="card-artigo__corpo">
        <span class="card-artigo__data">${formatarDataArtigo(artigo.dataPublicacao)}</span>
        <h2 class="card-artigo__titulo">${artigo.titulo}</h2>
        <p class="card-artigo__descricao">${artigo.descricao}</p>
      </div>
    </a>
  `;
}

async function inicializarBlog() {
  const lista = document.querySelector('[data-blog-lista]');
  const vazio = document.querySelector('[data-blog-vazio]');
  if (!lista) return;

  try {
    const resposta = await fetch('/api/blog');
    const artigos = await resposta.json();

    if (!Array.isArray(artigos) || artigos.length === 0) {
      vazio.hidden = false;
      return;
    }

    lista.innerHTML = artigos.map(cartaoArtigoHTML).join('');
  } catch {
    vazio.hidden = false;
    vazio.textContent = 'Não foi possível carregar os artigos agora. Tente novamente mais tarde.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarHeader();
  inicializarBlog();
  inicializarAnoRodape();
});
