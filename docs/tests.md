# Testes e qualidade

## Comandos

- `npm test`: roda os testes dos workspaces
- `npm run test --workspace apps/api`: roda os testes unitarios da API
- `npm run test:e2e --workspace apps/api`: roda apenas os testes HTTP/e2e da API
- `npm run lint`: executa ESLint no monorepo
- `npm run format:check`: valida Prettier
- `npm run build`: builda API e web

Observacao: atualmente `apps/web` nao possui testes automatizados; o script de teste do frontend apenas informa isso.

## Cobertura atual da API

Os testes em `apps/api/tests` se dividem em:

- unitarios: usam mocks/spies para isolar middlewares, controllers e services
- HTTP/e2e leves: exercitam `Express -> routes -> requireAuth -> controllers -> error handler` com `supertest`, sem depender de MongoDB ou Redis

Cobertura principal:

- middlewares: `requireAuth`, `sanitizeRequest` e `swaggerBasicAuth`
- controllers: `AuthController`, `TaskController` e `UserController`
- services: `AuthService`, `TaskService`, `TaskMaintenanceService`, `TaskScheduleService`, `TaskAccessService` e `UserService`
- HTTP/e2e: login, logout, protecao por bearer token, parsing de query/body, serializacao de resposta e mapeamento de erros da camada HTTP

## Regras verificadas pelos testes

- autenticacao com credenciais validas e invalidas
- validacao de payloads com Zod
- autorizacao por role e por ownership
- criacao individual e em lote de tarefas
- filtros por `search` e `status`
- bloqueio de tarefas em horario passado
- reconciliacao de tarefas vencidas
- protecao contra alteracao do proprio role por admins

## Pipeline de CI

O workflow `.github/workflows/quality.yml` executa:

- instalacao de dependencias
- geracao do client Prisma
- verificacao de formatacao
- lint
- testes unitarios da API
- testes HTTP/e2e da API
- build dos workspaces
- build das imagens Docker da API e da web

## Quando usar cada camada

- unitario: regra de negocio, validacoes isoladas e cenarios de erro pontuais
- HTTP/e2e leve: contratos da API, wiring de rotas, autenticacao, validacao do request e envelope de resposta
- integracao com infra real: cenarios que precisarem provar persistencia, filas ou compatibilidade com MongoDB/Redis
