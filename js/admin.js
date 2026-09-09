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
let idParaExcluir = null;

function inicializarDashboardAdmin() {
  carregarEExibirProdutos();

  if (dashboardJaInicializado) return;
  dashboardJaInicializado = true;

  document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    encerrarSessaoAdmin();
    window.location.reload();
  });

  document.querySelector("[data-admin-novo-produto]").addEventListener("click", () => {
    abrirModalProduto(null);
  });

  document.querySelector("[data-admin-busca-input]").addEventListener("input", (evento) => {
    filtroTextoAtual = evento.target.value.trim().toLowerCase();
    renderizarTabelaProdutos();
  });

  inicializarModalProduto();
  inicializarConfirmacaoExclusao();
}

async function carregarEExibirProdutos() {
  produtosCarregados = await listarProdutosAdmin();
  renderizarTabelaProdutos();
}

function produtosFiltrados() {
  if (!filtroTextoAtual) return produtosCarregados;
  return produtosCarregados.filter((produto) => {
    const nome = String(produto.nome || "").toLowerCase();
    const categoria = nomeCategoriaAdmin(produto.categoria).toLowerCase();
    return nome.includes(filtroTextoAtual) || categoria.includes(filtroTextoAtual);
  });
}

function linhaProdutoHTML(produto) {
  const imagem = produto.imagem || "/assets/images/produtos/placeholder-produto.svg";
  const precoDe = produto.precoDe
    ? `<span class="admin-preco-de">${formatarPrecoAdmin(produto.precoDe)}</span>`
    : "";

  return `
    <tr data-admin-linha="${produto.id}">
      <td class="admin-tabela__produto">
        <img src="${imagem}" alt="" width="48" height="56" loading="lazy">
        <div>
          <span class="admin-tabela__nome">${produto.nome}</span>
        </div>
      </td>
      <td><span class="admin-badge">${nomeCategoriaAdmin(produto.categoria)}</span></td>
      <td>
        ${precoDe}
        <span class="admin-tabela__preco">${formatarPrecoAdmin(produto.preco)}</span>
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
}

/* ---- Modal de Produto ---- */

let arquivoImagemBase64 = "";

function inicializarModalProduto() {
  const modal = document.querySelector("[data-admin-modal]");
  const form = document.querySelector("[data-admin-form]");
  const aviso = document.querySelector("[data-admin-form-aviso]");
  const inputArquivo = form.querySelector("[data-admin-campo-arquivo]");
  const inputUrl = form.querySelector("[data-admin-campo-imagem-url]");
  const preview = form.querySelector("[data-admin-upload-preview]");
  const previewVazio = form.querySelector("[data-admin-upload-vazio]");

  document.querySelectorAll("[data-admin-modal-fechar]").forEach((el) => {
    el.addEventListener("click", fecharModalProduto);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) fecharModalProduto();
  });

  inputArquivo.addEventListener("change", () => {
    const arquivo = inputArquivo.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      arquivoImagemBase64 = leitor.result;
      inputUrl.value = "";
      preview.src = arquivoImagemBase64;
      preview.hidden = false;
      previewVazio.hidden = true;
    };
    leitor.readAsDataURL(arquivo);
  });

  inputUrl.addEventListener("input", () => {
    if (!inputUrl.value.trim()) return;
    arquivoImagemBase64 = "";
    inputArquivo.value = "";
    preview.src = inputUrl.value.trim();
    preview.hidden = false;
    previewVazio.hidden = true;
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
    const imagemUrl = inputUrl.value.trim();
    const imagem = arquivoImagemBase64 || imagemUrl || (preview.hidden ? "" : preview.src);

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
      imagem: imagem || null,
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
  const preview = form.querySelector("[data-admin-upload-preview]");
  const previewVazio = form.querySelector("[data-admin-upload-vazio]");

  form.reset();
  aviso.hidden = true;
  arquivoImagemBase64 = "";
  preview.hidden = true;
  previewVazio.hidden = false;
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

    if (produto.imagem) {
      preview.src = produto.imagem;
      preview.hidden = false;
      previewVazio.hidden = true;
    }
  } else {
    titulo.textContent = "Adicionar Novo Produto";
    form.querySelector("[data-admin-produto-id]").value = "";
    form.querySelector("[data-admin-campo-ativo]").checked = true;
  }

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
    await excluirProdutoAdmin(idParaExcluir);
    modal.hidden = true;
    mostrarToastAdmin("Produto excluído com sucesso.");
    idParaExcluir = null;
    await carregarEExibirProdutos();
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
