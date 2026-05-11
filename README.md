# Task Manager

Aplicacao full stack de gerenciamento de tarefas com backend em Express/TypeScript, frontend em React, MongoDB com Prisma, filas com BullMQ/Redis e autenticacao JWT.

## Stack

- `apps/api`: Express, TypeScript, Prisma, MongoDB, Mongoose, BullMQ, Redis, JWT, Zod
- `apps/web`: React, Vite, TypeScript, React Router
- `docker/`: imagens da API e da web
- `.github/workflows/quality.yml`: pipeline de formatacao, lint, testes e build

## Funcionalidades

- login com `username` ou `email`
- dashboard protegido por JWT
- criacao de tarefa individual ou em lote
- reconciliacao automatica de tarefas vencidas
- tela administrativa para gestao de usuarios
- Swagger protegido por basic auth

## Inicio rapido

1. Copie `.env.example` para `.env`.
2. Instale dependencias com `npm install`.
3. Suba MongoDB e Redis com `npm run db:up`.
4. Gere o client do Prisma com `npm run prisma:generate --workspace apps/api`.
5. Aplique o schema com `npm run prisma:migrate --workspace apps/api`.
6. Popule usuarios iniciais com `npm run seed --workspace apps/api`.
7. Rode o monorepo com `npm run dev`.

## Enderecos locais

- frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- healthcheck: `http://localhost:3001/health`
- Swagger: `http://localhost:3001/docs`

## Credenciais padrao

- Swagger basic auth: `swagger / swagger`
- usuario basico seed: `basicUser / basic123@`
- usuario admin seed: `adminUser / admin123@`

## Documentacao

- [Setup local](docs/setup.md)
- [Arquitetura](docs/architecture.md)
- [Regras de negocio](docs/business-rules.md)
- [Testes e qualidade](docs/tests.md)

## Estrutura

- `apps/api/src/core`: entidades, enums, erros e ports
- `apps/api/src/application`: DTOs e services de aplicacao
- `apps/api/src/adapters`: HTTP, seguranca, filas e persistencia
- `apps/api/src/database`: clientes Prisma e Mongoose
- `apps/api/tests`: testes unitarios e testes HTTP/e2e da API
- `apps/web/src`: rotas, paginas, componentes e cliente HTTP
