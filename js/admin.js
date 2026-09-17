/**
 * Painel Administrativo — gestão de catálogo do lojista.
 * Autenticação via JWT (server/src/routes/auth.js). Persistência de
 * produtos em modo híbrido: API autenticada (/api/admin/produtos) com
 * fallback em localStorage (chave `estancia_produtos_custom`) quando o
 * backend não está disponível (ex: hospedagem estática na Vercel).
 */

const ADMIN_TOKEN_KEY = "estancia_token_admin";

const CATEGORIAS_ADMIN = [
  { slug: "camisas", nome: "Camisas & Camisetas" },
  { slug: "calcas-jeans", nome: "Calças & Jeans" },
  { slug: "botas-calcados", nome: "Botas & Calçados" },
  { slug: "chapeus-bones", nome: "Chapéus & Bonés" },
  { slug: "cintos-fivelas", nome: "Cintos & Fivelas" },
  { slug: "acessorios", nome: "Acessórios" },
];

function nomeCategoriaAdmin(slug) {
  const categoria = CATEGORIAS_ADMIN.find((item) => item.slug === slug);
  return categoria ? categoria.nome : slug;
}

function formatarPrecoAdmin(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ---- Sessão (token JWT) ---- */

function obterTokenAdmin() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function salvarTokenAdmin(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function encerrarSessaoAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function cabecalhosAutenticados() {
  return {
    Authorization: `Bearer ${obterTokenAdmin()}`,
    "Content-Type": "application/json",
  };
}

/* ---- Toast de notificação ---- */

function mostrarToastAdmin(mensagem) {
  let toast = document.querySelector("[data-admin-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("data-admin-toast", "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("is-visivel");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("is-visivel"), 2500);
}

/* ---- Persistência híbrida de produtos ---- */

function lerProdutosCustomAdmin() {
  try {
    const dados = localStorage.getItem("estancia_produtos_custom");
    const lista = dados ? JSON.parse(dados) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarProdutosCustomAdmin(lista) {
  localStorage.setItem("estancia_produtos_custom", JSON.stringify(lista));
}

/**
 * Executa uma chamada autenticada à API administrativa. Se a resposta for
 * 401 (token ausente/expirado/inválido), desloga automaticamente e volta
 * para a tela de login. Se o backend estiver indisponível (erro de rede),
 * retorna `null` para o chamador aplicar o fallback local.
 */
async function chamarApiAdmin(caminho, opcoes = {}) {
  try {
    const resposta = await fetch(caminho, {
      ...opcoes,
      headers: cabecalhosAutenticados(),
    });

    if (resposta.status === 401) {
      encerrarSessaoAdmin();
      mostrarTelaLogin();
      throw { tratado: true, deslogado: true };
    }

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw { tratado: true, mensagem: dados.erro || "Erro ao comunicar com o servidor." };
    }

    return dados;
  } catch (erro) {
    if (erro && erro.tratado) throw erro;
    return null; // erro de rede: backend indisponível, cai no fallback local
  }
}

async function listarProdutosAdmin() {
  const dados = await chamarApiAdmin("/api/admin/produtos");
  if (dados) return dados;
  return lerProdutosCustomAdmin();
}

async function salvarProdutoAdmin(produto) {
  const editando = !!produto.id;
  const dados = await chamarApiAdmin(editando ? `/api/admin/produtos/${produto.id}` : "/api/admin/produtos", {
    method: editando ? "PUT" : "POST",
    body: JSON.stringify(produto),
  });

  if (dados) return dados;

  const lista = lerProdutosCustomAdmin();
  const id = produto.id || `p-${Date.now().toString(36)}`;
  const produtoFinal = { ...produto, id };
  const indice = lista.findIndex((item) => item.id === id);

  if (indice >= 0) {
    lista[indice] = produtoFinal;
  } else {
    lista.push(produtoFinal);
  }

  salvarProdutosCustomAdmin(lista);
  return produtoFinal;
}

async function excluirProdutoAdmin(id) {
  const dados = await chamarApiAdmin(`/api/admin/produtos/${id}`, { method: "DELETE" });
  if (dados) return;

  const lista = lerProdutosCustomAdmin().filter((item) => item.id !== id);
  salvarProdutosCustomAdmin(lista);
}

/* ---- Tela de Login ---- */

function mostrarTelaLogin() {
  document.querySelector("[data-admin-login]").hidden = false;
  document.querySelector("[data-admin-dashboard]").hidden = true;
}

function mostrarDashboard() {
  document.querySelector("[data-admin-login]").hidden = true;
  document.querySelector("[data-admin-dashboard]").hidden = false;
  inicializarDashboardAdmin();
}

async function inicializarLoginAdmin() {
  const form = document.querySelector("[data-admin-login-form]");
  const aviso = document.querySelector("[data-admin-login-aviso]");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const email = form.querySelector("#admin-usuario").value.trim();
    const senha = form.querySelector("#admin-senha").value;

    aviso.hidden = true;

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        aviso.textContent = dados.erro || "E-mail ou senha incorretos.";
        aviso.hidden = false;
        return;
      }

      salvarTokenAdmin(dados.token);
      mostrarDashboard();
    } catch {
      aviso.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      aviso.hidden = false;
    }
  });

  if (obterTokenAdmin()) {
    const verificacao = await fetch("/api/auth/verificar", {
      headers: cabecalhosAutenticados(),
    }).catch(() => null);

    if (verificacao && verificacao.ok) {
      mostrarDashboard();
      return;
    }

    encerrarSessaoAdmin();
  }

  mostrarTelaLogin();
}

/* ---- Dashboard ---- */

let dashboardJaInicializado = false;
let produtosCarregados = [];
let filtroTextoAtual = "";
let filtroCategoriaAtual = "";
let idParaExcluir = null;

function inicializarDashboardAdmin() {
  carregarEExibirProdutos();

  if (dashboardJaInicializado) return;
  dashboardJaInicializado = true;

  document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    encerrarSessaoAdmin();
    window.location.reload();
  });

  document.querySelectorAll("[data-admin-novo-produto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      abrirModalProduto(null);
    });
  });

  document.querySelectorAll("[data-admin-busca-input]").forEach((input) => {
    input.addEventListener("input", (evento) => {
      filtroTextoAtual = evento.target.value.trim().toLowerCase();
      renderizarTabelaProdutos();
    });
  });

  document.querySelectorAll("[data-admin-filtro-categoria]").forEach((select) => {
    select.addEventListener("change", (evento) => {
      filtroCategoriaAtual = evento.target.value;
      renderizarTabelaProdutos();
    });
  });

  inicializarModalProduto();
  inicializarConfirmacaoExclusao();
  inicializarModalPedido();
  inicializarSidebarAdmin();
}

/* ---- Sidebar / navegação entre páginas ---- */

function irParaPaginaAdmin(paginaId) {
  document.querySelectorAll("[data-admin-pagina]").forEach((secao) => {
    secao.classList.toggle("is-ativa", secao.dataset.adminPagina === paginaId);
  });

  document.querySelectorAll("[data-admin-pagina-link]").forEach((item) => {
    item.classList.toggle("is-ativo", item.dataset.adminPaginaLink === paginaId);
  });

  fecharSidebarAdmin();

  if (paginaId === "visao-geral") carregarResumoAdmin();
  if (paginaId === "pedidos") carregarEExibirPedidosAdmin();
}

function abrirSidebarAdmin() {
  document.querySelector("[data-admin-sidebar]").classList.add("is-aberta");
  document.querySelector("[data-admin-sidebar-overlay]").hidden = false;
}

function fecharSidebarAdmin() {
  document.querySelector("[data-admin-sidebar]").classList.remove("is-aberta");
  document.querySelector("[data-admin-sidebar-overlay]").hidden = true;
}

function inicializarSidebarAdmin() {
  document.querySelectorAll("[data-admin-pagina-link]").forEach((item) => {
    item.addEventListener("click", () => irParaPaginaAdmin(item.dataset.adminPaginaLink));
  });

  document.querySelector("[data-admin-sidebar-abrir]").addEventListener("click", abrirSidebarAdmin);
  document.querySelector("[data-admin-sidebar-overlay]").addEventListener("click", fecharSidebarAdmin);

  carregarResumoAdmin();
}

/* ---- Visão Geral ---- */

async function carregarResumoAdmin() {
  const produtos = await listarProdutosAdmin();
  const ativos = produtos.filter((produto) => produto.ativo !== false).length;
  document.querySelector("[data-admin-resumo-produtos-ativos]").textContent = ativos;

  const pedidos = await chamarApiAdmin("/api/admin/pedidos");
  if (!pedidos) return;

  document.querySelector("[data-admin-resumo-total-pedidos]").textContent = pedidos.length;

  // Faturamento só conta pedidos com pagamento confirmado — pedidos cancelados
  // (ou ainda pendentes) não representam dinheiro que entrou de fato.
  const faturamento = pedidos
    .filter((pedido) => pedido.status === "pago")
    .reduce((soma, pedido) => soma + Number(pedido.total || 0), 0);
  document.querySelector("[data-admin-resumo-faturamento]").textContent = formatarPrecoAdmin(faturamento);
}

/* ---- Pedidos ---- */

const STATUS_PAGAMENTO_LABEL = {
  pendente: "Pendente",
  pago: "Aprovado",
  cancelado: "Recusado",
};

const STATUS_ENVIO_LABEL = {
  preparando: "Preparando",
  enviado: "Enviado",
  entregue: "Entregue",
};

function formatarDataAdmin(dataIso) {
  if (!dataIso) return "";
  try {
    return new Date(dataIso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

function badgeStatusPagamentoHTML(status) {
  const classes = {
    pendente: "admin-badge admin-badge--pendente",
    pago: "admin-badge admin-badge--aprovado",
    cancelado: "admin-badge admin-badge--recusado",
  };
  const rotulo = STATUS_PAGAMENTO_LABEL[status] || status || "—";
  return `<span class="${classes[status] || "admin-badge"}">${rotulo}</span>`;
}

function badgeStatusEnvioHTML(statusEnvio) {
  const classes = {
    preparando: "admin-badge admin-badge--preparando",
    enviado: "admin-badge admin-badge--enviado",
    entregue: "admin-badge admin-badge--entregue",
  };
  const rotulo = STATUS_ENVIO_LABEL[statusEnvio] || "Preparando";
  return `<span class="${classes[statusEnvio] || "admin-badge"}">${rotulo}</span>`;
}

function linhaPedidoHTML(pedido) {
  return `
    <tr>
      <td>#${pedido.id}</td>
      <td>${formatarDataAdmin(pedido.criado_em)}</td>
      <td>${pedido.cliente_nome || "—"}</td>
      <td class="admin-tabela__preco">${formatarPrecoAdmin(pedido.total)}</td>
      <td>${badgeStatusPagamentoHTML(pedido.status)}</td>
      <td>${badgeStatusEnvioHTML(pedido.status_envio)}</td>
      <td class="admin-tabela__acoes">
        <button type="button" class="btn btn--secundario btn--pequeno" data-admin-pedido-detalhes="${pedido.id}">Ver Detalhes</button>
      </td>
    </tr>
  `;
}

async function carregarEExibirPedidosAdmin() {
  const corpo = document.querySelector("[data-admin-pedidos-corpo]");
  const vazio = document.querySelector("[data-admin-pedidos-vazio]");

  const pedidos = await chamarApiAdmin("/api/admin/pedidos");
  const lista = pedidos || [];

  corpo.innerHTML = lista.map(linhaPedidoHTML).join("");
  vazio.hidden = lista.length > 0;

  corpo.querySelectorAll("[data-admin-pedido-detalhes]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalPedido(btn.dataset.adminPedidoDetalhes));
  });
}

/* ---- Modal de Detalhes do Pedido ---- */

let pedidoAtualId = null;

function itemPedidoHTML(item) {
  const imagem = item.produto_imagem || "/assets/images/produtos/placeholder-produto.svg";
  const variacao = [item.tamanho, item.cor].filter(Boolean).join(" · ");

  return `
    <div class="admin-pedido-item">
      <img src="${imagem}" alt="" width="48" height="56" loading="lazy">
      <div class="admin-pedido-item__info">
        <span class="admin-pedido-item__nome">${item.produto_nome || item.produto_id}</span>
        ${variacao ? `<span class="admin-pedido-item__variacao">${variacao}</span>` : ""}
        <span class="admin-pedido-item__qtd">Qtd: ${item.quantidade} × ${formatarPrecoAdmin(item.preco_unitario)}</span>
      </div>
    </div>
  `;
}

function enderecoPedidoTexto(pedido) {
  const linha1 = `${pedido.endereco}, ${pedido.numero}${pedido.complemento ? ` — ${pedido.complemento}` : ""}`;
  const linha2 = [pedido.bairro, pedido.cidade, pedido.estado].filter(Boolean).join(", ");
  return `${linha1}<br>${linha2}<br>CEP: ${pedido.cep}`;
}

async function abrirModalPedido(id) {
  pedidoAtualId = id;
  const modal = document.querySelector("[data-admin-pedido-modal]");
  const carregando = document.querySelector("[data-admin-pedido-carregando]");
  const conteudo = document.querySelector("[data-admin-pedido-conteudo]");
  const aviso = document.querySelector("[data-admin-pedido-aviso]");

  document.querySelector("[data-admin-pedido-titulo]").textContent = `Pedido #${id}`;
  aviso.hidden = true;
  conteudo.hidden = true;
  carregando.hidden = false;
  modal.hidden = false;

  const pedido = await chamarApiAdmin(`/api/admin/pedidos/${id}`);

  carregando.hidden = true;

  if (!pedido) {
    carregando.hidden = false;
    carregando.textContent = "Não foi possível carregar os detalhes deste pedido.";
    return;
  }

  document.querySelector("[data-admin-pedido-itens]").innerHTML = pedido.itens.map(itemPedidoHTML).join("");
  document.querySelector("[data-admin-pedido-endereco]").innerHTML = enderecoPedidoTexto(pedido);
  document.querySelector("[data-admin-pedido-status-pagamento]").value =
    STATUS_PAGAMENTO_LABEL[pedido.status] || pedido.status;
  document.querySelector("[data-admin-pedido-campo-status-envio]").value = pedido.status_envio || "preparando";
  document.querySelector("[data-admin-pedido-campo-rastreio]").value = pedido.codigo_rastreio || "";

  conteudo.hidden = false;
}

function fecharModalPedido() {
  document.querySelector("[data-admin-pedido-modal]").hidden = true;
  pedidoAtualId = null;
}

function inicializarModalPedido() {
  document.querySelectorAll("[data-admin-pedido-modal-fechar]").forEach((el) => {
    el.addEventListener("click", fecharModalPedido);
  });

  document.addEventListener("keydown", (evento) => {
    const modal = document.querySelector("[data-admin-pedido-modal]");
    if (evento.key === "Escape" && !modal.hidden) fecharModalPedido();
  });

  document.querySelector("[data-admin-pedido-salvar]").addEventListener("click", async () => {
    if (!pedidoAtualId) return;
    const aviso = document.querySelector("[data-admin-pedido-aviso]");
    const codigoRastreio = document.querySelector("[data-admin-pedido-campo-rastreio]").value.trim();
    const statusEnvio = document.querySelector("[data-admin-pedido-campo-status-envio]").value;

    try {
      await chamarApiAdmin(`/api/admin/pedidos/${pedidoAtualId}`, {
        method: "PUT",
        body: JSON.stringify({ codigoRastreio, statusEnvio }),
      });
      aviso.hidden = true;
      mostrarToastAdmin("Pedido atualizado com sucesso.");
      fecharModalPedido();
      await carregarEExibirPedidosAdmin();
    } catch (erro) {
      if (erro && erro.deslogado) return;
      aviso.textContent = (erro && erro.mensagem) || "Erro ao salvar as alterações do pedido.";
      aviso.hidden = false;
    }
  });
}

async function carregarEExibirProdutos() {
  produtosCarregados = await listarProdutosAdmin();
  renderizarTabelaProdutos();
}

function produtosFiltrados() {
  return produtosCarregados.filter((produto) => {
    const nome = String(produto.nome || "").toLowerCase();
    const categoria = nomeCategoriaAdmin(produto.categoria).toLowerCase();
    const passaTexto =
      !filtroTextoAtual || nome.includes(filtroTextoAtual) || categoria.includes(filtroTextoAtual);
    const passaCategoria = !filtroCategoriaAtual || produto.categoria === filtroCategoriaAtual;
    return passaTexto && passaCategoria;
  });
}

function linhaProdutoHTML(produto) {
  const imagem = produto.imagem || (produto.imagens && produto.imagens[0]) || "/assets/images/produtos/placeholder-produto.svg";
  const precoDe = produto.precoDe
    ? `<span class="admin-tabela__preco-promo">${formatarPrecoAdmin(produto.precoDe)}</span>`
    : `<span class="admin-tabela__sem-valor">—</span>`;

  const estoque = Number(produto.estoque ?? 0);
  const estoqueClasse = estoque <= 0 ? "admin-tabela__estoque admin-tabela__estoque--zerado" : "admin-tabela__estoque";
  const emDestaque = produto.selo === "Lançamento";

  return `
    <tr data-admin-linha="${produto.id}">
      <td class="admin-tabela__produto">
        <img src="${imagem}" alt="" width="48" height="56" loading="lazy">
        <div>
          <span class="admin-tabela__nome">${produto.nome}</span>
        </div>
      </td>
      <td><span class="admin-badge">${nomeCategoriaAdmin(produto.categoria)}</span></td>
      <td><span class="admin-tabela__preco">${formatarPrecoAdmin(produto.preco)}</span></td>
      <td>${precoDe}</td>
      <td><span class="${estoqueClasse}">${estoque}</span></td>
      <td>
        <label class="admin-switch admin-switch--tabela">
          <input type="checkbox" data-admin-toggle-destaque="${produto.id}" ${emDestaque ? "checked" : ""}>
          <span class="admin-switch__trilho"></span>
        </label>
      </td>
      <td>
        <label class="admin-switch admin-switch--tabela">
          <input type="checkbox" data-admin-toggle-ativo="${produto.id}" ${produto.ativo === false ? "" : "checked"}>
          <span class="admin-switch__trilho"></span>
        </label>
      </td>
      <td class="admin-tabela__acoes">
        <button type="button" class="btn btn--secundario btn--pequeno" data-admin-editar="${produto.id}">Editar</button>
        <button type="button" class="btn btn--secundario btn--pequeno admin-btn-perigo-texto" data-admin-excluir="${produto.id}">Excluir</button>
      </td>
    </tr>
  `;
}

function renderizarTabelaProdutos() {
  const corpo = document.querySelector("[data-admin-tabela-corpo]");
  const vazio = document.querySelector("[data-admin-vazio]");
  const contador = document.querySelector("[data-admin-contador-ativos]");

  const lista = produtosFiltrados();
  corpo.innerHTML = lista.map(linhaProdutoHTML).join("");
  vazio.hidden = lista.length > 0;

  contador.textContent = produtosCarregados.filter((produto) => produto.ativo !== false).length;

  corpo.querySelectorAll("[data-admin-editar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const produto = produtosCarregados.find((item) => item.id === btn.dataset.adminEditar);
      abrirModalProduto(produto || null);
    });
  });

  corpo.querySelectorAll("[data-admin-excluir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      abrirConfirmacaoExclusao(btn.dataset.adminExcluir);
    });
  });

  corpo.querySelectorAll("[data-admin-toggle-ativo]").forEach((toggle) => {
    toggle.addEventListener("change", async () => {
      const id = toggle.dataset.adminToggleAtivo;
      const produto = produtosCarregados.find((item) => item.id === id);
      if (!produto) return;
      produto.ativo = toggle.checked;
      await salvarProdutoAdmin(produto);
      mostrarToastAdmin(toggle.checked ? "Produto ativado na loja." : "Produto desativado da loja.");
      renderizarTabelaProdutos();
    });
  });

  corpo.querySelectorAll("[data-admin-toggle-destaque]").forEach((toggle) => {
    toggle.addEventListener("change", async () => {
      const id = toggle.dataset.adminToggleDestaque;
      const produto = produtosCarregados.find((item) => item.id === id);
      if (!produto) return;
      produto.selo = toggle.checked ? "Lançamento" : null;
      await salvarProdutoAdmin(produto);
      mostrarToastAdmin(
        toggle.checked ? "Produto marcado como destaque na Home." : "Produto removido dos destaques da Home.",
      );
      renderizarTabelaProdutos();
    });
  });
}

/* ---- Modal de Produto ---- */

let imagensProdutoAtual = [];
let indiceArrastoImagem = null;

function renderizarGaleriaUpload() {
  const galeria = document.querySelector("[data-admin-upload-galeria]");
  const previewVazio = document.querySelector("[data-admin-upload-vazio]");
  if (!galeria) return;

  previewVazio.hidden = imagensProdutoAtual.length > 0;

  galeria.innerHTML = imagensProdutoAtual
    .map(
      (url, indice) => `
        <div class="admin-upload__item" draggable="true" data-admin-upload-item="${indice}">
          ${indice === 0 ? '<span class="admin-upload__capa">Capa</span>' : ""}
          <img src="${url}" alt="Foto ${indice + 1} do produto">
          <button type="button" class="admin-upload__remover" data-admin-upload-remover="${indice}" aria-label="Remover esta foto">&times;</button>
        </div>
      `,
    )
    .join("");

  galeria.querySelectorAll("[data-admin-upload-remover]").forEach((botao) => {
    botao.addEventListener("click", () => {
      imagensProdutoAtual.splice(Number(botao.dataset.adminUploadRemover), 1);
      renderizarGaleriaUpload();
    });
  });

  galeria.querySelectorAll("[data-admin-upload-item]").forEach((item) => {
    item.addEventListener("dragstart", () => {
      indiceArrastoImagem = Number(item.dataset.adminUploadItem);
    });
    item.addEventListener("dragover", (evento) => evento.preventDefault());
    item.addEventListener("drop", (evento) => {
      evento.preventDefault();
      const destino = Number(item.dataset.adminUploadItem);
      if (indiceArrastoImagem === null || indiceArrastoImagem === destino) return;
      const [movida] = imagensProdutoAtual.splice(indiceArrastoImagem, 1);
      imagensProdutoAtual.splice(destino, 0, movida);
      indiceArrastoImagem = null;
      renderizarGaleriaUpload();
    });
  });
}

function adicionarImagemAoProduto(url) {
  if (!url) return;
  imagensProdutoAtual.push(url);
  renderizarGaleriaUpload();
}

function inicializarModalProduto() {
  const modal = document.querySelector("[data-admin-modal]");
  const form = document.querySelector("[data-admin-form]");
  const aviso = document.querySelector("[data-admin-form-aviso]");
  const inputArquivo = form.querySelector("[data-admin-campo-arquivo]");
  const inputUrl = form.querySelector("[data-admin-campo-imagem-url]");

  document.querySelectorAll("[data-admin-modal-fechar]").forEach((el) => {
    el.addEventListener("click", fecharModalProduto);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) fecharModalProduto();
  });

  inputArquivo.addEventListener("change", () => {
    Array.from(inputArquivo.files || []).forEach((arquivo) => {
      const leitor = new FileReader();
      leitor.onload = () => adicionarImagemAoProduto(leitor.result);
      leitor.readAsDataURL(arquivo);
    });
    inputArquivo.value = "";
  });

  inputUrl.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    const url = inputUrl.value.trim();
    if (!url) return;
    adicionarImagemAoProduto(url);
    inputUrl.value = "";
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = form.querySelector("[data-admin-campo-nome]").value.trim();
    const categoria = form.querySelector("[data-admin-campo-categoria]").value;
    const preco = form.querySelector("[data-admin-campo-preco]").value;
    const precoDe = form.querySelector("[data-admin-campo-preco-de]").value;
    const selo = form.querySelector("[data-admin-campo-selo]").value;
    const ativo = form.querySelector("[data-admin-campo-ativo]").checked;
    const idExistente = form.querySelector("[data-admin-produto-id]").value;

    const tamanhos = Array.from(form.querySelectorAll('[data-admin-tamanhos] input:checked')).map(
      (input) => input.value,
    );

    if (!nome || !categoria || !(Number(preco) > 0)) {
      aviso.textContent = "Preencha nome, categoria e um preço de venda válido antes de salvar.";
      aviso.hidden = false;
      return;
    }

    const produto = {
      id: idExistente || null,
      nome,
      categoria,
      preco: Number(preco),
      precoDe: precoDe ? Number(precoDe) : null,
      selo: selo || null,
      imagem: imagensProdutoAtual[0] || null,
      imagens: imagensProdutoAtual,
      tamanhos,
      cores: [],
      ativo,
    };

    try {
      await salvarProdutoAdmin(produto);
      aviso.hidden = true;
      fecharModalProduto();
      mostrarToastAdmin("Produto salvo com sucesso!");
      await carregarEExibirProdutos();
    } catch (erro) {
      if (erro && erro.deslogado) return;
      aviso.textContent = (erro && erro.mensagem) || "Erro ao salvar o produto. Tente novamente.";
      aviso.hidden = false;
    }
  });
}

function abrirModalProduto(produto) {
  const modal = document.querySelector("[data-admin-modal]");
  const form = document.querySelector("[data-admin-form]");
  const titulo = document.querySelector("[data-admin-modal-titulo]");
  const aviso = document.querySelector("[data-admin-form-aviso]");

  form.reset();
  aviso.hidden = true;
  form.querySelectorAll('[data-admin-tamanhos] input').forEach((input) => {
    input.checked = false;
  });

  if (produto) {
    titulo.textContent = "Editar Produto";
    form.querySelector("[data-admin-produto-id]").value = produto.id;
    form.querySelector("[data-admin-campo-nome]").value = produto.nome || "";
    form.querySelector("[data-admin-campo-categoria]").value = produto.categoria || "";
    form.querySelector("[data-admin-campo-preco]").value = produto.preco ?? "";
    form.querySelector("[data-admin-campo-preco-de]").value = produto.precoDe ?? "";
    form.querySelector("[data-admin-campo-selo]").value = produto.selo || "";
    form.querySelector("[data-admin-campo-ativo]").checked = produto.ativo !== false;

    (produto.tamanhos || []).forEach((tamanho) => {
      const input = form.querySelector(`[data-admin-tamanhos] input[value="${tamanho}"]`);
      if (input) input.checked = true;
    });

    imagensProdutoAtual = Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? [...produto.imagens]
      : produto.imagem
        ? [produto.imagem]
        : [];
  } else {
    titulo.textContent = "Adicionar Novo Produto";
    form.querySelector("[data-admin-produto-id]").value = "";
    form.querySelector("[data-admin-campo-ativo]").checked = true;
    imagensProdutoAtual = [];
  }

  renderizarGaleriaUpload();

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("is-aberto"));
  document.body.style.overflow = "hidden";
  form.querySelector("[data-admin-campo-nome]").focus();
}

function fecharModalProduto() {
  const modal = document.querySelector("[data-admin-modal]");
  modal.classList.remove("is-aberto");
  document.body.style.overflow = "";
  setTimeout(() => {
    modal.hidden = true;
  }, 200);
}

/* ---- Confirmação de exclusão ---- */

function inicializarConfirmacaoExclusao() {
  const modal = document.querySelector("[data-admin-confirmar-exclusao]");

  document.querySelectorAll("[data-admin-confirmar-cancelar]").forEach((el) => {
    el.addEventListener("click", () => {
      idParaExcluir = null;
      modal.hidden = true;
    });
  });

  document.querySelector("[data-admin-confirmar-ok]").addEventListener("click", async () => {
    if (!idParaExcluir) return;

    try {
      await excluirProdutoAdmin(idParaExcluir);
      mostrarToastAdmin("Produto excluído com sucesso.");
      await carregarEExibirProdutos();
    } catch (erro) {
      mostrarToastAdmin(erro?.mensagem || "Não foi possível excluir o produto.");
    } finally {
      modal.hidden = true;
      idParaExcluir = null;
    }
  });
}

function abrirConfirmacaoExclusao(id) {
  idParaExcluir = id;
  const produto = produtosCarregados.find((item) => item.id === id);
  const mensagem = document.querySelector("[data-admin-confirmar-mensagem]");
  mensagem.textContent = produto
    ? `Tem certeza que deseja excluir "${produto.nome}"? Essa ação não pode ser desfeita.`
    : "Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita.";
  document.querySelector("[data-admin-confirmar-exclusao]").hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarLoginAdmin();
});
