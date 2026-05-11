# Testes e qualidade

## Comandos

- `npm test`: roda os testes dos workspaces
- `npm run test --workspace apps/api`: roda os testes unitarios da API
- `npm run test:e2e --workspace apps/api`: roda apenas os testes HTTP/e2e da API
- `npm run test --workspace apps/web`: roda os testes de comportamento do frontend
- `npm run test:e2e:install --workspace apps/web`: instala o navegador usado pelo Playwright
- `npm run test:e2e:web`: prepara Prisma/seed e roda os fluxos E2E do frontend
- `npm run lint`: executa ESLint no monorepo
- `npm run format:check`: valida Prettier
- `npm run build`: builda API e web

Observacao: o frontend agora possui testes de comportamento com `Vitest + Testing Library`, focados em formularios, autenticacao e fluxos de pagina sem depender da API real.
Observacao: os testes E2E do frontend precisam de MongoDB e Redis ativos. Localmente, suba antes com `npm run db:up`.
Observacao: na primeira execucao do Playwright, instale o Chromium com `npm run test:e2e:install --workspace apps/web`.

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

## Cobertura atual do frontend

Os testes em `apps/web/src/**/*.test.tsx` cobrem comportamento de interface em JSDOM:

- `LoginPage`: submissao de credenciais, feedback de erro e redirecionamento quando ja existe sessao
- `TaskForm`: validacao client-side de agendamento passado e parsing do modo bulk
- `DashboardPage`: carregamento inicial, troca de filtro por status e separacao de tarefas agendadas

Esses testes mockam apenas as dependencias externas do frontend, como hooks de autenticacao e clientes HTTP, para manter o foco no comportamento da UI.

## E2E do frontend

Os testes em `apps/web/e2e/*.spec.ts` exercitam a aplicacao completa no navegador com Playwright:

- login como usuario basico, criacao de tarefa, mudanca de status e exclusao
- login como admin, navegacao para a area administrativa, criacao de usuario, alteracao de role e exclusao

O Playwright sobe a API e o Vite automaticamente via `webServer`, mas depende de MongoDB e Redis ja disponiveis.
