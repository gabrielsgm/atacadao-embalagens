# 📦 Atacado Embalagens

Aplicativo web completo de vendas em atacado para empresas de delivery, especializado em embalagens (isopor, marmitas, potes, sacolas, etc.).

## ✨ Funcionalidades

- 🔐 **Autenticação** — Login/cadastro com aprovação manual pelo admin
- 🛍️ **Catálogo** — Grid de produtos com filtros, busca e ordenação
- 🛒 **Carrinho** — Drawer lateral com seletor de quantidade em pacotes
- 📱 **WhatsApp** — Link automático para confirmação de pedido
- 👤 **Perfil do cliente** — Dados completos com autopreenchimento por CEP (ViaCEP)
- 📋 **Histórico de pedidos** — Com recompra rápida
- 🔄 **Compras recorrentes** — Pedidos automáticos (semanal, quinzenal, multi-dia, mensal)
- 📊 **Dashboard admin** — Métricas, gráficos de faturamento e produtos mais vendidos
- 🗂️ **Gestão de produtos** — CRUD + import em massa via Excel (.xlsx)
- 👥 **Gestão de clientes** — Aprovação/bloqueio + import Excel
- 📈 **Relatório de pedidos** — Com filtros + export Excel
- ⚙️ **Configurações** — WhatsApp, endereço da loja, categorias, recorrências ativas

## 🛠️ Stack

| Tecnologia | Uso |
|-----------|-----|
| **Next.js 14** (App Router) | Framework principal |
| **TypeScript** | Tipagem estática |
| **Tailwind CSS** | Estilização |
| **Prisma** | ORM |
| **Neon** (PostgreSQL) | Banco de dados |
| **NextAuth.js v5** | Autenticação |
| **Cloudinary** | Upload de imagens |
| **Resend** | Envio de e-mails |
| **SheetJS (xlsx)** | Import/Export Excel |
| **Recharts** | Gráficos do dashboard |
| **Vercel Cron** | Processamento de recorrências |

---

## 🚀 Setup Local

### 1. Pré-requisitos

- Node.js 18+
- npm 9+
- Conta gratuita no [Neon](https://neon.tech) (banco de dados)
- Conta gratuita no [Cloudinary](https://cloudinary.com) (imagens)
- Conta gratuita no [Resend](https://resend.com) (e-mails)

### 2. Clonar e instalar

```bash
cd atacado-embalagens
npm install
```

### 3. Configurar variáveis de ambiente

```bash
# Copiar o template
cp .env.example .env.local
```

Preencha o arquivo `.env.local` com suas credenciais (veja a seção de variáveis abaixo).

### 4. Configurar o banco de dados (Neon)

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Crie um novo projeto
3. Copie a **Connection string** (use a URL com `?sslmode=require`)
4. Cole em `DATABASE_URL` e `DIRECT_URL` no `.env.local`

```bash
# Criar as tabelas
npx prisma migrate dev --name init

# OU se preferir apenas push (sem migration files)
npx prisma db push

# Popular com dados iniciais
npx prisma db seed
```

### 5. Configurar Cloudinary

1. Acesse [cloudinary.com](https://cloudinary.com)
2. Vá em **Dashboard** e copie: Cloud Name, API Key, API Secret
3. Cole no `.env.local`

### 6. Configurar Resend (opcional, para recuperação de senha)

1. Acesse [resend.com](https://resend.com)
2. Crie uma API Key
3. Verifique seu domínio (ou use o domínio de teste do Resend)
4. Cole a API Key no `.env.local`

### 7. Rodar localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | String de conexão Neon (com pooling) | ✅ |
| `DIRECT_URL` | String de conexão Neon (sem pooling, para migrations) | ✅ |
| `AUTH_SECRET` | Secret do NextAuth (gere com `openssl rand -base64 32`) | ✅ |
| `AUTH_URL` | URL base do app (ex: `http://localhost:3000`) | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary | ✅ |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary | ✅ |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary | ✅ |
| `RESEND_API_KEY` | API Key do Resend | ⚠️ Opcional |
| `EMAIL_FROM` | E-mail de origem para envios | ⚠️ Opcional |
| `WHATSAPP_NUMBER` | Número padrão inicial (editável pelo admin) | ✅ |
| `CRON_SECRET` | Token para autenticar o Vercel Cron | ✅ |

---

## 👤 Usuários de Teste (após seed)

| Tipo | E-mail | Senha |
|------|--------|-------|
| **Admin** | `admin@atacadoembalagens.com.br` | `Admin@123` |
| **Cliente demo** | `cliente@delivery.com.br` | `Cliente@123` |

---

## 📁 Estrutura do Projeto

```
atacado-embalagens/
├── app/
│   ├── (auth)/              # Páginas de login, cadastro, recuperação
│   ├── (client)/            # Área do cliente (produtos, carrinho, conta)
│   ├── (admin)/             # Área admin (dashboard, produtos, clientes, pedidos)
│   └── api/                 # API Routes
│       ├── auth/            # NextAuth + register + forgot-password
│       ├── products/        # CRUD de produtos
│       ├── orders/          # Pedidos
│       ├── clients/         # Perfil do cliente
│       ├── recurring/       # Compras recorrentes
│       ├── admin/           # APIs exclusivas do admin
│       ├── upload/          # Upload de imagens (Cloudinary)
│       ├── import/          # Import Excel de produtos/clientes
│       ├── export/          # Export Excel de pedidos
│       └── cron/            # Job de processamento de recorrências
├── components/
│   ├── ui/                  # Componentes base (Button, Input, Dialog, etc)
│   ├── layout/              # Header
│   ├── products/            # ProductCard, ProductFilters
│   ├── cart/                # CartProvider, CartDrawer
│   ├── client/              # ClientProfileForm, ReorderButton
│   └── admin/               # DashboardCharts, AdminProductsClient, etc
├── lib/
│   ├── prisma.ts            # Singleton do Prisma
│   ├── auth.ts              # Config do NextAuth
│   ├── cloudinary.ts        # Upload helper
│   ├── whatsapp.ts          # Gerador de link WhatsApp
│   ├── viacep.ts            # Integração ViaCEP
│   ├── xlsx.ts              # Import/Export Excel
│   ├── recurring.ts         # Cálculo de datas de recorrência
│   ├── validators.ts        # Validação de CNPJ, CPF, telefone
│   └── utils.ts             # Utilitários gerais
├── prisma/
│   ├── schema.prisma        # Schema do banco de dados
│   └── seed.ts              # Dados iniciais
├── types/
│   └── next-auth.d.ts       # Tipos extras do NextAuth
├── middleware.ts             # Proteção de rotas
├── vercel.json              # Config do Vercel Cron
└── .env.example             # Template de variáveis de ambiente
```

---

## 🏗️ Deploy na Vercel

1. Importe o projeto na Vercel
2. Configure todas as variáveis de ambiente no painel da Vercel
3. **Integração Neon**: No painel Vercel → Storage → Connect → Neon (preenche `DATABASE_URL` automaticamente)
4. O `vercel.json` já configura o Cron Job para rodar às 6h UTC diariamente

---

## 🔒 Segurança

- ✅ Senhas com hash bcrypt (12 rounds)
- ✅ Rotas de admin protegidas no backend (middleware + verificação nas API Routes)
- ✅ Validação de CNPJ no backend
- ✅ Variáveis sensíveis apenas em `.env.local` (nunca commitado)
- ✅ CRON_SECRET para proteger o endpoint de cron
- ✅ Soft delete de produtos (preserva histórico de pedidos)
- ✅ Clientes com status `PENDING` não conseguem logar até aprovação do admin

---

## 📦 Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Autenticação (email, senha hash, role, status) |
| `clients` | Dados completos do cliente (CNPJ, endereços) |
| `categories` | Categorias de produtos |
| `products` | Produtos com SKU, preços, estoque |
| `orders` | Pedidos com status e forma de entrega |
| `order_items` | Itens de cada pedido (snapshot dos dados) |
| `recurring_orders` | Configuração de pedidos recorrentes |
| `recurring_order_items` | Produtos de cada recorrência |
| `app_config` | Configurações da loja (WhatsApp, endereço, etc) |

---

## 🛟 Suporte

Em caso de dúvidas sobre a configuração, verifique:
1. As variáveis de ambiente estão todas preenchidas
2. O banco de dados foi criado com `npx prisma db push`
3. O seed foi executado com `npx prisma db seed`
