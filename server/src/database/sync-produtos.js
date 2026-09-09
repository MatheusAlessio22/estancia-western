const path = require("path");
const fs = require("fs");
const Module = require("module");
const { db, inicializarBanco } = require("./db");

async function main() {
  await inicializarBanco();

  const productsPath = path.join(__dirname, "..", "..", "..", "js", "products.js");
  const conteudo = fs.readFileSync(productsPath, "utf-8");
  const mod = new Module(productsPath);
  mod.filename = productsPath;
  mod.paths = Module._nodeModulePaths(path.dirname(productsPath));
  mod._compile(conteudo + "\nmodule.exports = { PRODUTOS };", productsPath);
  const produtos = mod.exports.PRODUTOS;

  for (const p of produtos) {
    await db.query(
      `INSERT INTO produtos (id, nome, categoria, preco, preco_de, parcelas, cores, tamanhos, selo, imagem, estoque, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 100, true)
       ON CONFLICT (id) DO UPDATE SET
         nome = excluded.nome,
         categoria = excluded.categoria,
         preco = excluded.preco,
         preco_de = excluded.preco_de,
         parcelas = excluded.parcelas,
         cores = excluded.cores,
         tamanhos = excluded.tamanhos,
         selo = excluded.selo,
         imagem = excluded.imagem`,
      [
        p.id,
        p.nome,
        p.categoria,
        p.preco,
        p.precoDe ?? null,
        p.parcelas ?? null,
        JSON.stringify(p.cores || []),
        JSON.stringify(p.tamanhos || []),
        p.selo ?? null,
        p.imagem ?? null,
      ],
    );
  }

  console.log(`Sucesso: ${produtos.length} produtos sincronizados.`);

  const { rows } = await db.query(
    "SELECT id, nome, preco, imagem, tamanhos FROM produtos WHERE categoria = 'botas-calcados'",
  );
  console.log("Botas cadastradas no banco:");
  console.log(rows);

  await db.pool.end();
}

main().catch((erro) => {
  console.error("Erro ao sincronizar produtos:", erro);
  process.exit(1);
});
