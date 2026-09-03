/**
 * Seletores de variação da página de produto — componentes reutilizáveis.
 * Carregado apenas em pages/produto.html, depois de products.js.
 *
 * DEV: não há estoque por variante no catálogo mock (js/products.js).
 * `produto.tamanhosIndisponiveis` / `produto.coresIndisponiveis` são campos
 * opcionais que, se presentes no objeto do produto, marcam essas opções
 * como indisponíveis. Substituir por dados reais de estoque por variante
 * quando a integração existir.
 */

/**
 * Nomes das cores oficiais da marca (css/variables.css) e das variações já
 * usadas no catálogo mock. Hex fora deste mapa cai no fallback "Cor {hex}".
 */
const NOMES_CORES = {
  '#5F3A2A': 'Marrom Couro',
  '#402714': 'Marrom Escuro',
  '#F4E4D7': 'Bege Areia',
  '#FBF3EC': 'Bege Claro',
  '#1C1C1C': 'Preto',
  '#FFFFFF': 'Branco',
  '#556B2F': 'Verde Musgo',
  '#B5502E': 'Laranja Queimado',
  '#2B3A55': 'Azul Jeans',
  '#D9C3A8': 'Areia Clara',
};

function nomeCor(hex) {
  return NOMES_CORES[hex.toUpperCase()] || `Cor ${hex}`;
}

function renderizarSeletorTamanho(produto, { aoSelecionar } = {}) {
  const container = document.querySelector('[data-seletor-tamanhos]');
  const status = document.querySelector('[data-status-tamanho]');
  if (!container) return { obterSelecionado: () => null };

  const indisponiveis = new Set(produto.tamanhosIndisponiveis || []);
  let tamanhoSelecionado = null;

  container.innerHTML = produto.tamanhos.map((tamanho) => {
    const disabled = indisponiveis.has(tamanho);
    return `
      <button
        type="button"
        class="foco-visivel"
        data-tamanho="${tamanho}"
        aria-pressed="false"
        ${disabled ? `disabled aria-label="Tamanho ${tamanho}, indisponível"` : `aria-label="Tamanho ${tamanho}"`}
      >${tamanho}</button>
    `;
  }).join('');

  container.querySelectorAll('button[data-tamanho]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;

      container.querySelectorAll('button[data-tamanho]').forEach((b) => {
        b.classList.remove('is-selecionado');
        b.setAttribute('aria-pressed', 'false');
      });

      btn.classList.add('is-selecionado');
      btn.setAttribute('aria-pressed', 'true');
      tamanhoSelecionado = btn.dataset.tamanho;

      if (status) {
        status.textContent = `Tamanho ${tamanhoSelecionado} selecionado.`;
      }

      if (typeof aoSelecionar === 'function') {
        aoSelecionar(tamanhoSelecionado);
      }
    });
  });

  return {
    obterSelecionado: () => tamanhoSelecionado,
  };
}

/**
 * DEV: não existe mapeamento de imagem por cor no catálogo mock. Quando a
 * integração real existir, esperamos algo como `produto.imagensPorCor[hex]`
 * (uma URL por variação de cor). Até lá, a troca de cor não altera a
 * imagem principal — o ponto de integração fica marcado abaixo.
 */
function renderizarSeletorCor(produto, { aoSelecionar } = {}) {
  const bloco = document.querySelector('[data-bloco-cores]');
  const container = document.querySelector('[data-seletor-cores]');
  const titulo = document.querySelector('[data-titulo-cor]');
  const status = document.querySelector('[data-status-cor]');

  if (produto.cores.length <= 1) {
    if (bloco) bloco.hidden = true;
    return { obterSelecionado: () => produto.cores[0] || null };
  }

  if (!container) return { obterSelecionado: () => null };

  const indisponiveis = new Set(produto.coresIndisponiveis || []);
  let corSelecionada = null;

  const atualizarTitulo = (hex) => {
    if (!titulo) return;
    titulo.textContent = hex ? `Cor: ${nomeCor(hex)}` : 'Escolha uma cor';
  };

  container.innerHTML = produto.cores.map((hex) => {
    const disabled = indisponiveis.has(hex);
    const nome = nomeCor(hex);
    return `
      <button
        type="button"
        class="seletor-cores__swatch foco-visivel"
        data-cor="${hex}"
        style="background-color:${hex}"
        aria-pressed="false"
        title="${nome}"
        ${disabled ? `disabled aria-label="${nome}, indisponível"` : `aria-label="${nome}"`}
      ></button>
    `;
  }).join('');

  atualizarTitulo(null);

  container.querySelectorAll('button[data-cor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;

      container.querySelectorAll('button[data-cor]').forEach((b) => {
        b.classList.remove('is-selecionado');
        b.setAttribute('aria-pressed', 'false');
      });

      btn.classList.add('is-selecionado');
      btn.setAttribute('aria-pressed', 'true');
      corSelecionada = btn.dataset.cor;

      const nome = nomeCor(corSelecionada);
      atualizarTitulo(corSelecionada);

      if (status) {
        status.textContent = `Cor ${nome} selecionada.`;
      }

      // Ponto de integração: se produto.imagensPorCor existir, trocar a
      // imagem principal aqui com fade curto (ver renderizarGaleria no
      // Prompt 7). Sem esse dado, a imagem principal permanece a mesma.

      if (typeof aoSelecionar === 'function') {
        aoSelecionar(corSelecionada);
      }
    });
  });

  return {
    obterSelecionado: () => corSelecionada,
  };
}
