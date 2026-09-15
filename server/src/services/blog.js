const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const PASTA_CONTEUDO = path.join(__dirname, "..", "..", "content", "blog");

/**
 * Extrai o front matter (bloco `--- ... ---` no topo do arquivo) como um
 * objeto simples chave: valor. Suficiente para os campos do blog — sem
 * puxar uma lib de YAML só para isso.
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

function listarSlugsDisponiveis() {
  if (!fs.existsSync(PASTA_CONTEUDO)) return [];
  return fs
    .readdirSync(PASTA_CONTEUDO)
    .filter((nomeArquivo) => nomeArquivo.endsWith(".md"))
    .map((nomeArquivo) => nomeArquivo.replace(/\.md$/, ""));
}

/**
 * Lê e converte um artigo do blog. Retorna null se o slug não existir —
 * a rota decide o status HTTP (404) a partir disso.
 */
function obterArtigo(slug) {
  const slugSeguro = String(slug || "").replace(/[^a-z0-9-]/gi, "");
  const caminhoArquivo = path.join(PASTA_CONTEUDO, `${slugSeguro}.md`);

  if (!slugSeguro || !fs.existsSync(caminhoArquivo)) return null;

  const conteudoArquivo = fs.readFileSync(caminhoArquivo, "utf-8");
  const { metadados, corpoMarkdown } = extrairFrontMatter(conteudoArquivo);
  const htmlConteudo = marked.parse(corpoMarkdown);

  return {
    slug: slugSeguro,
    titulo: metadados.titulo || slugSeguro,
    descricao: metadados.descricao || "",
    imagemCapa: metadados.imagemCapa || "",
    categoria: metadados.categoria || "",
    autor: metadados.autor || "Estância Western",
    dataPublicacao: metadados.dataPublicacao || "",
    htmlConteudo,
  };
}

/**
 * Lista todos os artigos publicados (mais recentes primeiro), sem o HTML
 * completo — usado na listagem do blog e para sugerir posts relacionados.
 */
function listarArtigos() {
  return listarSlugsDisponiveis()
    .map((slug) => obterArtigo(slug))
    .filter(Boolean)
    .sort((a, b) => (a.dataPublicacao < b.dataPublicacao ? 1 : -1));
}

module.exports = { obterArtigo, listarArtigos };
