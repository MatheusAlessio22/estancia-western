/**
 * Sistema de avaliações da página de produto — busca/lista comentários
 * reais via /api/avaliacoes/:produtoId e permite o cliente enviar a sua.
 * Carregado apenas em pages/produto.html, depois de produto-variacoes.js.
 */

const ESTRELA_PONTOS = '10,1 12.5,7 19,7.5 14,12 15.5,18.5 10,15 4.5,18.5 6,12 1,7.5 7.5,7';

function estrelaSVG(preenchida) {
  return `<svg viewBox="0 0 20 20" ${preenchida ? '' : 'fill="none" stroke="currentColor" stroke-width="1"'}><polygon points="${ESTRELA_PONTOS}" ${preenchida ? '' : 'fill="none"'}/></svg>`;
}

function estrelasHTML(nota, { tamanho = 'normal' } = {}) {
  const notaArredondada = Math.round(nota);
  const classe = tamanho === 'grande' ? 'estrelas--grande' : '';
  let html = `<span class="estrelas ${classe}" aria-hidden="true">`;
  for (let i = 1; i <= 5; i += 1) {
    html += estrelaSVG(i <= notaArredondada);
  }
  html += '</span>';
  return html;
}

function formatarDataAvaliacao(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function avaliacaoHTML(avaliacao) {
  return `
    <li class="avaliacao-item">
      <div class="avaliacao-item__topo">
        <span class="avaliacao-item__autor">${escaparHtml(avaliacao.nome_cliente)}</span>
        <span class="avaliacao-item__data">${formatarDataAvaliacao(avaliacao.criado_em)}</span>
      </div>
      <div class="avaliacao-item__estrelas">${estrelasHTML(avaliacao.nota_estrelas)}</div>
      ${avaliacao.comentario ? `<p class="avaliacao-item__comentario">${escaparHtml(avaliacao.comentario)}</p>` : ''}
    </li>
  `;
}

function secaoAvaliacoesHTML() {
  return `
    <div class="avaliacoes-resumo" data-avaliacoes-carregando>
      <p>Carregando avaliações...</p>
    </div>
    <div data-avaliacoes-conteudo hidden>
      <div class="avaliacoes-resumo">
        <div class="avaliacoes-resumo__nota" data-avaliacoes-nota></div>
        <div>
          <div data-avaliacoes-estrelas-grandes></div>
          <p class="avaliacoes-resumo__total" data-avaliacoes-total></p>
        </div>
      </div>

      <ul class="avaliacoes-lista" data-avaliacoes-lista></ul>
      <p class="avaliacoes-vazio" data-avaliacoes-vazio hidden>
        Este produto ainda não tem avaliações. Seja o primeiro a avaliar!
      </p>
    </div>

    <form class="avaliacao-form" data-avaliacao-form novalidate>
      <h3>Deixe sua avaliação</h3>

      <div class="avaliacao-form__campo">
        <span class="avaliacao-form__label">Sua nota</span>
        <div class="avaliacao-form__estrelas" data-avaliacao-form-estrelas role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) => `
            <button type="button" class="avaliacao-form__estrela foco-visivel" data-nota="${n}" role="radio" aria-checked="false" aria-label="${n} ${n === 1 ? 'estrela' : 'estrelas'}">★</button>
          `,
            )
            .join('')}
        </div>
        <p class="campo-erro" data-avaliacao-erro-nota hidden></p>
      </div>

      <div class="avaliacao-form__campo">
        <label for="avaliacao-nome">Seu nome</label>
        <input type="text" id="avaliacao-nome" name="nome" class="avaliacao-form__input" maxlength="100" required>
      </div>

      <div class="avaliacao-form__campo">
        <label for="avaliacao-comentario">Comentário (opcional)</label>
        <textarea id="avaliacao-comentario" name="comentario" class="avaliacao-form__input" rows="3" maxlength="1000"></textarea>
      </div>

      <p class="avaliacao-form__aviso" role="status" aria-live="polite" data-avaliacao-aviso></p>

      <button type="submit" class="btn btn--primario">Enviar Avaliação</button>
    </form>
  `;
}

async function inicializarAvaliacoes(produtoId, { aoCarregarResumo } = {}) {
  const containers = document.querySelectorAll('[data-avaliacoes-secao]');
  if (containers.length === 0) return;

  containers.forEach((container) => {
    container.innerHTML = secaoAvaliacoesHTML();
  });

  async function carregarEExibir() {
    let resultado;
    try {
      const resposta = await fetch(`/api/avaliacoes/${encodeURIComponent(produtoId)}`);
      resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || 'Erro ao carregar avaliações.');
    } catch {
      containers.forEach((container) => {
        container.querySelector('[data-avaliacoes-carregando] p').textContent =
          'Não foi possível carregar as avaliações agora.';
      });
      return;
    }

    const { avaliacoes, total, media } = resultado;

    containers.forEach((container) => {
      container.querySelector('[data-avaliacoes-carregando]').hidden = true;
      const conteudo = container.querySelector('[data-avaliacoes-conteudo]');
      conteudo.hidden = false;

      container.querySelector('[data-avaliacoes-nota]').textContent = total > 0 ? media.toFixed(1) : '—';
      container.querySelector('[data-avaliacoes-estrelas-grandes]').innerHTML = estrelasHTML(media, { tamanho: 'grande' });
      container.querySelector('[data-avaliacoes-total]').textContent =
        total > 0 ? `Baseado em ${total} ${total === 1 ? 'avaliação' : 'avaliações'}` : 'Nenhuma avaliação ainda';

      const lista = container.querySelector('[data-avaliacoes-lista]');
      const vazio = container.querySelector('[data-avaliacoes-vazio]');
      if (avaliacoes.length === 0) {
        lista.innerHTML = '';
        vazio.hidden = false;
      } else {
        vazio.hidden = true;
        lista.innerHTML = avaliacoes.map(avaliacaoHTML).join('');
      }
    });

    // Resumo de estrelas no topo da página (fora dos containers de aba/acordeão)
    const resumoLink = document.querySelector('[data-avaliacoes-resumo]');
    if (resumoLink && total > 0) {
      resumoLink.hidden = false;
      resumoLink.querySelector('[data-avaliacoes-resumo-estrelas]').innerHTML = estrelasHTML(media);
      resumoLink.querySelector('[data-avaliacoes-resumo-texto]').textContent =
        `${media.toFixed(1)} (${total} ${total === 1 ? 'avaliação' : 'avaliações'})`;
    }

    if (typeof aoCarregarResumo === 'function') {
      aoCarregarResumo({ total, media });
    }
  }

  function inicializarFormulario(form) {
    const grupoEstrelas = form.querySelector('[data-avaliacao-form-estrelas]');
    const erroNota = form.querySelector('[data-avaliacao-erro-nota]');
    const aviso = form.querySelector('[data-avaliacao-aviso]');
    const botoesEstrela = Array.from(grupoEstrelas.querySelectorAll('[data-nota]'));
    let notaSelecionada = 0;

    function atualizarEstrelasVisuais(nota) {
      botoesEstrela.forEach((botao) => {
        const valor = Number(botao.dataset.nota);
        botao.classList.toggle('is-selecionada', valor <= nota);
        botao.setAttribute('aria-checked', valor === nota ? 'true' : 'false');
      });
    }

    botoesEstrela.forEach((botao) => {
      botao.addEventListener('click', () => {
        notaSelecionada = Number(botao.dataset.nota);
        atualizarEstrelasVisuais(notaSelecionada);
        erroNota.hidden = true;
      });
    });

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();

      const nomeInput = form.querySelector('#avaliacao-nome');
      const comentarioInput = form.querySelector('#avaliacao-comentario');
      const nome = nomeInput.value.trim();

      if (notaSelecionada === 0) {
        erroNota.hidden = false;
        erroNota.textContent = 'Selecione uma nota de 1 a 5 estrelas.';
        return;
      }

      if (!nome) {
        nomeInput.focus();
        return;
      }

      const botaoEnviar = form.querySelector('button[type="submit"]');
      botaoEnviar.disabled = true;
      aviso.textContent = '';
      aviso.className = 'avaliacao-form__aviso';

      try {
        const resposta = await fetch(`/api/avaliacoes/${encodeURIComponent(produtoId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomeCliente: nome,
            notaEstrelas: notaSelecionada,
            comentario: comentarioInput.value.trim(),
          }),
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          aviso.textContent = dados.erro || 'Não foi possível enviar sua avaliação.';
          aviso.className = 'avaliacao-form__aviso erro';
          return;
        }

        aviso.textContent = 'Avaliação enviada com sucesso. Obrigado pelo feedback!';
        aviso.className = 'avaliacao-form__aviso sucesso';
        form.reset();
        notaSelecionada = 0;
        atualizarEstrelasVisuais(0);

        // Sincroniza a nota selecionada em todos os formulários (desktop + mobile)
        document.querySelectorAll('[data-avaliacao-form]').forEach((outroForm) => {
          if (outroForm !== form) outroForm.reset();
        });

        await carregarEExibir();
      } catch {
        aviso.textContent = 'Não foi possível enviar sua avaliação. Tente novamente.';
        aviso.className = 'avaliacao-form__aviso erro';
      } finally {
        botaoEnviar.disabled = false;
      }
    });
  }

  document.querySelectorAll('[data-avaliacao-form]').forEach(inicializarFormulario);

  await carregarEExibir();
}
