const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const URL_BASE_SITE = (process.env.URL_BASE_SITE || "https://www.estanciawestern.com.br").replace(/\/$/, "");
const PASTA_CONTEUDO = path.join(process.cwd(), "server", "content", "blog");

function escaparHtmlAtributo(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlAbsoluta(caminho) {
  if (!caminho) return `${URL_BASE_SITE}/assets/logos/logo-social-textura.png`;
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${URL_BASE_SITE}/${String(caminho).replace(/^\//, "")}`;
}

/**
 * Mesmo parser de front matter usado em server/src/services/blog.js.
 * Duplicado aqui (em vez de importado) porque Serverless Functions da
 * Vercel empacotam cada arquivo em /api isoladamente — importar um
 * módulo de dentro de server/src exigiria configurar includeFiles
 * específico só para isso.
 */
function extrairFrontMatter(conteudoArquivo) {
  const match = conteudoArquivo.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadados: {}, corpoMarkdown: conteudoArquivo };

  const [, blocoFrontMatter, corpoMarkdown] = match;
  const metadados = {};

  blocoFrontMatter.split("\n").forEach((linha) => {
    const separador = linha.indexOf(":");
    if (separador === -1) return;
    const chave = linha.slice(0, separador).trim();
    const valor = linha.slice(separador + 1).trim();
    if (chave) metadados[chave] = valor;
  });

  return { metadados, corpoMarkdown };
}

function obterArtigo(slug) {
  const slugSeguro = String(slug || "").replace(/[^a-z0-9-]/gi, "");
  const caminhoArquivo = path.join(PASTA_CONTEUDO, `${slugSeguro}.md`);

  if (!slugSeguro || !fs.existsSync(caminhoArquivo)) return null;

  const conteudoArquivo = fs.readFileSync(caminhoArquivo, "utf-8");
  const { metadados, corpoMarkdown } = extrairFrontMatter(conteudoArquivo);

  return {
    slug: slugSeguro,
    titulo: metadados.titulo || slugSeguro,
    descricao: metadados.descricao || "",
    imagemCapa: metadados.imagemCapa || "",
    categoria: metadados.categoria || "",
    autor: metadados.autor || "Estância Western",
    dataPublicacao: metadados.dataPublicacao || "",
    htmlConteudo: marked.parse(corpoMarkdown),
  };
}

/**
 * Faz o SSR do artigo: injeta meta tags reais (SEO/link preview) E o
 * conteúdo textual do artigo diretamente no HTML servido, para que o
 * Google indexe o texto completo sem depender de JS. O script
 * client-side (js/blog-post.js) roda depois para montar o carrossel de
 * produtos sugeridos, que é conteúdo dinâmico à parte.
 */
function renderizarArtigo(html, artigo) {
  const titulo = `${artigo.titulo} — Estância Western`;
  const urlArtigo = `${URL_BASE_SITE}/blog/${encodeURIComponent(artigo.slug)}`;
  const imagemAbsoluta = urlAbsoluta(artigo.imagemCapa);

  const tituloEscapado = escaparHtmlAtributo(titulo);
  const descricaoEscapada = escaparHtmlAtributo(artigo.descricao);

  let resultado = html
    .replace(/<title[^>]*>.*?<\/title>/s, `<title>${tituloEscapado}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${descricaoEscapada}">`,
    );

  const metaTagsOg = `
  <meta property="og:type" content="article">
  <meta property="og:title" content="${tituloEscapado}">
  <meta property="og:description" content="${descricaoEscapada}">
  <meta property="og:image" content="${escaparHtmlAtributo(imagemAbsoluta)}">
  <meta property="og:url" content="${escaparHtmlAtributo(urlArtigo)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${tituloEscapado}">
  <meta name="twitter:description" content="${descricaoEscapada}">
  <meta name="twitter:image" content="${escaparHtmlAtributo(imagemAbsoluta)}">
  <link rel="canonical" href="${escaparHtmlAtributo(urlArtigo)}">`;

  resultado = resultado.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', (match) => `${match}${metaTagsOg}`);

  const schemaArtigo = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: artigo.titulo,
    description: artigo.descricao,
    image: imagemAbsoluta,
    author: { "@type": "Organization", name: artigo.autor },
    datePublished: artigo.dataPublicacao,
    url: urlArtigo,
  });
  resultado = resultado.replace(
    '<script type="application/ld+json" data-schema-artigo>{}</script>',
    `<script type="application/ld+json" data-schema-artigo>${schemaArtigo}</script>`,
  );

  const categoriaNomes = {
    camisas: "Camisas & Camisetas",
    "calcas-jeans": "Calças & Jeans",
    "botas-calcados": "Botas & Calçados",
    "chapeus-bones": "Chapéus & Bonés",
    "cintos-fivelas": "Cintos & Fivelas",
    acessorios: "Acessórios",
  };
  const categoriaNome = categoriaNomes[artigo.categoria] || "Blog";
  const dataFormatada = artigo.dataPublicacao
    ? new Date(`${artigo.dataPublicacao}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  resultado = resultado
    .replace('data-blog-post hidden', 'data-blog-post')
    .replace('<img data-blog-post-capa src="" alt="">', artigo.imagemCapa ? `<img data-blog-post-capa src="${escaparHtmlAtributo(artigo.imagemCapa)}" alt="${tituloEscapado}">` : '')
    .replace('<span class="eyebrow" data-blog-post-categoria></span>', `<span class="eyebrow" data-blog-post-categoria>${escaparHtmlAtributo(categoriaNome)}</span>`)
    .replace('<h1 data-blog-post-titulo></h1>', `<h1 data-blog-post-titulo>${escaparHtmlAtributo(artigo.titulo)}</h1>`)
    .replace('<span aria-current="page" data-blog-post-titulo-breadcrumb>Artigo</span>', `<span aria-current="page" data-blog-post-titulo-breadcrumb>${escaparHtmlAtributo(artigo.titulo)}</span>`)
    .replace('<span data-blog-post-autor></span>', `<span data-blog-post-autor>${escaparHtmlAtributo(artigo.autor)}</span>`)
    .replace('<time data-blog-post-data></time>', `<time data-blog-post-data datetime="${escaparHtmlAtributo(artigo.dataPublicacao)}">${dataFormatada}</time>`)
    .replace('<div class="blog-post__corpo" data-blog-post-corpo></div>', `<div class="blog-post__corpo" data-blog-post-corpo>${artigo.htmlConteudo}</div>`);

  return resultado;
}

module.exports = async (req, res) => {
  const { slug } = req.query;
  const caminhoHtml = path.join(process.cwd(), "pages", "blog-post.html");
  const htmlBase = fs.readFileSync(caminhoHtml, "utf-8");

  try {
    const artigo = obterArtigo(slug);

    if (!artigo) {
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.status(404).send(htmlBase);
      return;
    }

    const html = renderizarArtigo(htmlBase, artigo);
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  } catch (erro) {
    console.error("Erro ao renderizar artigo do blog:", erro);
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.status(200).send(htmlBase);
  }
};
