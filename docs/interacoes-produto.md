# Auditoria — Componentes Interativos e Animações (Prompt 1)

> Documento de planejamento. Nenhum componente visual foi alterado nesta etapa.
> Gerado antes da implementação da sequência de prompts em `prompts_claude_interacoes_estancia_western.md`.

## 1. Arquitetura encontrada

- **Stack:** HTML/CSS/JS estático, sem framework e sem build obrigatório para rodar (Vite/Stylelint existem só como devDependencies para lint/format, ver `package.json`). Servido por qualquer servidor estático (`npx serve .`, `python -m http.server`).
- **CSS:** 4 arquivos, carregados nesta ordem em todas as páginas: `variables.css` (tokens) → `global.css` (reset, tipografia, layout, utilitários) → `components.css` (header, footer, botões, cards, seletores, abas, toast, formulários) → `pages.css` (estilos específicos de categoria/produto/institucionais/checkout).
- **JS:** sem módulos ES, scripts globais carregados via `<script src>` em sequência fixa: `partials.js` (injeta header/footer) → `products.js` (catálogo mock + helpers) → `cart.js` (carrinho em `localStorage`) → `main.js` (menu mobile, busca, newsletter, toast, vitrines da home) → bloco `<script>` inline por página com a lógica específica daquela página (ex.: produto.html tem toda a lógica de seleção de cor/tamanho/quantidade inline no próprio HTML, linhas 179–331).
- **Rota/página de produto:** `pages/produto.html`. Não há roteador — é uma página estática que lê `?id=` da query string e busca o produto em `PRODUTOS` (array mock em `js/products.js`).
- **Padrão de dados de produto:** objeto simples `{ id, nome, categoria, preco, precoDe?, parcelas, cores: string[] (hex), tamanhos: string[], selo, novo, maisVendido }`. **Não há variantes por combinação cor×tamanho** (sem estoque por variante, sem imagem por cor) — é a limitação mais relevante para os Prompts 3–7.

## 2. Onde cada coisa deve ficar (próximas etapas)

| Necessidade | Arquivo/local |
|---|---|
| Tokens de motion (durações, curvas, sombra, foco, escala) | `css/variables.css` — mesma seção de tokens existente (`:root`), ao lado de `--transicao-rapida`/`--transicao-padrao` já existentes (serão complementados, não duplicados) |
| Suporte global a `prefers-reduced-motion` | `css/global.css` — bloco novo próximo ao reset atual |
| Estados reutilizáveis de botão (hover/active/focus-visible/disabled/loading) | `css/components.css` — já existe `.btn` com variantes `--primario`/`--secundario`; será estendido, não recriado |
| Seletor de tamanho (componente) | `pages/produto.html` (markup) + `css/components.css` (`.seletor-tamanhos`, já existe parcialmente) + lógica extraída do inline script para um novo `js/produto-variacoes.js` |
| Seletor de cor (componente) | mesmo padrão acima — `.seletor-cores` já existe em `components.css`, será estendido com swatches/estado indisponível |
| Lógica de variações de produto (validação, seleção) | novo arquivo `js/produto-variacoes.js`, carregado só em `produto.html`, para não inflar `main.js`/`cart.js` com lógica específica de uma página |
| Drawer lateral de carrinho | novo `js/carrinho-drawer.js` + markup injetado via `partials.js` (o header já é injetado globalmente, o drawer deve seguir o mesmo padrão) + estilos em `components.css` |
| Galeria de produto (zoom, swipe, skeleton) | markup já existe em `produto.html` (`.produto-galeria`); lógica atualmente inline será extraída para `js/produto-variacoes.js` ou um `js/produto-galeria.js` dedicado, a decidir no Prompt 7 conforme volume de código |
| Abas/acordeão de conteúdo do produto | markup já existe (`role="tablist"` em `produto.html`); lógica de toggle já inline, será mantida no local mas revisada para teclado (setas) no Prompt 8 |
| Header, mega menu, busca | `js/main.js` (já contém menu mobile e busca básica) + `css/components.css` (`.menu-mobile`, header) |
| Cards de produto | `js/products.js` já expõe `cartaoProdutoHTML` (helper de template) — será estendido, componente já é reutilizado em home/categoria/produto (relacionados) |
| Hero/banners | `index.html` (markup do hero) + `css/pages.css` (estilos da home) |

## 3. Padrões já existentes que devem ser respeitados

- **Nomenclatura de classes em português**, kebab-case, com BEM leve: `.produto-selecao__titulo`, `.seletor-cores`, `.carrinho-item__remover`. Novos componentes devem seguir o mesmo padrão.
- **Estado ativo/selecionado via classe**, não via atributo de estilo: `is-ativo` (abas, thumbnails, menu mobile) e `is-selecionado` (cor, tamanho) já são usados — os Prompts 3/4 devem reaproveitar essas classes em vez de inventar novas (`is-active`, `selected`, etc.).
- **Seletores de dados (`data-*`) para hooks de JS**, nunca classes CSS usadas como seletor JS: `data-adicionar-carrinho`, `data-seletor-cores`, `data-galeria-principal`, etc. Manter esse padrão em todo componente novo.
- **Toast simples já existe** (`mostrarToast()` em `main.js:138`) para feedback pontual — o drawer do Prompt 6 é um upgrade desse feedback para adição ao carrinho, mas o toast deve continuar existindo para outras mensagens (erro de busca, newsletter, etc.).
- **`:focus-visible` global já definido** em `global.css:65-68` (`outline: 2px solid var(--cor-primaria)`), mas não há uma classe utilitária reaproveitável nem tratamento consistente em todos os componentes customizados (swatches, cards) — isso é o gap que o Prompt 2 fecha.
- **Placeholders de conteúdo fictício já são marcados visualmente** com a classe `.tag-exemplo` (ver `produto.html:54` e `:131`, avaliações e nota são explicitamente sinalizadas como "Exemplo"). Qualquer novo dado mock introduzido pelos próximos prompts (ex.: cores de exemplo do Prompt 4) deve seguir essa mesma convenção de sinalização, não introduzir uma nova.
- **`html { scroll-behavior: smooth; }` já está ativo globalmente** (`global.css:15`) sem guarda de `prefers-reduced-motion` — isso precisa ser corrigido no Prompt 2 (é uma animação "grátis" do navegador que hoje ignora a preferência do usuário).
- **Não há JS type=module nem bundler no fluxo de carregamento** — novos arquivos JS devem ser scripts clássicos, adicionados via `<script src>` na mesma ordem/sequência das tags existentes, e não devem assumir `import`/`export`.

## 4. Gaps identificados (o que ainda não existe)

- Nenhum token de **duração/curva de animação nomeado** — só `--transicao-rapida` (150ms) e `--transicao-padrao` (250ms), sem `ease-out`/`ease-in-out` diferenciados nem uma 3ª duração "lenta".
- Nenhum suporte a `prefers-reduced-motion` em nenhum arquivo CSS ou JS do projeto.
- Nenhum **drawer/modal** existe ainda no projeto (nem carrinho, nem zoom de imagem) — não há padrão de focus-trap para reaproveitar; será criado do zero no Prompt 6, e o Prompt 7 (zoom) deve reaproveitar o mesmo padrão de modal em vez de criar um segundo.
- **Sem dados de estoque por variante nem imagem por cor** no catálogo mock (`js/products.js`). Os Prompts 4–5 (troca de imagem por cor, indisponibilidade de variante) vão precisar de placeholders explícitos de desenvolvimento, documentados no código, sem inventar URLs de imagem ou regras de estoque reais — conforme já orientado nos prompts.
- Seletor de tamanho/cor atual (`produto.html` inline script) **não tem validação, não tem `aria-live`, não tem estado de indisponibilidade, não tem `aria-pressed`** — puramente `classList.toggle`. Será substituído pelo componente dos Prompts 3–5.
- Menu de categorias no header é **só mobile (hambúrguer)** — não há dropdown/mega menu para desktop ainda (Prompt 9 precisa criar do zero, checando primeiro a estrutura real de `CATEGORIAS` em `products.js` para não inventar subcategorias).

## 5. Plano em ordem (confirmado, sem desvios do prompt-sequence)

1. ~~Auditoria (este documento)~~
2. Tokens de motion + base acessível (`variables.css`, `global.css`, `components.css`)
3. Seletor de tamanho (`produto.html`, novo `js/produto-variacoes.js`)
4. Seletor de cor (mesmo componente/arquivo do passo 3)
5. Validação antes de adicionar ao carrinho (mesmo arquivo)
6. Drawer de carrinho (`js/carrinho-drawer.js`, integrado a `cart.js`)
7. Galeria de produto (zoom, loading, swipe)
8. Abas/guia de medidas
9. Header, menu de categorias, busca
10. Cards de produto (vitrines)
11. Hero/banners (entrada de conteúdo)
12. Auditoria final (`docs/auditoria-interacoes.md`)

## Menor solução compatível para o gap mais crítico

O gap que mais bloqueia os Prompts 3–7 é a ausência de variantes por combinação cor×tamanho (estoque, imagem). A menor solução compatível é **não alterar a forma dos dados agora**: os componentes de seleção serão implementados contra a estrutura atual (`cores: string[]`, `tamanhos: string[]`, sem cruzamento), tratando "indisponível" como um estado que só aparece quando explicitamente marcado em um placeholder de desenvolvimento (ex.: um array `tamanhosIndisponiveis` opcional no objeto mock, comentado como temporário) — evitando propor uma migração de schema de dados fora do escopo desta sequência de prompts.

---

**Próximo passo proposto:** Prompt 2 — criar os tokens de motion (durações, curvas, sombra, foco, escala) e os estados reutilizáveis de botão/foco em `css/variables.css`, `css/global.css` e `css/components.css`, com suporte global a `prefers-reduced-motion`. Nenhum componente de produto será tocado nesta próxima etapa.

---

## 6. Galeria de produto (Prompt 7) — como cadastrar imagens reais

A galeria (`js/produto-galeria.js`) já suporta fotos reais por produto sem
nenhuma mudança de código. Hoje `js/products.js` não tem o campo `imagens`
em nenhum produto, então a galeria cai automaticamente no placeholder
genérico repetido (`PLACEHOLDER_IMG`, `TOTAL_FOTOS_PLACEHOLDER = 4`).

**Para cadastrar fotos reais de um produto:** adicionar um array `imagens`
ao objeto do produto em `js/products.js`, com uma URL por foto, na ordem em
que devem aparecer nos thumbnails:

```js
{
  id: "p01",
  nome: "Camisa Xadrez Estância",
  // ...campos existentes...
  imagens: [
    "/assets/images/produtos/p01-camisa-xadrez-01.jpg",
    "/assets/images/produtos/p01-camisa-xadrez-02.jpg",
    "/assets/images/produtos/p01-camisa-xadrez-03.jpg",
  ],
}
```

**Convenção de nome de arquivo sugerida:** `{id-do-produto}-{slug-do-nome}-{indice}.{extensao}`
(ex.: `p01-camisa-xadrez-01.jpg`), salvos em `assets/images/produtos/`.
Formatos recomendados quando a infraestrutura de imagem permitir: `.webp`
como formato principal com fallback `.jpg`/`.png` — hoje o projeto não tem
pipeline de otimização/conversão de imagem, então isso fica documentado
como próximo passo de infraestrutura, não implementado neste prompt.

**Imagem por cor:** o catálogo mock ainda não tem estoque nem imagem por
combinação cor×tamanho (gap já registrado na seção 4 deste documento). Se
o cliente enviar fotos separadas por cor, a convenção recomendada é um
objeto `imagensPorCor` opcional no produto (`{ "#5F3A2A": [...], "#1C1C1C": [...] }`),
com o seletor de cor (`js/produto-variacoes.js`) chamando `renderizarGaleria`
novamente com o array da cor selecionada — ponto de integração já comentado
em `renderizarSeletorCor`. Não implementado agora por não haver dado real
disponível; documentado para não bloquear a integração futura.

**Comportamento implementado nesta etapa:**

- Troca de thumbnail com fade curto (`--motion-duracao-padrao`), mantendo a
  imagem anterior visível até a nova terminar de carregar (`Image().onload`).
- Skeleton neutro (gradiente animado) durante o carregamento da imagem,
  sem mudança de layout — dimensão já reservada via `aspect-ratio: 4/5`.
- Swipe horizontal em mobile via `touchstart`/`touchend`, com `touch-action: pan-y`
  para não bloquear a rolagem vertical da página.
- Zoom por clique ou teclado (Enter/Espaço) na imagem principal — não por
  hover, para funcionar igualmente com mouse, teclado e toque.
- Modal de zoom reaproveita o mesmo padrão de foco/Esc/overlay do drawer de
  carrinho (Prompt 6): foco vai ao botão fechar, Esc e clique no overlay
  fecham, foco retorna ao elemento que abriu o modal, respeita
  `prefers-reduced-motion` (herdado do bloco global já existente).
- Lazy loading nos thumbnails (`loading="lazy"`); a primeira foto principal
  carrega eager por ser a maior candidata a LCP da página.

## 7. Hero/banner da home (Prompt 11) — placeholder e entrada de conteúdo

O hero (`index.html`, seção `.hero`) usa hoje uma única imagem placeholder
(`assets/images/banners/placeholder-hero.svg`, 1920×900) como
`background-image`, sem variante dedicada para mobile. É um SVG gerado
internamente (gradiente + silhueta de chapéu), não um asset enviado pelo
cliente — deve ser substituído assim que houver fotografia real.

**Dimensões recomendadas para quando a foto real for enviada:**

- Desktop: 1920×900px (ou proporção ~16:7.5), otimizada em `.webp` com
  fallback `.jpg`, ponto focal centralizado (o texto ocupa a metade
  esquerda em telas largas).
- Mobile: versão recortada em 3:4 ou 4:5 (ex.: 960×1200px), trocada via
  `<picture>`/`image-set()` ou uma segunda regra de `background-image` em
  `@media (width < 640px)` — não implementado agora por não haver um
  segundo asset para recortar; a imagem única atual serve as duas larguras
  via `background-size: cover`.

**Entrada de conteúdo (implementado nesta etapa):** eyebrow, título, texto
de apoio e CTA do hero (`.hero__conteudo > *`) entram em sequência curta
com fade + deslocamento vertical de 12px (`--motion-duracao-lenta`,
`--motion-entrada`), com um atraso de ~90ms entre cada elemento. Não há
parallax nem qualquer animação contínua no CTA (`.btn` já só reage a
hover/active/disabled). Sob `prefers-reduced-motion: reduce`, o bloco
global em `global.css` zera tanto a duração quanto o atraso da animação
(`animation-delay: 0ms !important`), então o conteúdo aparece
imediatamente, sem esperar a sequência.
