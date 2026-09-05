# Mapa das Telas Atuais — antes do redesign

Este mapa descreve o painel efetivamente implementado no baseline, não as telas desejadas nas specs.

| Tela | Rota | Objetivo | APIs/ações principais |
| --- | --- | --- | --- |
| Login | `/login` | Criar sessão administrativa | `POST /admin/api/session`; validação inicial via overview |
| Conversas | `/conversations` | Listar conversas e abrir um lead | `GET /admin/api/conversations` |
| Detalhe da conversa | `/conversations/:leadPhone` | Ler contexto/timeline e agir manualmente | `GET /admin/api/conversations/:leadPhone`; handoff; resume; mensagem manual |
| Consumo | `/consumption` | Visualizar métricas/custos por período | `GET /admin/api/stats/consumption`; `GET /admin/api/stats/overview` |
| Não encontrada | `*` | Fallback de navegação | nenhuma |

## Navegação atual

O `AppShell` expõe somente **Conversas** e **Consumo**. Não existe uma home/dashboard executivo implementado como rota independente no painel atual.

## Ações do detalhe

O detalhe suporta, conforme disponibilidade/estado da conversa:

- handoff para operador;
- retomada pelo bot;
- envio de mensagem manual;
- leitura de estado, intenção, qualificação, plano cotado, módulos e histórico de turnos.

## Capacidades presentes no servidor ainda não expostas como tela principal

O servidor do baseline já contém endpoints/contratos de `capabilities` e fluxo de leads/prospecção (cadastro, importação e disparo inicial em lote). O painel atual não possui uma rota de prospecção no router principal, apesar de documentação/specs anteriores citarem essa experiência.

Esse descompasso é requisito de UX para a próxima fase, não motivo para alterar UI durante a migração.
