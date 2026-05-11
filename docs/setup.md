# Setup local

## Requisitos

- Node.js 20+
- Docker e Docker Compose

## Variaveis de ambiente

1. Copie `.env.example` para `.env`.
2. Para rodar a API no host, use `localhost` em `MONGO_URL` e `REDIS_URL`.
3. Para rodar tudo em containers, os hosts passam a ser `mongo` e `redis` dentro do Compose.

Variaveis mais importantes:

- `PORT`: porta da API
- `MONGO_URL`: conexao do MongoDB
- `REDIS_URL`: conexao do Redis
- `JWT_SECRET` e `JWT_EXPIRES_IN`: configuracao do token
- `SWAGGER_LOCAL_USER` e `SWAGGER_LOCAL_PASS`: basic auth do Swagger
- `API_URL`: base usada pela documentacao OpenAPI

Observacao: a API procura o `.env` no diretorio atual e tambem em diretorios pais, o que permite executar scripts a partir da raiz do monorepo ou do workspace da API.

## Opcao 1: API e web no host

Use esta opcao quando quiser rodar `apps/api` e `apps/web` com `npm`, deixando apenas MongoDB e Redis em containers.

1. Instale dependencias:

```bash
npm install
```

2. Suba MongoDB e Redis:

```bash
npm run db:up
```

3. Gere o client do Prisma:

```bash
npm run prisma:generate --workspace apps/api
```

4. Aplique o schema no MongoDB:

```bash
npm run prisma:migrate --workspace apps/api
```

5. Rode o seed:

```bash
npm run seed --workspace apps/api
```

6. Inicie API e web:

```bash
npm run dev
```

## Opcao 2: stack inteira com Docker

Use esta opcao quando quiser subir MongoDB, Redis, API e frontend todos via Compose.

1. Suba MongoDB e Redis com replica set:

```bash
npm run db:up
```

2. Suba API e web:

```bash
docker compose up --build api web
```

Se o MongoDB ja tiver sido iniciado anteriormente sem replica set, recrie os volumes:

```bash
docker compose down -v
npm run db:up
docker compose up --build api web
```

## O que o fluxo Docker faz

- `mongo` sobe com replica set `rs0`
- `mongo-setup` executa `rs.initiate(...)` e espera o no virar `PRIMARY`
- `redis` sobe para as filas BullMQ
- a imagem `api` roda `prisma generate`, build, `prisma db push`, seed e inicializacao
- a imagem `web` builda o frontend e sobe o Vite em `0.0.0.0:5173`

## URLs locais

- frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- healthcheck: `http://localhost:3001/health`
- Swagger: `http://localhost:3001/docs`

## Credenciais padrao

- Swagger basic auth: `swagger / swagger`
- usuario basico: `basicUser / basic123@`
- usuario admin: `adminUser / admin123@`

## Replica set do MongoDB

O Prisma com MongoDB precisa de replica set para operacoes de escrita. Por isso, o ambiente local usa `rs0`.

Exemplos de URL:

- host local: `mongodb://localhost:27017/task-manager?replicaSet=rs0&directConnection=true`
- dentro do Docker Compose: `mongodb://mongo:27017/task-manager?replicaSet=rs0`

## Comandos uteis

```bash
docker compose down
docker compose down -v
npm run lint
npm test
npm run build
```
