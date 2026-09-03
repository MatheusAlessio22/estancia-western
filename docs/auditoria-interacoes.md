# Auditoria Final — UX, Animação e Performance (Prompt 12)

> Revisão de fechamento de toda a sequência de prompts (1–11) antes de publicar.
> Referência de implementação: `docs/interacoes-produto.md` (histórico decisão a decisão de cada prompt).

## 1. Itens verificados

### 1.1 Acessibilidade

- **Foco visível:** `:focus-visible` global em `css/global.css` + classe utilitária `.foco-visivel` (com `box-shadow` extra) aplicada em swatches, cards, links de menu/busca/dropdown. Verificado nos componentes de drawer, menu mobile, busca, dropdown de categorias, seletor de cor/tamanho e abas do produto.
- **Ordem de Tab:** verificada no drawer de carrinho, menu mobile e busca — todos implementam *focus trap* (`Tab`/`Shift+Tab` presos nos elementos focáveis do próprio container) e devolvem o foco ao elemento que abriu o overlay quando fechado.
- **ARIA:** `role="dialog"` + `aria-modal="true"` no drawer e na caixa de busca; `aria-expanded`/`aria-haspopup`/`aria-controls` no toggle de categorias e no botão de busca; `aria-pressed` nos seletores de cor/tamanho; `aria-label` em todos os botões só-ícone.
- **`aria-live`:** já existia em `data-status-cor`/`data-status-tamanho` (produto.html). Auditoria encontrou **dois pontos sem `aria-live`** e corrigiu:
  - Aviso de sucesso/erro da newsletter (`index.html`) — adicionado `role="status" aria-live="polite"`.
  - Toast global (`js/main.js`, função `mostrarToast`) — adicionado `role="status" aria-live="polite"` na criação do elemento.
- **Semântica e formulário de checkout:** o formulário (`pages/checkout.html` + `js/checkout.js`) validava campos obrigatórios visualmente, mas não marcava `aria-invalid` nem associava a mensagem de erro ao campo via `aria-describedby`, e só rolava a tela até o primeiro erro sem mover o foco. Corrigido em `js/checkout.js`: cada campo inválido recebe `aria-invalid="true"`, `aria-describedby` apontando para um `id` gerado no próprio `span.campo-erro` (com `role="alert"`), e o foco é movido para o primeiro campo inválido após o envio. Testado de ponta a ponta em homologação (preenchimento incompleto → erro anunciável e foco correto; preenchimento completo → pedido confirmado).
- **Fechamento com Esc:** confirmado no drawer de carrinho, menu mobile, busca e dropdown de categorias — todos escutam `Escape` e fecham, devolvendo o foco.
- **Contraste:** conferidos os pares de cor mais arriscados — `--cor-texto-claro` (bege areia) sobre `--cor-preto` no `.header__topo` e no overlay escuro do hero, `.eyebrow` sobre o gradiente do hero — todos com contraste alto, sem ajustes necessários.

### 1.2 Movimento

- Confirmada a regra global de `prefers-reduced-motion` em `css/global.css`: zera `animation-duration`, `animation-delay`, `transition-duration` e força `animation-iteration-count: 1` — cobre também a animação de entrada do hero (Prompt 11) e o spinner de loading dos botões.
- Nenhum loop decorativo puro encontrado. O único `animation ... infinite` do projeto é `btn-girar` (spinner de carregamento dos botões `.is-carregando`) — funcional, não decorativo, e já reduzido a um frame estático sob `prefers-reduced-motion`.
- `atencao-shake` (feedback de seleção obrigatória não preenchida) é um shake único de 300ms, sem repetição — dentro do limite razoável, não é "tremor excessivo".
- Maior duração de animação do projeto é a entrada do hero, 700ms — ajustada nesta fase a pedido do cliente (curva `cubic-bezier(0.16, 1, 0.3, 1)` para suavizar a transição que estava "seca" no carregamento da página, em desktop e mobile). Não há transições de UI acima de ~700ms.

### 1.3 Mobile

- **Alvos de toque:** auditoria mediu (via inspeção computada no navegador) os controles interativos e encontrou **quatro componentes abaixo de 44×44px**, todos corrigidos:
  - `.btn-icone` (ícones do header: menu, busca, conta, carrinho, fechar menu/busca) — 40×40px → **44×44px**.
  - `.btn--pequeno` (usado no botão "Adicionar ao Carrinho" dos cards de produto, "Limpar Filtros" e CTA de busca sem resultado) — altura renderizada ~36,8px → adicionado `min-height: 44px`.
  - `.filtros__tamanho` (chips de filtro de tamanho na página de categoria) — 40×36px → **44×44px**.
  - `.paginacao button`/`span` — 36×36px → **44×44px**.
  - Os seletores de cor/tamanho da página de produto já estavam corretos em 44×44px desde o Prompt 3–5.
- **Dependência de hover:** nenhum componente depende exclusivamente de `:hover` para revelar informação ou ação — todos os estados hover têm equivalente por clique/toque (swatches, cards, dropdown por clique, não por hover).
- **Menus e drawer:** menu mobile, busca e drawer de carrinho testados em viewport 375×812 — abrem, fecham, tratam foco e permitem rolagem do conteúdo sem sobreposição.

### 1.4 Performance

- Animações do projeto usam majoritariamente `transform` e `opacity` (hero, cards, swatches, dropdown, busca, drawer, spinner). Exceções verificadas: `border-color`/`background-color`/`color` em transições de estado de botão e campo — são propriedades baratas (não disparam layout/paint em cascata) e de curta duração (150–220ms), portanto aceitável.
- Imagens de produto/card usam `width`/`height` explícitos ou `aspect-ratio` no container (`.card-produto__imagem`), reservando espaço e evitando *layout shift*.
- Não foram encontrados listeners duplicados, polling desnecessário ou dependências novas — o projeto usa apenas `prettier`, `stylelint` e `vite` como devDependencies (nenhuma lib de runtime).
- **Achado não corrigido nesta entrega:** `assets/logos/logo-social-textura.png` tem 1,6MB e é usado apenas na tag `og:image`/JSON-LD (não é renderizado na página para o visitante comum, só buscado por crawlers de redes sociais ao gerar preview de link). Ver seção 3.

### 1.5 Estados

- **Loading:** `.btn.is-carregando` (spinner + texto oculto) usado no drawer/quick-add.
- **Vazio:** carrinho vazio (`carrinho.html`) e drawer sem item (`carrinho-drawer.js`) têm bloco dedicado com CTA para continuar comprando.
- **Erro:** validação de cor/tamanho obrigatórios no produto (mensagem + shake + `aria-invalid`); validação de e-mail da newsletter; validação de campos do checkout (agora com `aria-invalid`/`aria-describedby`, ver 1.1).
- **Desabilitado:** `[disabled]` em botões (opacidade reduzida, `cursor: not-allowed`, `pointer-events: none` durante loading).
- **Sem estoque:** swatches de cor/tamanho indisponíveis têm `disabled`, `aria-label` com sufixo "indisponível" e estilo riscado — porém o catálogo mock (`js/products.js`) não tem estoque por variante real; é um campo opcional (`coresIndisponiveis`/`tamanhosIndisponiveis`) que a integração futura deve popular (já documentado em `docs/interacoes-produto.md`).
- **Sucesso:** confirmação de pedido no checkout (ícone, número do pedido, mensagem), toast de "produto adicionado", aviso de newsletter cadastrada — todos visíveis e agora corretamente anunciados a leitores de tela.

### 1.6 Consistência visual

- Cores, bordas (`--raio-borda`/`--raio-borda-lg`), sombras (`--sombra-card`/`--sombra-elevada`/`--sombra-foco`) e tempos/curvas de motion (`--motion-duracao-*`, `--motion-entrada`, `--motion-estado`, `--escala-hover`/`--escala-active`) seguem os tokens definidos em `css/variables.css` em todos os componentes revisados. A única exceção deliberada é a curva/duração da entrada do hero (Prompt 11), que usa valores literais (`700ms cubic-bezier(0.16, 1, 0.3, 1)`) por ser uma animação única de entrada de página, mais longa que os tokens de interação padrão — decisão já registrada em `docs/interacoes-produto.md`.

### 1.7 Qualidade (lint, build)

- `npm run lint:css` — **9 erros encontrados, todos corrigidos** (ver seção 2). Saída final: 0 problemas.
- `npm run build` (Vite) — build concluído com sucesso antes e depois dos ajustes. Os avisos `<script ...> can't be bundled without type="module"` são esperados: o site não usa módulos ES nem depende do bundle do Vite para produção (é servido como HTML/CSS/JS estático), então não são erros de build.
- Não há suíte de testes automatizados configurada no projeto (`package.json` não define `test`) — verificação funcional feita manualmente/via Playwright neste ciclo (ver seção 4).

## 2. Ajustes realizados

| Arquivo | Ajuste |
|---|---|
| `css/components.css` | `.btn-icone` 40×40px → 44×44px |
| `css/components.css` | `.btn--pequeno` recebeu `min-height: 44px` |
| `css/pages.css` | `.filtros__tamanho` 40×36px → 44×44px |
| `css/pages.css` | `.paginacao button/span` 36×36px → 44×44px |
| `index.html` | `aria-live="polite"`/`role="status"` no aviso da newsletter |
| `js/main.js` | `aria-live="polite"`/`role="status"` no toast global |
| `js/checkout.js` | `aria-invalid`, `aria-describedby` (com `id` gerado) e `role="alert"` no erro; foco movido ao primeiro campo inválido no envio |
| `css/global.css` | `clip: rect(0,0,0,0)` (depreciado) → `clip-path: inset(50%)` em `.sr-only`; linha em branco antes de regra aninhada |
| `css/components.css` | Reordenação de `.card-categoria:hover img` e `.card-produto:hover .card-produto__imagem img` (movidas para o fim do arquivo, mesmo padrão já usado no projeto) para resolver `no-descending-specificity` — sem alteração de comportamento visual |
| `css/pages.css` | Reordenação de `.produto-info__avaliacao .estrelas svg` (movida para o fim do arquivo) pelo mesmo motivo — sem alteração de comportamento visual |
| `css/components.css` / `css/pages.css` | Linhas em branco adicionadas antes de duas regras (`rule-empty-line-before`) |

Todos os ajustes foram revalidados no navegador (desktop 1440×900 e mobile 375×812): cabeçalho, cards de produto, filtros de categoria, paginação e fluxo de checkout completo (preenchimento inválido → erro acessível com foco; preenchimento válido → confirmação de pedido).

## 3. Problemas não resolvidos e motivo

- **`npx prettier --check` aponta quase todos os arquivos do projeto (inclusive páginas nunca tocadas nesta fase):** não há `.prettierrc` no projeto, então o Prettier está comparando com as regras padrão dele, que não correspondem ao estilo já consolidado no código (ex.: aspas, quebras de linha em HTML). Os arquivos que eu de fato editei nesta auditoria (`css/global.css`, `js/checkout.js`, `js/main.js`, `css/components.css`, `css/pages.css`, `index.html`) foram verificados manualmente e mantêm o estilo do restante do arquivo. Rodar `prettier --write` em todo o projeto agora geraria um diff enorme e fora do escopo desta entrega ("não faça mudanças de escopo"); se o time quiser padronizar a formatação, o correto é primeiro adicionar um `.prettierrc` alinhado ao estilo atual e então rodar `--write` como uma tarefa dedicada, revisada separadamente.

- **`logo-social-textura.png` com 1,6MB:** usado só como `og:image`/imagem do JSON-LD, não afeta o carregamento da página para o visitante. Não foi comprimido/convertido nesta entrega porque otimizar ou substituir a imagem é uma decisão de asset/conteúdo (não uma correção de interação/animação) e o prompt pede para não alterar conteúdo comercial sem aprovação. Recomenda-se ao cliente gerar uma versão `.jpg`/`.webp` de até ~300KB para essa tag.
- **Escrita em `localStorage` sem `try/catch`** (`js/cart.js`, função de salvar carrinho): a leitura já é protegida, mas `localStorage.setItem` pode lançar exceção em modo privado do Safari ou com armazenamento cheio. Não corrigido nesta auditoria por ser uma mudança de tratamento de erro além do escopo de "componentes interativos e animações" definido no Prompt 12; sinalizado aqui para decisão do time técnico.
- **Estoque por variante (cor × tamanho) ainda é mock:** `tamanhosIndisponiveis`/`coresIndisponiveis` funcionam corretamente quando presentes, mas o catálogo de exemplo não usa esse campo por padrão — é uma limitação de dados, não de interação, já registrada desde o Prompt 1 em `docs/interacoes-produto.md`.

## 4. Roteiro de testes manuais para o cliente

Testar em **desktop** (Chrome/Edge/Firefox) e em **um celular real** (Android e/ou iPhone), com conexão normal e, se possível, simulando 3G lento nas ferramentas de desenvolvedor.

1. **Home:** carregar a página e observar a entrada do banner (título, texto e botões devem aparecer em sequência suave, sem "pulo" brusco). Recarregar a página 2–3 vezes para confirmar consistência.
2. **Menu e busca (mobile):** abrir o menu hambúrguer, navegar por Tab, fechar com o X, com clique fora e com Esc. Repetir para a busca (abrir, digitar um produto, ver resultados, fechar).
3. **Categorias (desktop):** abrir o dropdown "Categorias" no header, navegar pelas opções, fechar clicando fora e com Esc.
4. **Filtro por tamanho (categoria):** tocar nos chips de tamanho na listagem de categoria — devem responder ao toque com folga (sem precisar acertar um alvo pequeno).
5. **Página de produto:** selecionar cor e tamanho; tentar "Adicionar ao Carrinho" sem selecionar tamanho e confirmar que aparece aviso claro (com leve tremor) indicando o campo pendente.
6. **Adicionar ao carrinho:** confirmar que o painel lateral (drawer) abre mostrando o item, permite continuar comprando ou ir para o carrinho, fecha com Esc/clique fora, e devolve o foco ao botão que abriu.
7. **Carrinho vazio:** esvaziar o carrinho e confirmar que aparece a mensagem de carrinho vazio com botão para ver produtos.
8. **Checkout — erro:** ir para o checkout com item no carrinho e tentar confirmar o pedido sem preencher os campos. Confirmar que o foco vai para o primeiro campo com erro e a mensagem "Campo obrigatório." aparece.
9. **Checkout — sucesso (compra de ponta a ponta):** preencher todos os campos obrigatórios (endereço + pagamento) e confirmar o pedido. Verificar a tela de confirmação com número do pedido e que o carrinho foi esvaziado.
10. **Newsletter:** cadastrar um e-mail inválido (ver mensagem de erro) e depois um e-mail válido (ver mensagem de sucesso).
11. **Modo de movimento reduzido:** ativar "Reduzir movimento" nas configurações de acessibilidade do sistema operacional, recarregar a home e confirmar que o banner aparece imediatamente, sem animação.
12. **Rodapé e WhatsApp flutuante:** confirmar que os links do rodapé e o botão flutuante de WhatsApp abrem corretamente.

## 5. Recomendações de evolução (fora do escopo desta entrega)

- Comprimir/otimizar `logo-social-textura.png` (ou substituir por uma versão `.webp` com fallback `.jpg`) antes do lançamento público, para reduzir o peso da pré-visualização em redes sociais.
- Quando houver fotografia real do produto/banner, aplicar as dimensões recomendadas já documentadas em `docs/interacoes-produto.md` (hero desktop 1920×900, mobile ~960×1200) e imagens reais por variação de cor (`produto.imagensPorCor`), hoje apenas um ponto de integração marcado no código.
- Adotar dados reais de estoque por variante (cor × tamanho) assim que a integração com o sistema de estoque existir, substituindo os campos mock `coresIndisponiveis`/`tamanhosIndisponiveis`.
- Considerar adicionar testes automatizados (mesmo que básicos, ex. Playwright) para os fluxos críticos (adicionar ao carrinho, checkout, validação de formulário), já que o projeto hoje depende de verificação manual.
- Avaliar máscara de input para telefone, CEP, número/validade/CVV do cartão no checkout — hoje aceitam texto livre; não é um problema de acessibilidade ou animação, mas melhora a experiência de preenchimento.
