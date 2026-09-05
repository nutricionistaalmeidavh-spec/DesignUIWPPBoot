# Mapa das Telas Atuais — antes do redesign

Este mapa descreve o painel efetivamente implementado no baseline consolidado, não as telas desejadas nas specs.

O React Router usa `basename: /admin`. As rotas abaixo são relativas a esse prefixo.

| Tela | Rota | Objetivo | APIs/ações principais |
| --- | --- | --- | --- |
| Login | `/login` | Criar sessão administrativa | `POST /admin/api/session`; validação inicial via overview |
| Conversas | `/conversations` | Listar, filtrar e abrir conversas | `GET /admin/api/conversations` |
| Detalhe da conversa | `/conversations/:leadPhone` | Ler contexto/timeline e agir manualmente | detalhe; handoff; resume; mensagem manual |
| Leads | `/leads` | Importar, filtrar, selecionar e prospectar leads | listagem; importação; disparo em lote; reset |
| Consumo | `/consumption` | Visualizar métricas/custos por período | consumption; overview |
| Não encontrada | `*` | Fallback de navegação protegida | nenhuma |

A rota protegida inicial redireciona para `/conversations`.

## Navegação atual

O `AppShell` expõe três áreas de primeira classe:

- **Conversas** → `/conversations`;
- **Leads** → `/leads`;
- **Consumo** → `/consumption`.

Também oferece logout. Não existe uma home/dashboard executivo independente; após autenticação o usuário entra diretamente em Conversas.

## Conversas

### Listagem

API: `GET /admin/api/conversations`.

Filtros/consulta suportados pelo client atual incluem estado, intenção do lead, telefone, faixa de atividade, paginação e cursor.

### Detalhe

API: `GET /admin/api/conversations/:leadPhone`.

Conforme disponibilidade e estado da conversa, o operador pode:

- fazer handoff para humano: `POST /admin/api/conversations/:leadPhone/handoff`;
- devolver a conversa ao bot: `POST /admin/api/conversations/:leadPhone/resume`;
- enviar mensagem manual: `POST /admin/api/conversations/:leadPhone/messages`;
- consultar estado, intenção, qualificação, plano cotado, módulos e histórico de turnos.

## Leads / Prospecção

A prospecção já está implementada no painel do baseline correto.

A tela permite:

- filtrar por estado, telefone e segmento;
- importar planilha;
- exibir loading, erro recuperável e estado vazio;
- selecionar leads elegíveis individualmente ou em lote;
- disparar mensagem de abertura em lote quando a capability `prospecting` está disponível;
- resetar a prospecção de um lead mantendo conversa e histórico;
- paginação incremental da lista.

APIs usadas:

- `GET /admin/api/leads`;
- `POST /admin/api/leads/import`;
- `POST /admin/api/leads/prospect`;
- `POST /admin/api/leads/:leadPhone/reset`;
- `GET /admin/api/capabilities` para disponibilidade das ações.

## Consumo

APIs:

- `GET /admin/api/stats/consumption`;
- `GET /admin/api/stats/overview`.

A tela já possui leitura por período e agrupamento, mas ainda precisa ser avaliada como instrumento de decisão gerencial na próxima etapa de UX.

## Sessão e compatibilidade

- Login: `POST /admin/api/session`.
- Logout: `DELETE /admin/api/session`.
- A sessão é mantida por cookie e o client usa `credentials: include`.
- `GET /admin/api/capabilities` informa disponibilidade de ações de conversa e prospecção.
- Existe `ContractMismatchBanner` para divergências de contrato detectadas no client.

## Gap estrutural antes do redesign

O principal gap não é mais “falta de tela de prospecção”. O baseline atual já cobre o fluxo básico de leads. O gap é **arquitetura de informação e experiência operacional**: Conversas, Leads e Consumo existem como módulos funcionais, mas falta uma visão inicial que una saúde do bot, prioridades, andamento da prospecção, exceções e consumo.
