# Estância Western — Moda Country

Protótipo front-end (HTML/CSS/JS puro, sem build step) do e-commerce Estância Western, desenvolvido conforme `prompt_claude_code.md`, `briefing_estancia_western.md` e `copy_home_estancia_western.md`.

## Como visualizar

Os arquivos usam caminhos absolutos (`/css/...`, `/js/...`, `/pages/...`), então é preciso servir a pasta por um servidor local — abrir o `index.html` direto pelo `file://` não vai carregar os estilos/scripts corretamente.

Qualquer servidor estático simples resolve. Exemplos, rodando dentro da pasta `estancia-western`:

```bash
# Node (sem instalar nada, via npx)
npx serve .

# Python 3
python -m http.server 5500
```

Depois acesse `http://localhost:5500` (ou a porta indicada) no navegador.

## Estrutura

```
estancia-western/
├── index.html                  # Home
├── 404.html
├── assets/
│   ├── logos/                  # Logo real + PDF de cores do cliente
│   ├── fonts/                  # (vazio — aguardando fontes licenciadas, se houver)
│   └── images/
│       ├── banners/            # Placeholders de banner/categoria
│       ├── produtos/           # Placeholder de foto de produto
│       └── icones/             # (ícones são SVG inline no HTML — pasta reservada)
├── css/
│   ├── variables.css           # Cores, tipografia, espaçamento
│   ├── global.css              # Reset, tipografia, grid/layout
│   ├── components.css          # Botões, cards, header, footer, etc.
│   └── pages.css               # Estilos de categoria/produto/institucionais/checkout
├── js/
│   ├── products.js             # Catálogo de produtos (dados provisórios)
│   ├── partials.js             # Header/footer compartilhados
│   ├── main.js                 # Menu, busca, newsletter, vitrines
│   ├── cart.js                 # Carrinho (localStorage)
│   └── checkout.js             # Checkout simulado
└── pages/
    ├── categoria.html
    ├── produto.html
    ├── carrinho.html
    ├── checkout.html
    ├── sobre.html
    ├── politicas.html
    ├── contato.html
    └── conta.html               # Placeholder — login/pedidos ficam para a integração com a plataforma
```

## Status atual

- ✅ Fase 1 — Configuração (paleta real do cliente, tipografia, estrutura de pastas).
- ✅ Fase 2 — Home completa com a copy oficial.
- ✅ Fase 3 — Páginas internas (categoria, produto, institucionais).
- ✅ Fase 4 — Carrinho, checkout simulado, newsletter, botão flutuante de WhatsApp.
- ✅ Fase 5 (parcial) — Meta tags, Open Graph, schema markup (Product/ClothingStore), lazy loading, mobile-first. Falta rodar Lighthouse/PageSpeed com imagens finais.

## Pendências do cliente

Ver checklist completo em `briefing_estancia_western.md`. Resumo do que falta para sair do estado "protótipo com placeholders":

- Logo em SVG (temos PNG transparente em alta resolução) + favicon oficial (512×512) — hoje o favicon é um monograma "WS" provisório.
- Fotos reais dos produtos (mín. 4 ângulos cada).
- Banners promocionais em alta resolução.
- Textos institucionais definitivos (Sobre, Políticas) e depoimentos reais — todo conteúdo fictício (depoimentos, avaliações, número de WhatsApp) está marcado no site com um selo "Exemplo".
- Número de WhatsApp e endereço reais (WhatsApp está como placeholder `5500000000000`; CNPJ já é o real: 66.510.101/0001-10).
- Validação da paleta de acentos (verde/laranja) e catálogo definitivo de produtos/preços.
- Decisão da plataforma final (Nuvemshop / Shopify / WooCommerce) para integrar carrinho e pagamento reais — este protótipo simula ambos no front-end.
