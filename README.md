# Estância Western — Moda Country

E-commerce oficial da marca **Estância Western**, especializado em moda country autêntica, calçados e vestuário western premium.

- 🌐 **Domínio oficial:** [https://www.estanciawestern.com.br](https://www.estanciawestern.com.br)
- ⚙️ **Painel do Lojista:** `/pages/admin.html`

---

## Estrutura Organizada do Projeto

```
SITE - ESTÂNCIA WESTERN/
├── estancia-western/              # Aplicação principal (Front-End & Back-End)
│   ├── assets/                    # Logos oficiais, ícones e fotos de produtos
│   ├── css/                       # Estilos globais, variáveis e componentes
│   ├── docs/                      # Toda a documentação e roteiros do projeto
│   │   ├── briefing_estancia_western.md
│   │   ├── copy_home_estancia_western.md
│   │   ├── ROTEIRO_PROXIMOS_PASSOS.md
│   │   ├── auditoria-interacoes.md
│   │   └── interacoes-produto.md
│   ├── js/                        # Lógica da loja, carrinho, checkout e painel
│   ├── pages/                     # Páginas internas (produto, checkout, admin, etc.)
│   ├── server/                    # Servidor Node.js, Express, banco de dados e APIs
│   │   ├── data/                  # Banco SQLite local (estancia.db)
│   │   └── src/                   # Rotas, serviços (Mercado Pago, Frete) e DB
│   ├── index.html                 # Página inicial da loja
│   ├── 404.html                   # Página de erro customizada
│   └── package.json               # Dependências e scripts de automação
├── logos-originais/               # Arquivos brutos de identidade visual
├── produtos/                      # Arquivos de fotos brutas enviadas pelo cliente
│   └── botinas/                   # Fotos das primeiras Botinas F-1000
├── prompts/                       # Prompts e especificações técnicas de IA
└── screenshots/                   # Capturas de tela de testes e validações visuais
```

---

## Como Rodar Localmente

Dentro da pasta `estancia-western`:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Vite)
npm run dev

# Iniciar servidor backend com API e banco
npm run server

# Sincronizar catálogo local com o banco de dados
npm run db:sync
```

---

## Status do Projeto

- ✅ **Front-End Completo:** Home, Categorias, Página de Produto com Galeria/Zoom, Carrinho Drawer, Checkout Transparente.
- ✅ **Catálogo Ativo:** Botinas F-1000 cadastradas com fotos reais, tamanhos 37 ao 44 e selos promocionais.
- ✅ **Back-End & Banco:** Node.js Express integrado com banco de dados relacional e rotas protegidas para administradores.
- ✅ **Pagamentos:** Checkout PIX com SDK oficial do Mercado Pago (QR Code e Copia e Cola instantâneos).
- ✅ **Painel Administrativo:** Interface para o lojista cadastrar produtos, subir fotos, alterar preços e gerenciar o catálogo.
- ✅ **Deploy em Produção:** Publicado na Vercel e configurado no domínio oficial `estanciawestern.com.br` com SSL ativo.
