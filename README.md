# 📊 Perform API

Backend da aplicação **Perform** - Sistema de análise de métricas técnicas de desenvolvedores e suporte à tomada de decisão de Tech Leads.

## 🎯 Sobre o Projeto

O Perform é uma plataforma que captura dados do GitHub via webhooks e os transforma em insights acionáveis para Tech Leads. A aplicação:

- 📈 Coleta métricas de PRs, commits e code reviews automaticamente
- 🤖 Gera recomendações inteligentes com IA
- 📊 Calcula métricas como lead time, cycle time e review time
- 👥 Gerencia squads e acompanha performance individual
- 🎮 Interface gamificada inspirada em dashboards de eSports

## 🚀 Tecnologias

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeORM](https://typeorm.io/)** - ORM para TypeScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados (NeonDB)
- **[JWT](https://jwt.io/)** - Autenticação
- **[Class Validator](https://github.com/typestack/class-validator)** - Validação de DTOs

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- PostgreSQL (ou acesso ao NeonDB)

## 🔧 Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd perform-api

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Application
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# GitHub Webhook
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

## 🗄️ Banco de Dados

### Migrations

```bash
# Gerar nova migration baseada nas mudanças das entities
npm run migration:generate -- src/database/migrations/MigrationName

# Executar migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert
```

## 🏃 Executando a Aplicação

```bash
# Desenvolvimento (com hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod

# Debug
npm run start:debug
```

A API estará disponível em `http://localhost:3000`

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📁 Estrutura do Projeto

```
src/
├── ai-recommendations/    # Recomendações de IA para developers
├── auth/                  # Autenticação e autorização
├── code-reviews/          # Gestão de code reviews
├── commits/               # Gestão de commits
├── database/              # Configuração do banco e migrations
│   ├── data-source.ts    # DataSource do TypeORM
│   └── migrations/       # Migrations SQL
├── developers/            # Perfis técnicos dos developers
├── github-webhook/        # Receptor de webhooks do GitHub
├── metrics/               # Cálculo e armazenamento de métricas
├── permissions/           # Sistema de permissões
├── pull-requests/         # Gestão de Pull Requests
├── reports/               # Geração de relatórios
├── squads/                # Gestão de times/squads
└── users/                 # Gestão de usuários do sistema
```

## 📊 Entidades Principais

### 👤 User
Usuários do sistema com controle de acesso
- Roles: `ADMIN`, `TECH_LEAD`, `DEVELOPER`
- Autenticação JWT
- Sistema de permissões granular

### 👥 Squad
Times de desenvolvimento
- Tech Lead associado
- Membros (Users e Developers)
- Métricas agregadas por squad

### 💻 Developer
Perfil técnico vinculado ao GitHub
- Dados sincronizados via webhook
- Histórico de PRs, commits e reviews
- Métricas individuais calculadas

### 🔀 PullRequest
Pull requests capturados do GitHub
- Status: `OPEN`, `CLOSED`, `MERGED`
- Estatísticas: linhas adicionadas/removidas, arquivos alterados
- Lead time e review time

### 📝 Commit
Commits individuais
- Vinculados a Developer e PullRequest (opcional)
- Dados de complexidade e impacto

### 👀 CodeReview
Reviews de código
- Status: `PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`
- Tempo de resposta e qualidade do review

### 📈 Metric
Métricas calculadas
- Lead time, cycle time, review time
- Produtividade, qualidade de código
- Armazenadas por período

### 🤖 AIRecommendation
Recomendações geradas por IA
- Categorias: produtividade, qualidade, colaboração, aprendizado
- Prioridades e score de confiança

## 🔌 Endpoints Principais

### Autenticação
```
POST   /auth/login          # Login
POST   /auth/register       # Registro
```

### Usuários
```
GET    /users               # Listar usuários
GET    /users/:id           # Buscar usuário
POST   /users               # Criar usuário
PATCH  /users/:id           # Atualizar usuário
DELETE /users/:id           # Deletar usuário
```

### Developers
```
GET    /developers                    # Listar developers
GET    /developers/:id                # Buscar developer
GET    /developers/:id/metrics        # Métricas do developer
GET    /developers/:id/pull-requests  # PRs do developer
```

### GitHub Webhook
```
POST   /github-webhook      # Receber eventos do GitHub
```

### Métricas
```
GET    /metrics                      # Listar métricas
GET    /metrics/developer/:id        # Métricas por developer
GET    /metrics/squad/:id            # Métricas por squad
```

## 🪝 Configuração do GitHub Webhook

1. Acesse as configurações do seu repositório no GitHub
2. Vá em **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-api.com/github-webhook`
   - **Content type**: `application/json`
   - **Secret**: (mesmo valor do `GITHUB_WEBHOOK_SECRET` no .env)
   - **Events**: Selecione:
     - `push` (commits)
     - `pull_request` (PRs)
     - `pull_request_review` (reviews)

## 📚 Documentação

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [NeonDB Documentation](https://neon.tech/docs)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 👥 Autores

- **Mateus Silva de Castro Fagundes** - Desenvolvimento inicial

## 📝 Licença

Este projeto é proprietário e confidencial.
