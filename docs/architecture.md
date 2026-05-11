# Arquitetura

## Visao geral

O repositorio e um monorepo com dois workspaces:

- `apps/api`: API REST e processamento assincrono
- `apps/web`: interface React consumindo a API

O backend segue uma arquitetura hexagonal, separando regra de negocio, contratos e adaptadores de infraestrutura.

## Fluxo do backend

1. A requisicao entra pelo Express.
2. Middlewares globais aplicam `cors`, `helmet`, `express.json()` e sanitizacao basica.
3. Rotas protegidas usam `requireAuth`, que valida o JWT e injeta `req.user`.
4. Controllers validam o payload com Zod, convertem a entrada para DTOs e chamam os services.
5. Services de aplicacao aplicam regras de negocio e dependem apenas de ports.
6. Adaptadores concretos executam persistencia, autenticacao e filas.
7. A resposta volta em envelope padrao `{ success, message?, data }`.

## Camadas do backend

- `src/core`: modelos de dominio (`Task`, `User`), `Role`, erros e interfaces (`ports`)
- `src/application`: DTOs e services como `AuthService`, `TaskService`, `UserService`
- `src/adapters/http`: controllers, rotas, middlewares e documento OpenAPI
- `src/adapters/database`: repositorios Prisma
- `src/adapters/security`: JWT e hash de senha com bcrypt
- `src/adapters/queue`: filas BullMQ e workers
- `src/database`: cliente Prisma e sincronizacao de indices com Mongoose

## Persistencia

- O banco principal e MongoDB.
- O acesso de leitura/escrita da aplicacao passa pelos repositorios Prisma.
- O Mongoose e usado no bootstrap para `syncIndexes()` dos modelos `User` e `Task`.
- O schema Prisma define as colecoes `User` e `Task`, relacao por `ownerId` e indices para consulta por agenda.

## Processamento assincrono

O Redis suporta duas filas BullMQ:

- `bulk-task-creation`: recebe criacao em lote e delega a gravacao assincrona
- `task-maintenance`: executa a reconciliacao de tarefas vencidas

No bootstrap da API:

- os workers sao registrados
- o job recorrente de manutencao e agendado para rodar a cada 60 segundos
- uma sincronizacao imediata roda na subida da aplicacao

## Autenticacao e autorizacao

- `POST /api/auth/login` e publico
- as demais rotas usam JWT Bearer
- o logout revoga o token em memoria no processo da API
- autorizacao fica nos services, nao nos controllers
- apenas `ADMIN` acessa a gestao de usuarios

## Frontend

O frontend usa React com React Router e um cliente `fetch` simples:

- `/login`: autenticacao
- `/`: dashboard de tarefas
- `/users`: area administrativa, protegida por role

O estado autenticado fica em `localStorage`, e o token e enviado em `Authorization: Bearer ...`.
