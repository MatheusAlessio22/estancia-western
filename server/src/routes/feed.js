const express = require("express");
const { db } = require("../database/db");

const router = express.Router();

const URL_BASE_SITE = (process.env.URL_BASE_SITE || "https://www.estanciawestern.com.br").replace(/\/$/, "");

const NOMES_CATEGORIA = {
  camisas: "Camisas & Camisetas",
  "calcas-jeans": "Calças & Jeans",
  "botas-calcados": "Botas & Calçados",
  "chapeus-bones": "Chapéus & Bonés",
  "cintos-fivelas": "Cintos & Fivelas",
  acessorios: "Acessórios",
};

function escaparXml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlAbsoluta(caminho) {
  if (!caminho) return "";
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${URL_BASE_SITE}/${String(caminho).replace(/^\//, "")}`;
}

function montarDescricao(produto) {
  const nomeCategoria = NOMES_CATEGORIA[produto.categoria] || produto.categoria;
  return `${produto.nome} — ${nomeCategoria} da Estância Western. Moda country autêntica, vista a alma do campo.`;
}

function montarItemXml(produto) {
  const imagens = produto.imagens && produto.imagens.length > 0 ? produto.imagens : produto.imagem ? [produto.imagem] : [];
  const imagemPrincipal = imagens[0];
  const imagensAdicionais = imagens.slice(1, 11); // Google aceita até 10 imagens adicionais

  if (!imagemPrincipal) return "";

  const link = `${URL_BASE_SITE}/produto/${encodeURIComponent(produto.id)}`;
  const disponibilidade = Number(produto.estoque) > 0 ? "in stock" : "out of stock";

  const tagsImagensAdicionais = imagensAdicionais
    .map((img) => `      <g:additional_image_link>${escaparXml(urlAbsoluta(img))}</g:additional_image_link>`)
    .join("\n");

  return `    <item>
      <g:id>${escaparXml(produto.id)}</g:id>
      <title>${escaparXml(produto.nome)}</title>
      <description>${escaparXml(montarDescricao(produto))}</description>
      <link>${escaparXml(link)}</link>
      <g:image_link>${escaparXml(urlAbsoluta(imagemPrincipal))}</g:image_link>
${tagsImagensAdicionais ? `${tagsImagensAdicionais}\n` : ""}      <g:availability>${disponibilidade}</g:availability>
      <g:price>${Number(produto.preco).toFixed(2)} BRL</g:price>
      <g:condition>new</g:condition>
      <g:brand>Estância Western</g:brand>
      <g:google_product_category>${escaparXml(NOMES_CATEGORIA[produto.categoria] || produto.categoria)}</g:google_product_category>
    </item>`;
}

router.get("/feed.xml", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM produtos WHERE ativo = true AND excluido = false ORDER BY nome ASC",
    );

    const itensXml = rows
      .map(montarItemXml)
      .filter(Boolean)
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Estância Western — Catálogo de Produtos</title>
    <link>${escaparXml(URL_BASE_SITE)}</link>
    <description>Feed de produtos da Estância Western para o Google Merchant Center.</description>
${itensXml}
  </channel>
</rss>`;

    res.set("Content-Type", "application/xml; charset=UTF-8");
    res.send(xml);
  } catch (erro) {
    console.error("Erro ao gerar feed de produtos:", erro);
    res.status(500).json({ erro: "Erro ao gerar feed de produtos." });
  }
});

module.exports = router;
