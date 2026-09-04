/**
 * Catálogo de produtos — dados provisórios (placeholder).
 * Substituir por fotos reais e preços definitivos enviados pelo cliente,
 * ou por uma chamada à API da plataforma escolhida (Nuvemshop/Shopify/WooCommerce).
 */
const PLACEHOLDER_IMG = "/assets/images/produtos/placeholder-produto.svg";

const CATEGORIAS = [
  { slug: "camisas", nome: "Camisas & Camisetas" },
  { slug: "calcas-jeans", nome: "Calças & Jeans" },
  { slug: "botas-calcados", nome: "Botas & Calçados" },
  { slug: "chapeus-bones", nome: "Chapéus & Bonés" },
  { slug: "cintos-fivelas", nome: "Cintos & Fivelas" },
  { slug: "acessorios", nome: "Acessórios" },
];

const PRODUTOS = [
  {
    id: "p01",
    nome: "Camisa Xadrez Estância",
    categoria: "camisas",
    preco: 189.9,
    precoDe: 229.9,
    parcelas: "6x de R$ 31,65 sem juros",
    cores: ["#5F3A2A", "#1C1C1C"],
    tamanhos: ["P", "M", "G", "GG"],
    selo: "Novidade",
    novo: true,
    maisVendido: false,
  },
  {
    id: "p02",
    nome: "Calça Jeans Reta Rodeio",
    categoria: "calcas-jeans",
    preco: 249.9,
    parcelas: "6x de R$ 41,65 sem juros",
    cores: ["#2b3a55", "#1C1C1C"],
    tamanhos: ["38", "40", "42", "44"],
    selo: null,
    novo: true,
    maisVendido: true,
  },
  {
    id: "p03",
    nome: "Bota Country Couro Legítimo",
    categoria: "botas-calcados",
    preco: 459.9,
    precoDe: 519.9,
    parcelas: "10x de R$ 45,99 sem juros",
    cores: ["#5F3A2A"],
    tamanhos: ["38", "39", "40", "41", "42"],
    selo: "Oferta",
    novo: false,
    maisVendido: true,
  },
  {
    id: "p04",
    nome: "Chapéu Aba Larga Estância",
    categoria: "chapeus-bones",
    preco: 159.9,
    parcelas: "4x de R$ 39,98 sem juros",
    cores: ["#D9C3A8", "#5F3A2A"],
    tamanhos: ["Único"],
    selo: null,
    novo: true,
    maisVendido: false,
  },
  {
    id: "p05",
    nome: "Cinto de Couro com Fivela Western",
    categoria: "cintos-fivelas",
    preco: 129.9,
    parcelas: "3x de R$ 43,30 sem juros",
    cores: ["#5F3A2A", "#1C1C1C"],
    tamanhos: ["P/M", "G/GG"],
    selo: null,
    novo: false,
    maisVendido: true,
  },
  {
    id: "p06",
    nome: "Lenço Estampado Country",
    categoria: "acessorios",
    preco: 49.9,
    parcelas: "2x de R$ 24,95 sem juros",
    cores: ["#B5502E", "#5F3A2A"],
    tamanhos: ["Único"],
    selo: "Novidade",
    novo: true,
    maisVendido: false,
  },
  {
    id: "p07",
    nome: "Camisa Manga Longa Rancho",
    categoria: "camisas",
    preco: 169.9,
    parcelas: "5x de R$ 33,98 sem juros",
    cores: ["#F4E4D7", "#556B2F"],
    tamanhos: ["P", "M", "G"],
    selo: null,
    novo: false,
    maisVendido: true,
  },
  {
    id: "p08",
    nome: "Calça Jeans Skinny Estância",
    categoria: "calcas-jeans",
    preco: 219.9,
    parcelas: "6x de R$ 36,65 sem juros",
    cores: ["#1C1C1C"],
    tamanhos: ["36", "38", "40", "42"],
    selo: "Novidade",
    novo: true,
    maisVendido: false,
  },
  {
    id: "p09",
    nome: "Bota Texana Bico Fino",
    categoria: "botas-calcados",
    preco: 519.9,
    parcelas: "10x de R$ 51,99 sem juros",
    cores: ["#402714"],
    tamanhos: ["37", "38", "39", "40", "41"],
    selo: null,
    novo: false,
    maisVendido: true,
  },
  {
    id: "p10",
    nome: "Boné Trucker Estância Western",
    categoria: "chapeus-bones",
    preco: 89.9,
    parcelas: "2x de R$ 44,95 sem juros",
    cores: ["#1C1C1C", "#5F3A2A"],
    tamanhos: ["Único"],
    selo: null,
    novo: true,
    maisVendido: false,
  },
  {
    id: "p11",
    nome: "Cinto Trançado de Couro",
    categoria: "cintos-fivelas",
    preco: 149.9,
    parcelas: "3x de R$ 49,97 sem juros",
    cores: ["#5F3A2A"],
    tamanhos: ["P/M", "G/GG"],
    selo: null,
    novo: false,
    maisVendido: false,
  },
  {
    id: "p12",
    nome: "Espora Decorativa Tradicional",
    categoria: "acessorios",
    preco: 79.9,
    parcelas: "2x de R$ 39,95 sem juros",
    cores: ["#5F3A2A"],
    tamanhos: ["Único"],
    selo: "Novidade",
    novo: true,
    maisVendido: false,
  },
];

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buscarProdutoPorId(id) {
  return PRODUTOS.find((produto) => produto.id === id) || null;
}

function buscarProdutosPorCategoria(slug) {
  return PRODUTOS.filter((produto) => produto.categoria === slug);
}

function nomeCategoria(slug) {
  const categoria = CATEGORIAS.find((item) => item.slug === slug);
  return categoria ? categoria.nome : slug;
}

/**
 * Camada híbrida de carregamento de produtos: tenta a API do backend
 * (/api/produtos) e cai no array local PRODUTOS se o backend estiver
 * offline (ex: hospedagem estática na Vercel) ou a rota não existir.
 */
async function carregarCatalogoProdutos() {
  try {
    const resposta = await fetch("/api/produtos");
    if (!resposta.ok) throw new Error("Resposta inesperada da API de produtos.");

    const produtosApi = await resposta.json();
    if (!Array.isArray(produtosApi) || produtosApi.length === 0) {
      throw new Error("API de produtos retornou lista vazia.");
    }

    // O banco de dados ainda não guarda os sinalizadores "novo"/"maisVendido"
    // usados nas vitrines da Home; herda-os do catálogo local pelo id
    // enquanto essas colunas não existem no schema do backend.
    return produtosApi.map((produto) => {
      const produtoLocal = buscarProdutoPorId(produto.id);
      return {
        novo: produtoLocal?.novo || false,
        maisVendido: produtoLocal?.maisVendido || false,
        ...produto,
      };
    });
  } catch (erro) {
    console.warn("Backend de produtos indisponível, usando catálogo local.", erro);
    return PRODUTOS;
  }
}

const PEDIDOS_STORAGE_KEY = "estancia_pedidos";

function lerPedidosLocais() {
  try {
    const dados = localStorage.getItem(PEDIDOS_STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

function salvarPedidoLocal(pedido) {
  try {
    const pedidos = lerPedidosLocais();
    pedidos.unshift(pedido);
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
  } catch {
    /* localStorage indisponível (modo privado etc.) — ignora silenciosamente */
  }
}

function buscarPedidoLocal(numero, email) {
  const numeroLimpo = String(numero || "").trim().toUpperCase();
  const emailLimpo = String(email || "").trim().toLowerCase();

  return (
    lerPedidosLocais().find(
      (pedido) =>
        String(pedido.numero || "").trim().toUpperCase() === numeroLimpo &&
        String(pedido.email || "").trim().toLowerCase() === emailLimpo,
    ) || null
  );
}
