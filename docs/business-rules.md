# Regras de negocio

## Autenticacao

- Apenas `POST /api/auth/login` e publico.
- O login aceita `username` ou `email` no campo `login`.
- A senha precisa ter pelo menos 8 caracteres.
- O JWT expira conforme `JWT_EXPIRES_IN`, por padrao `7d`.
- `POST /api/auth/logout` exige autenticacao e revoga o token em memoria no processo da API.
- O frontend tambem remove o estado autenticado do `localStorage` no logout.

## Usuarios

- Apenas usuarios `ADMIN` podem listar, criar, editar e remover usuarios.
- `username` e `email` precisam ser unicos.
- `displayName` e opcional.
- Um admin nao pode alterar o proprio `role`.

## Tarefas

- Cada tarefa tem `title`, `date` (`YYYY-MM-DD`) e `hour` (`HH:mm`).
- `description` e opcional.
- A combinacao `date` + `hour` gera `scheduledFor`, usada para ordenacao e reconciliacao.
- Nao e permitido criar ou atualizar tarefas em horario passado.
- Criacao individual grava direto no banco.
- Criacao em lote aceita de `1` a `5000` itens e entra na fila `bulk-task-creation`.

## Permissoes sobre tarefas

- Usuarios `BASIC` so podem listar, ler, editar e excluir as proprias tarefas.
- Usuarios `ADMIN` podem listar, ler e editar tarefas de qualquer usuario.
- Usuarios `ADMIN` nao podem excluir tarefas cujo dono seja outro usuario.

## Filtros de listagem

- `search`: busca por titulo com comparacao case-insensitive.
- `status=all`: retorna tudo que o usuario pode ver.
- `status=finished`: retorna tarefas com `isFinished = true`.
- `status=pending`: retorna tarefas com `isFinished = false`, inclusive vencidas.
- `status=scheduled`: retorna tarefas nao finalizadas com `scheduledFor >= now`.

## Agendamento e manutencao

- Na subida da API, a reconciliacao de tarefas vencidas roda imediatamente.
- Um job recorrente em BullMQ roda a cada 60 segundos.
- A manutencao procura tarefas nao finalizadas cujo `scheduledFor` ja passou.
- Quando encontra, marca essas tarefas como finalizadas.
