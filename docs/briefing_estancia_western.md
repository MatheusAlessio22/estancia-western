# Briefing — Estância Western | Moda Country

## Visão Geral do Projeto

**Cliente:** Estância Western — Moda Country
**Tipo de negócio:** E-commerce de moda country/western
**Referências de mercado:** TXC, Texas Farm Store, Wrangler Brasil, Consciência Jeans

Loja virtual completa para venda de roupas e acessórios country, com identidade visual robusta (couro, jeans, elementos rurais) e experiência de compra confiável e fluida em qualquer dispositivo.

## Público-Alvo

- Homens e mulheres de 18 a 55 anos, moradores de cidades do interior e capitais com forte cultura do agronegócio/rodeio.
- Consumidores de moda country autêntica: jeans, camisas xadrez, botas, chapéus, cintos e acessórios de couro.
- Público que valoriza tradição, qualidade de material e durabilidade, mas espera uma experiência de compra online moderna (frete rápido, parcelamento, atendimento via WhatsApp).

## Identidade Visual (confirmada pelo cliente)

Ativos recebidos: logotipo "Estância Western — Moda Country" (versão principal sobre fundo escuro) e PDF de disposição de cores/monocromia.

**Paleta oficial:**

| Cor | Hex | RGB | Uso |
|---|---|---|---|
| Marrom Couro (principal) | `#5F3A2A` | 95, 58, 42 | Logo, headers, botões primários, textos de destaque |
| Bege Areia / Off-white (principal) | `#F4E4D7` | 244, 228, 215 | Fundos, logo sobre fundo escuro, textos sobre fundo escuro |
| Preto (monocromático) | `#1C1C1C` | 28, 28, 28 | Fundo escuro alternativo, textos |
| Branco (monocromático) | `#FFFFFF` | 255, 255, 255 | Fundos claros, textos sobre fundo escuro |

Tons derivados (para estados de hover, sombras e apoio, gerados a partir da paleta oficial — a confirmar com o cliente):

| Cor | Hex | Uso |
|---|---|---|
| Marrom Escuro | `#402714` | Hover de botões, rodapé |
| Bege Claro | `#FBF3EC` | Fundo de seções alternadas |
| Verde Musgo (acento) | `#556B2F` | Selos/tags promocionais — placeholder, aguardando validação do cliente |
| Laranja Queimado (acento) | `#B5502E` | CTAs de urgência (ex.: "Últimas unidades") — placeholder, aguardando validação do cliente |

O logotipo já possui versão principal (bege sobre marrom) e monocromáticas (branco sobre preto, preto sobre branco), além de monograma "WS" para uso em favicon/ícones. Aguardando do cliente: arquivos vetoriais (SVG) e PNG em alta resolução com fundo transparente.

## Tipografia Recomendada

- **Títulos:** Fraunces (serifada expressiva, com mais personalidade que uma serifada genérica — reforça o tom "moda country premium" nos títulos de maior destaque) — via Google Fonts.
- **Corpo de texto:** Inter (sans-serif, alta legibilidade em telas) — via Google Fonts.

## Estrutura de Páginas

1. **Home** (`index.html`) — vitrine principal, ver `copy_home_estancia_western.md`.
2. **Categoria** (`pages/categoria.html`) — listagem de produtos com filtros (tamanho, cor, preço) e paginação.
3. **Produto** (`pages/produto.html`) — galeria, informações, seleção de variação, produtos relacionados.
4. **Institucionais:**
   - `pages/sobre.html` — história da marca, valores.
   - `pages/politicas.html` — trocas, devoluções, privacidade, entrega.
   - `pages/contato.html` — formulário de contato, WhatsApp, redes sociais, endereço (se houver loja física).

## Checklist de Arquivos Necessários do Cliente

- [x] Logotipo principal (recebido em JPG, fundo escuro)
- [x] Paleta de cores oficial + monocromia (recebido em PDF)
- [x] Logotipo em PNG com fundo transparente, alta resolução (versões marrom e bege recebidas)
- [x] Logo de perfil / imagem para redes sociais (recebido — `logo-perfil.png`, `logo-social-textura.png`)
- [ ] Logotipo em SVG ou AI (recebido apenas em PNG até agora)
- [ ] Favicon dedicado em 512×512 px (o site usa um monograma "WS" provisório gerado localmente)
- [ ] Guia de estilo completo da marca (se houver, além do PDF de cores)
- [ ] Fontes licenciadas, se a marca não usar Google Fonts
- [ ] Fotos dos produtos (mín. 4 ângulos por produto, fundo neutro)
- [ ] Banners promocionais (1920×600 px para desktop, 1200×400 px para mobile)
- [ ] Textos institucionais completos (história da marca, políticas)
- [ ] Depoimentos reais de clientes (nome, foto opcional, texto)

## Plataformas Recomendadas

Para lançamento definitivo com carrinho, pagamento e gestão de pedidos, avaliar:

- **Nuvemshop** — melhor custo-benefício para moda no Brasil, boa integração com marketplaces.
- **Shopify** — mais robusto internacionalmente, exige apps pagos para recursos avançados.
- **WooCommerce (WordPress)** — mais flexível e customizável, exige manutenção técnica maior.

O protótipo estático (HTML/CSS/JS) desenvolvido nesta primeira fase serve como tema/base visual e pode ser adaptado ao tema da plataforma escolhida.

## Funcionalidades Essenciais

- Carrinho de compras persistente (localStorage no protótipo).
- Checkout simulado (fluxo completo de UI, sem gateway de pagamento real nesta fase).
- Busca de produtos.
- Filtros de categoria (tamanho, cor, preço).
- Formulário de newsletter (estrutura pronta para integração futura com Mailchimp/RD Station).
- Botão flutuante de WhatsApp.
- Avaliações de produto (estrutura de UI).

## SEO e Performance

- Mobile-first, responsivo (mobile / tablet / desktop).
- Meta tags (title, description, Open Graph) em todas as páginas.
- Schema markup (Product, BreadcrumbList) nas páginas de produto e categoria.
- Imagens otimizadas (WebP quando possível, lazy loading).
- Meta de performance: Lighthouse > 90.
- URLs amigáveis e hierarquia de headings semântica.

## Cronograma Sugerido

| Semana | Entrega |
|---|---|
| 1 | Configuração do projeto, paleta e tipografia, wireframe da home |
| 2 | Desenvolvimento da Home completa |
| 3 | Páginas de Categoria e Produto |
| 4 | Páginas institucionais + funcionalidades (carrinho, checkout, newsletter) |
| 5 | Otimizações (SEO, performance, imagens) |
| 6 | Revisão, ajustes finais e handoff |

## Próximos Passos

1. Cliente envia arquivos pendentes do checklist acima (logo vetorial, fotos de produto, banners, textos, depoimentos).
2. Aprovação do wireframe da home.
3. Desenvolvimento seguindo `prompt_claude_code.md`.
