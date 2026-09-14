const fs = require("fs");
const path = require("path");
const { Pool } = require("@neondatabase/serverless");

const URL_BASE_SITE = (process.env.URL_BASE_SITE || "https://www.estanciawestern.com.br").replace(/\/$/, "");

const NOMES_CATEGORIA = {
  camisas: "Camisas & Camisetas",
  "calcas-jeans": "Calças & Jeans",
  "botas-calcados": "Botas & Calçados",
  "chapeus-bones": "Chapéus & Bonés",
  "cintos-fivelas": "Cintos & Fivelas",
  acessorios: "Acessórios",
};

let pool = null;
function obterPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

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

function montarDescricao(produto) {
  const nomeCategoria = NOMES_CATEGORIA[produto.categoria] || produto.categoria;
  return `${produto.nome} — ${nomeCategoria} da Estância Western. Moda country autêntica, vista a alma do campo.`;
}

/**
 * Injeta as tags de Open Graph/description no <head> do HTML estático de
 * produto.html com os dados reais do produto, para que crawlers de link
 * preview (WhatsApp, Instagram, etc.) mostrem foto e título corretos.
 * A página continua 100% funcional em seguida: o script inline existente
 * lê o id da URL normalmente e popula o resto do conteúdo no navegador.
 */
function injetarMetaTags(html, produto) {
  const imagem = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : produto.imagem;
  const titulo = `${produto.nome} — Estância Western`;
  const descricao = montarDescricao(produto);
  const urlProduto = `${URL_BASE_SITE}/produto/${encodeURIComponent(produto.id)}`;
  const imagemAbsoluta = urlAbsoluta(imagem);

  const tituloEscapado = escaparHtmlAtributo(titulo);
  const descricaoEscapada = escaparHtmlAtributo(descricao);

  let resultado = html
    .replace(/<title[^>]*>.*?<\/title>/s, `<title>${tituloEscapado}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${descricaoEscapada}">`,
    );

  const metaTagsOg = `
  <meta property="og:type" content="product">
  <meta property="og:title" content="${tituloEscapado}">
  <meta property="og:description" content="${descricaoEscapada}">
  <meta property="og:image" content="${escaparHtmlAtributo(imagemAbsoluta)}">
  <meta property="og:url" content="${escaparHtmlAtributo(urlProduto)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${tituloEscapado}">
  <meta name="twitter:description" content="${descricaoEscapada}">
  <meta name="twitter:image" content="${escaparHtmlAtributo(imagemAbsoluta)}">`;

  resultado = resultado.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', (match) => `${match}${metaTagsOg}`);

  return resultado;
}

module.exports = async (req, res) => {
  const { id } = req.query;
  const caminhoHtml = path.join(process.cwd(), "pages", "produto.html");
  const htmlBase = fs.readFileSync(caminhoHtml, "utf-8");

  try {
    const { rows } = await obterPool().query(
      "SELECT * FROM produtos WHERE id = $1 AND ativo = true",
      [id],
    );
    const produto = rows[0];

    if (!produto) {
      res.setHeader("Content-Type", "text/html; charset=UTF-8");
      res.status(404).send(htmlBase);
      return;
    }

    const html = injetarMetaTags(htmlBase, produto);
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  } catch (erro) {
    console.error("Erro ao renderizar meta tags do produto:", erro);
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.status(200).send(htmlBase);
  }
};
