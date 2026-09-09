const path = require("path");
const fs = require("fs");
const Module = require("module");
const { db, inicializarBanco } = require("./db");

inicializarBanco();

const productsPath = path.join(__dirname, "..", "..", "..", "js", "products.js");
const conteudo = fs.readFileSync(productsPath, "utf-8");
const mod = new Module(productsPath);
mod.filename = productsPath;
mod.paths = Module._nodeModulePaths(path.dirname(productsPath));
mod._compile(conteudo + "\nmodule.exports = { PRODUTOS };", productsPath);
const produtos = mod.exports.PRODUTOS;

const upsert = db.prepare(`
  INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, imagem, estoque, ativo)
  VALUES (@id, @nome, @categoria, @preco, @precoDe, @parcelas, @cores, @tamanhos, @selo, @imagem, 100, 1)
  ON CONFLICT(id) DO UPDATE SET
    nome = excluded.nome,
    categoria = excluded.categoria,
    preco = excluded.preco,
    preco_de = excluded.preco_de,
    parcelas = excluded.parcelas,
    cores = excluded.cores,
    tamanhos = excluded.tamanhos,
    selo = excluded.selo,
    imagem = excluded.imagem
`);

const transacao = db.transaction((lista) => {
  for (const p of lista) {
    upsert.run({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      preco: p.preco,
      precoDe: p.precoDe ?? null,
      parcelas: p.parcelas ?? null,
      cores: JSON.stringify(p.cores || []),
      tamanhos: JSON.stringify(p.tamanhos || []),
      selo: p.selo ?? null,
      imagem: p.imagem ?? null,
    });
  }
});

transacao(produtos);
console.log(`Sucesso: ${produtos.length} produtos sincronizados.`);

const botas = db.prepare("SELECT id, nome, preco, imagem, tamanhos FROM produtos WHERE categoria = 'botas-calcados'").all();
console.log("Botas cadastradas no SQLite:");
console.log(botas);
