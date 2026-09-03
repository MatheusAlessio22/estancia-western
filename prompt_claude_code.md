# Prompt para Claude Code - Desenvolvimento Estância Western

## Contexto do Projeto

Você vai desenvolver um e-commerce de moda country chamado **Estância Western - Moda Country**, inspirado nas referências: TXC, Texas Farm Store, Wrangler Brasil e Consciência Jeans.

## Instruções Gerais

1. **Leia primeiro** o arquivo `briefing_estancia_western.md` para entender o escopo completo.
2. **Utilize** o arquivo `copy_home_estancia_western.md` para implementar os textos da home.
3. **Aguarde** o cliente enviar os arquivos de identidade visual (logo, cores, fonts) antes de finalizar o design.
4. **Priorize** mobile-first e performance (Core Web Vitals).

## Estrutura de Pastas Sugerida

```
/estancia-western
├── /assets
│   ├── /logos (aguardar envio do cliente)
│   ├── /fonts (aguardar envio do cliente)
│   └── /images
│       ├── /banners
│       ├── /produtos
│       └── /icones
├── /css
│   ├── variables.css (cores, fontes)
│   ├── global.css
│   ├── components.css
│   └── pages.css
├── /js
│   ├── main.js
│   ├── cart.js
│   └── checkout.js
├── /pages
│   ├── index.html (home)
│   ├── categoria.html
│   ├── produto.html
│   ├── sobre.html
│   ├── politicas.html
│   └── contato.html
├── briefing_estancia_western.md
├── copy_home_estancia_western.md
└── README.md
```

## Tarefas Iniciais (Passo a Passo)

### Fase 1: Configuração do Projeto

1. Criar estrutura de pastas conforme acima.
2. Criar arquivo `variables.css` com a paleta de cores do briefing:
   ```css
   :root {
     --cor-marrow-couro: #8B4513;
     --cor-bege-areia: #D2B48C;
     --cor-azul-jeans: #4A5F7F;
     --cor-verde-musgo: #556B2F;
     --cor-off-white: #F5F5DC;
     --cor-preto: #1C1C1C;
     --cor-laranja-queimado: #CC5500;
     --cor-verde-bandeira: #2E5C2E;
   }
   ```
3. Configurar fontes (Playfair Display para títulos, Inter para corpo) via Google Fonts ou arquivos locais (aguardar envio).

### Fase 2: Desenvolvimento da Home

1. Criar `index.html` seguindo a estrutura do briefing:
   - Header com logo, menu de navegação e ícones (busca, carrinho, usuário)
   - Hero banner com copy: "Vista a Alma do Campo"
   - Banner secundário: "Frete Grátis acima de R$ 299"
   - Seção de categorias (grid com 6 categorias)
   - Vitrine de lançamentos (grid de produtos)
   - Vitrine de mais vendidos
   - Seção de diferenciais (ícones + texto)
   - Depoimentos (carousel ou grid)
   - Newsletter (formulário de e-mail)
   - Footer completo (links institucionais, redes sociais, formas de pagamento)

2. Utilizar os textos do arquivo `copy_home_estancia_western.md`.

3. Criar `global.css` com:
   - Reset básico
   - Tipografia
   - Layout responsivo (mobile-first)
   - Classes utilitárias (container, grid, flex, etc.)

4. Criar `components.css` com:
   - Botões (primário, secundário, CTA)
   - Cards de produto
   - Cards de categoria
   - Formulários
   - Depoimentos
   - Newsletter

### Fase 3: Páginas Internas

1. Criar `categoria.html`:
   - Header de categoria (título, breadcrumb)
   - Filtros laterais (tamanho, cor, preço)
   - Grid de produtos
   - Paginação

2. Criar `produto.html`:
   - Galeria de imagens (zoom, thumbnails)
   - Informações do produto (nome, preço, parcelamento)
   - Seletor de tamanho e cor
   - Botão "Adicionar ao Carrinho"
   - Descrição detalhada
   - Tabela de medidas
   - Avaliações
   - Produtos relacionados

3. Criar páginas institucionais (`sobre.html`, `politicas.html`, `contato.html`).

### Fase 4: Funcionalidades

1. Implementar carrinho de compras (JavaScript):
   - Adicionar produto
   - Remover produto
   - Atualizar quantidade
   - Calcular subtotal

2. Implementar checkout simulado (HTML + CSS + JS).

3. Criar formulário de newsletter (integração futura com Mailchimp/RD Station).

4. Adicionar botão flutuante de WhatsApp.

### Fase 5: Otimizações

1. Otimizar imagens (WebP, lazy loading).
2. Implementar meta tags SEO (título, descrição, Open Graph).
3. Adicionar schema markup para produtos.
4. Testar performance (Lighthouse, PageSpeed Insights).

## Arquivos a Serem Enviados pelo Cliente

**Aguardar antes de finalizar o design:**

- [ ] Logotipo em SVG e PNG (alta resolução)
- [ ] Versão monocromática do logo
- [ ] Favicon (512x512 px)
- [ ] Guia de estilo da marca (se houver)
- [ ] Códigos hex exatos das cores
- [ ] Fontes licenciadas (se aplicável)
- [ ] Fotos dos produtos (mín. 4 ângulos por produto)
- [ ] Banners promocionais (1920x600 px, 1200x400 px)
- [ ] Textos institucionais completos
- [ ] Depoimentos reais de clientes

## Critérios de Aceite

- [ ] Site responsivo (mobile, tablet, desktop)
- [ ] Performance: Lighthouse score > 90
- [ ] Acessibilidade: contraste de cores adequado, tags ARIA
- [ ] SEO: meta tags, schema markup, URLs amigáveis
- [ ] Funcional: carrinho, checkout, formulários funcionando
- [ ] Design alinhado com referências (TXC, Wrangler, Texas Farm Store)

## Próximos Passos Imediatos

1. **Cliente:** Enviar arquivos de identidade visual e conteúdo.
2. **Desenvolvedor:** Criar wireframe da home para aprovação.
3. **Cliente:** Aprovar wireframe.
4. **Desenvolvedor:** Iniciar desenvolvimento do tema customizado.

---

**Importante:** Não avance para o design final sem receber os arquivos de identidade visual do cliente. Use placeholders temporários (ex.: logo em texto, cores do briefing) até que os arquivos oficiais sejam enviados.

---

## Atualização — identidade visual já recebida

O cliente já enviou o logotipo (`assets/logos/logo-fundo-escuro.jpg`) e o PDF de disposição de cores (`assets/logos/disposicao-de-cores.pdf`), com a paleta oficial:

- Marrom Couro: `#5F3A2A`
- Bege Areia: `#F4E4D7`
- Monocromático preto: `#1C1C1C`
- Monocromático branco: `#FFFFFF`

`variables.css` já foi atualizado com essas cores reais no lugar dos placeholders acima. Ainda faltam: logo em SVG/PNG com fundo transparente, favicon, fotos de produto, banners e depoimentos reais — o site usa placeholders até isso chegar.

Para visualização direta no navegador, `index.html` foi colocado na raiz do projeto (não em `/pages`), com as demais páginas internas em `/pages` conforme a estrutura acima.
