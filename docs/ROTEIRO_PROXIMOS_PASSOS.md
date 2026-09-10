# 🤠 Roteiro Completo de Próximos Passos — Estância Western
> **Guia Definitivo de Execução e Lançamento:** Do mais importante ao acabamento final para colocar a loja no ar de forma profissional, segura e lucrativa.

---

## 🧭 Índice das Fases
1. [Fase 1: Ativos e Decisões com o Cliente (Prioridade Máxima / Bloqueantes)](#fase-1-ativos-e-decisões-com-o-cliente-prioridade-máxima--bloqueantes)
2. [Fase 2: Polimento Final do Front-End](#fase-2-polimento-final-do-front-end)
3. [Fase 3: Construção e Hospedagem do Back-End](#fase-3-construção-e-hospedagem-do-back-end)
4. [Fase 4: Pagamentos & Integração Mercado Pago](#fase-4-pagamentos--integração-mercado-pago)
5. [Fase 5: Logística, Frete e E-mails Transacionais](#fase-5-logística-frete-e-e-mails-transacionais)
6. [Fase 6: O "Teste de Fogo" (Homologação de Ponta a Ponta)](#fase-6-o-teste-de-fogo-homologação-de-ponta-a-ponta)
7. [Fase 7: Domínio Próprio e Lançamento Oficial (Go-Live)](#fase-7-domínio-próprio-e-lançamento-oficial-go-live)

---

## Fase 1: Ativos e Decisões com o Cliente (Prioridade Máxima / Bloqueantes)
*Sem estes itens, a loja não pode processar vendas reais. Esta é a lista que você deve cobrar do cliente imediatamente:*

- [ ] **1.1 Conta no Mercado Pago Developers:**
  - O cliente deve acessar [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) com a conta jurídica/vendedora dele.
  - Criar uma "Aplicação" e fornecer as **Credenciais de Produção**:
    - `Public Key` (Chave Pública)
    - `Access Token` (Token de Acesso Secreto)
- [ ] **1.2 Registro do Domínio Oficial (`.com.br`):**
  - Registrar no [Registro.br](https://registro.br) (Custo: R$ 40,00/ano). Exemplo: `estanciawestern.com.br`.
- [ ] **1.3 Fotos Reais dos Produtos:**
  - Pelo menos 2 a 4 fotos por produto em alta resolução com boa iluminação (frente, costas, detalhe do tecido/costura).
  - Tabela real de preços, tamanhos disponíveis (P, M, G, GG ou numeração de botas 38 a 44) e estoque inicial.
- [ ] **1.4 Banners Principais da Marca:**
  - 1 Banner Hero Desktop (proporção 1920×600 ou 1920×700).
  - 1 Banner Hero Mobile (proporção 1080×1080 ou 1080×1350 vertical).
  - Fotos de capa para as 6 categorias (Camisas, Calças, Botas, Chapéus, Cintos, Acessórios).
- [ ] **1.5 Contatos Oficiais de Atendimento:**
  - Número oficial do WhatsApp Business da loja.
  - E-mail oficial de suporte (ex: `contato@estanciawestern.com.br` ou Gmail provisório).
  - Cidade/Estado da sede da empresa para constar no rodapé junto ao CNPJ `66.510.101/0001-10`.

---

## Fase 2: Polimento Final do Front-End
*Ajustes rápidos de interface para garantir conversão máxima e zero atrito:*

- [ ] **2.1 Adição do campo Bairro no Checkout:**
  - Inserir o campo `<input id="bairro">` em `pages/checkout.html` para receber o preenchimento automático do ViaCEP.
- [ ] **2.2 Máscara de Telefone e Cartão no Checkout:**
  - Aplicar máscara no telefone: `(00) 00000-0000`.
  - Aplicar formatação no cartão de crédito: `0000 0000 0000 0000` e validade `MM/AA`.
- [ ] **2.3 Substituição dos Placeholders SVGs:**
  - Trocar o `placeholder-hero.svg` e `placeholder-produto.svg` pelas fotos reais enviadas pelo cliente.
- [ ] **2.4 Alerta de Seleção de Variação:**
  - Garantir que se o cliente clicar em "Adicionar ao Carrinho" sem marcar um tamanho ou cor, o seletor dê um feedback visual nítido (borda vermelha suave com aviso).
- [ ] **2.5 Campo de Cupom de Desconto:**
  - Adicionar campo discreto de cupom no resumo lateral do carrinho/checkout (`"Possui um cupom? [Aplicar]"`).

---

## Fase 3: Construção e Hospedagem do Back-End
*A engrenagem do servidor que processa os dados com segurança:*

- [ ] **3.1 Definição da Hospedagem do Banco de Dados:**
  - **Recomendado:** Criar projeto gratuito no [Supabase](https://supabase.com) (PostgreSQL na nuvem) OU usar o SQLite local hospedado no [Render.com](https://render.com) com disco persistente.
- [ ] **3.2 Proteção de Variáveis de Ambiente:**
  - Criar o arquivo `.env` seguro no servidor com:
    - `PORT=3000`
    - `MERCADOPAGO_ACCESS_TOKEN=APP_USR-...`
    - `FRETE_GRATIS_VALOR_MINIMO=299`
    - `DATABASE_URL=...`
  - Garantir que o `.env` esteja listado no `.gitignore` para nunca subir para o GitHub público.
- [ ] **3.3 Blindagem de Preços no Servidor:**
  - O backend deve receber apenas `{ id, quantidade, tamanho, cor }` e recalcular todo o valor do pedido consultando a tabela de produtos oficial.
- [ ] **3.4 Rate Limiting & Segurança HTTP:**
  - Ativar `express-rate-limit` (para evitar robôs tentando derrubar o site ou forçar checkout) e `helmet`.
  - Configurar CORS apenas para o domínio da loja (`estancia-western.vercel.app` e o domínio `.com.br`).

---

## Fase 4: Pagamentos & Integração Mercado Pago
*O sistema financeiro automatizado:*

- [ ] **4.1 Geração de PIX Dinâmico:**
  - Implementar chamada à API do Mercado Pago (`/v1/payments`) gerando QR Code em Base64 e a chave Pix Copia e Cola instantânea.
  - Definir tempo de expiração do PIX para 30 minutos (com cancelamento automático de pedidos não pagos para liberar o estoque).
- [ ] **4.2 Webhook de Confirmação Automática:**
  - Configurar endpoint `/api/webhooks/mercadopago` para receber a notificação de `payment.updated`.
  - Assim que o cliente pagar no app do banco dele, o backend marca o pedido como `pago` em milissegundos, sem intervenção humana.
- [ ] **4.3 Tela de Confirmação em Tempo Real:**
  - No checkout, manter polling suave (a cada 3s) checando o status do PIX para trocar a tela automaticamente para *"Pagamento Confirmado com Sucesso! Pedido #EW..."*.

---

## Fase 5: Logística, Frete e E-mails Transacionais
*Entregas e comunicação que passam confiança:*

- [ ] **5.1 Integração de Frete:**
  - Manter a regra de Frete Grátis para compras acima de R$ 299.
  - Integrar o cálculo de PAC e SEDEX via API dos Correios ou Melhor Envio para valores exatos conforme o peso e dimensões.
- [ ] **5.2 Serviço de E-mails Automáticos (Resend ou SendGrid):**
  - Criar conta gratuita no [Resend](https://resend.com) (3.000 e-mails/mês grátis).
  - Configurar envio de e-mails bonitos e com a logo da marca:
    1. **E-mail de Pedido Recebido:** com o link/código para pagar o PIX e resumo das peças.
    2. **E-mail de Pagamento Aprovado:** informando que o look está sendo preparado com carinho.
- [ ] **5.3 Rastreamento na Central "Minha Conta":**
  - Conectar a página `pages/conta.html` para que o cliente digite o e-mail e número do pedido e veja em qual etapa está o envio.

---

## Fase 6: O "Teste de Fogo" (Homologação de Ponta a Ponta)
*Validação prática antes de abrir para o público:*

- [ ] **6.1 Teste Real de Compra por PIX:**
  - Cadastrar um produto de teste de R$ 1,00 ou R$ 5,00.
  - Fazer uma compra completa pelo celular, ler o QR Code no seu aplicativo do banco e pagar.
  - Validar se:
    - O dinheiro caiu na conta Mercado Pago do cliente.
    - O site atualizou para "Pago" sozinho.
    - O e-mail de confirmação chegou na caixa de entrada.
- [ ] **6.2 Teste do Botão de WhatsApp:**
  - Clicar no botão flutuante e em "Fale Conosco" e verificar se abre o WhatsApp correto com a mensagem inicial pronta.
- [ ] **6.3 Teste de Responsividade em 3 Dispositivos:**
  - iPhone (Safari).
  - Android (Chrome).
  - Computador / Notebook.

---

## Fase 7: Domínio Próprio e Lançamento Oficial (Go-Live)
*Hora de inaugurar a loja:*

- [ ] **7.1 Apontamento de DNS no Registro.br:**
  - Na Vercel, em *Settings > Domains*, adicionar o domínio oficial (ex: `estanciawestern.com.br`).
  - No painel do Registro.br, apontar os registros DNS (tipo `A` e `CNAME`) conforme as instruções da Vercel.
  - Aguardar a propagação (leva de 30 minutos a 2 horas) e conferir o cadeado de segurança HTTPS ativo.
- [ ] **7.2 Verificação Jurídica e Rodapé:**
  - Conferir se o CNPJ `66.510.101/0001-10` e a Razão Social estão legíveis no rodapé.
  - Revisar a página de Políticas de Trocas e Devoluções (garantindo os 7 dias legais do CDC).
- [ ] **7.3 Primeira Postagem & Anúncios:**
  - Colocar o link na bio do Instagram oficial da Estância Western.
  - Iniciar a divulgação dos lançamentos!

---

*Arquivo gerado para acompanhamento do projeto Estância Western — Moda Country.*
