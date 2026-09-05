# Arquitetura Atual Consolidada

## Fluxo principal

```text
WhatsApp Cloud API
        ↓
whatsapp-connectivity
        ↓
conversation-engine
        ↓
management / Fastify /admin/api
        ↓
@wpp/contracts
        ↓
React management panel
```

## `apps/server`

O servidor existente foi preservado como unidade funcional. Seus principais limites internos são:

- `whatsapp-connectivity`: webhook, gateway Meta, envio e recebimento de mensagens e custos de mensageria;
- `conversation-engine`: estado da conversa, estratégia de resposta, contexto comercial, LLM, batching de inbound e persistência conversacional;
- `management`: autenticação administrativa, consultas, métricas, ações manuais, capabilities e prospecção de leads;
- `shared/persistence`: SQLite, migrations e tabelas operacionais.

A extração física de um `bot-core` separado foi adiada. O código atual já integra essas responsabilidades e separá-las antes da fase de UI aumentaria o risco sem benefício de experiência para o usuário.

## `packages/contracts`

O pacote contém a superfície DTO/Zod pública da API de gestão. A fonte operacional continua em `apps/server/src/management/interface/dto`; `npm run sync:contracts` gera a cópia compartilhada consumida pelo painel. CI rejeita drift entre as duas superfícies.

## `apps/panel`

SPA React/Vite, mesma origem do `/admin/api`, sessão por cookie HTTP-only e React Query para estado remoto. A única mudança desta migração é trocar a dependência de diretório irmão por `@wpp/contracts`.

## OpenSpec

`openspec/` na raiz é a fonte canônica de especificações e mudanças arquivadas importadas do servidor atual. O material OpenSpec separado do painel foi mantido em `docs/legacy/panel-openspec` apenas como referência histórica.

Mudanças materiais futuras seguem obrigatoriamente:

`explore → propose → apply → archive`
