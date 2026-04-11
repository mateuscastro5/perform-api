# perform-api

Backend da plataforma **Perform** — sistema de análise de performance técnica de desenvolvedores para Tech Leads.

Construído com **NestJS + TypeORM + PostgreSQL (Neon)**. Integra-se ao GitHub via API/webhooks para coletar PRs e commits, e se comunica com o `perform-ai` para análise de complexidade por IA.

---

## O que faz

- Sincroniza PRs, commits e code reviews do GitHub automaticamente
- Orquestra análises de complexidade de código via `perform-ai` (Dual-LLM + RAG)
- Calcula métricas temporais por desenvolvedor: lead time, cycle time, review time
- Expõe insights de evolução de performance por desenvolvedor (scores, tendências, pontos fortes)
- Gerencia squads, usuários e permissões
- Autenticação JWT com roles (`ADMIN`, `TECH_LEAD`, `DEVELOPER`)

---

## Tecnologias

- **NestJS** — framework Node.js
- **TypeORM** — ORM TypeScript
- **PostgreSQL via NeonDB** — banco de dados serverless (SA-East-1)
- **JWT** — autenticação
- **Axios** — comunicação com `perform-ai` e GitHub API

---

## Pré-requisitos

- Node.js 20+
- Acesso ao banco NeonDB (ou PostgreSQL local)
- `perform-ai` rodando (ou via Docker Compose)

---

## Setup

```bash
npm install
cp .env.example .env
# Edite o .env com as credenciais
npm run start:dev
```

### Variáveis de ambiente (.env)

```env
# Banco de dados
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Aplicação
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRATION=7d

# GitHub
GITHUB_TOKEN=ghp_seu_token_aqui
GITHUB_WEBHOOK_SECRET=seu_webhook_secret

# Serviço de IA
AI_SERVICE_URL=http://perform-ai:8000
AI_SERVICE_API_KEY=perform_internal_key_2024

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## Executando

```bash
# Desenvolvimento (hot reload)
npm run start:dev

# Produção
npm run build && npm run start:prod
```

API disponível em `http://localhost:3000`

---

## Estrutura do projeto

```
src/
├── ai-analysis/           # Análise de PRs via IA
│   ├── entities/          # PrAnalysis, DeveloperEvolution
│   ├── ai-analysis.service.ts    # Orquestra chamadas ao perform-ai
│   └── ai-analysis.controller.ts # POST /ai-analysis/trigger, /trigger-batch
├── auth/                  # JWT, login, registro
├── developers/            # Perfis técnicos vinculados ao GitHub
├── github/                # Integração GitHub API + webhooks
│   ├── analytics/         # Métricas agregadas, PRs recentes, atividade
│   └── webhook/           # Receptor de eventos push/PR/review
├── squads/                # Times de desenvolvimento
├── users/                 # Usuários do sistema (roles e permissões)
└── database/              # DataSource TypeORM + migrations
```

---

## Endpoints principais

### Autenticação
```
POST  /auth/login           # Login (retorna JWT)
POST  /auth/register        # Criar conta
```

### Análise de IA
```
POST  /ai-analysis/trigger                    # Analisar uma PR específica
POST  /ai-analysis/trigger-batch              # Analisar até 20 PRs (throttle 2s)
GET   /ai-analysis/developer/:id              # Análises de um desenvolvedor
GET   /ai-analysis/developer/:id/evolution    # Evolução temporal (trend, períodos)
PATCH /ai-analysis/:id/feedback               # Corrigir label (Tech Lead)
```

### GitHub / Analytics
```
GET   /github/analytics/recent-pull-requests  # PRs recentes (com filtros)
GET   /github/analytics/recent-activity       # Feed de atividades
GET   /github/analytics/top-reviewers         # Melhores revisores
GET   /github/analytics/metrics               # Métricas gerais
POST  /github/webhook                         # Receber eventos do GitHub
```

### Squads e Desenvolvedores
```
GET   /squads                        # Listar squads
GET   /github/developers             # Listar desenvolvedores com stats
GET   /github/developers/:id         # Perfil de um desenvolvedor
```

---

## Análise de IA (perform-ai integration)

O `perform-api` atua como orquestrador entre o frontend e o `perform-ai`:

1. Frontend clica "Analyze code" na página do desenvolvedor
2. `perform-api` recebe os IDs das PRs via `POST /ai-analysis/trigger-batch`
3. Para cada PR, busca o diff no GitHub e envia para o `perform-ai`
4. `perform-ai` retorna: `score`, `confidence`, `difficulty_label`, `justification`, `technologies`
5. `perform-api` persiste o resultado e notifica via callback
6. Frontend atualiza os insights do desenvolvedor em tempo real

### Métricas de evolução temporal

O endpoint `/ai-analysis/developer/:id/evolution` agrega análises por período e retorna:
- `trend`: `improving` / `stable` / `declining`
- `periods`: array de períodos com score médio e volume
- `avgComplexity`, `avgConfidence`

---

## Migrations

```bash
# Gerar nova migration
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Executar migrations
npm run migration:run

# Reverter
npm run migration:revert
```

---

## Autores

- **Mateus Silva de Castro Fagundes** — Desenvolvimento
