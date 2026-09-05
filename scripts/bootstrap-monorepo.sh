#!/usr/bin/env bash
set -euo pipefail

SERVER_REPO="https://github.com/Marcoslima016/wpp_prospector_bot.git"
SERVER_SHA="464e5dcb1cef198721e1db3c46cc48500ae02d0d"
PANEL_REPO="https://github.com/Marcoslima016/wpp_prospector_bot_panel.git"
PANEL_SHA="f8ef396c0dca73e89618fa79922b1633577ecb90"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ -f .bootstrap-complete ]]; then
  echo "Bootstrap already completed."
  exit 0
fi

echo "==> Fetching pinned source snapshots"
git clone --quiet "$SERVER_REPO" "$TMP_DIR/server"
git -C "$TMP_DIR/server" checkout --quiet "$SERVER_SHA"
git clone --quiet "$PANEL_REPO" "$TMP_DIR/panel"
git -C "$TMP_DIR/panel" checkout --quiet "$PANEL_SHA"

[[ "$(git -C "$TMP_DIR/server" rev-parse HEAD)" == "$SERVER_SHA" ]]
[[ "$(git -C "$TMP_DIR/panel" rev-parse HEAD)" == "$PANEL_SHA" ]]

echo "==> Migrating server and panel without changing source repositories"
rm -rf apps packages/contracts openspec docs/legacy/panel-openspec
mkdir -p apps/server apps/panel packages/contracts/src docs/legacy

COMMON_EXCLUDES=(
  --exclude='.git'
  --exclude='.DS_Store'
  --exclude='.agents'
  --exclude='.claude'
  --exclude='.vscode'
  --exclude='node_modules'
  --exclude='dist'
  --exclude='.github'
)

rsync -a "${COMMON_EXCLUDES[@]}" "$TMP_DIR/server/" apps/server/
rsync -a "${COMMON_EXCLUDES[@]}" "$TMP_DIR/panel/" apps/panel/

if [[ ! -d apps/server/openspec ]]; then
  echo "Server OpenSpec tree was not found" >&2
  exit 1
fi
mv apps/server/openspec ./openspec

if [[ -d apps/panel/openspec ]]; then
  cp -a apps/panel/openspec docs/legacy/panel-openspec
  rm -rf apps/panel/openspec
fi

rm -f apps/server/package-lock.json apps/panel/package-lock.json

echo "==> Creating shared contracts package"
cat > scripts/sync-contracts.mjs <<'EOF'
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';

const source = new URL('../apps/server/src/management/interface/dto/', import.meta.url);
const target = new URL('../packages/contracts/src/', import.meta.url);

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

const entries = (await readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))
  .sort((a, b) => a.name.localeCompare(b.name));

for (const entry of entries) {
  await cp(new URL(entry.name, source), new URL(entry.name, target));
}

console.log(`Synced ${entries.length} management contract files into ${basename(target.pathname) || 'contracts'}.`);
EOF

cat > packages/contracts/package.json <<'EOF'
{
  "name": "@wpp/contracts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "4.4.3"
  },
  "devDependencies": {
    "typescript": "^6.0.3"
  }
}
EOF

cat > packages/contracts/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
EOF

node scripts/sync-contracts.mjs

echo "==> Rewiring panel to workspace contracts"
node <<'NODE'
const fs = require('node:fs');
const panelPath = 'apps/panel/package.json';
const panel = JSON.parse(fs.readFileSync(panelPath, 'utf8'));
panel.dependencies ??= {};
delete panel.dependencies.wpp_prospector_bot_server;
panel.dependencies['@wpp/contracts'] = 'workspace:*';
fs.writeFileSync(panelPath, JSON.stringify(panel, null, 2) + '\n');

const serverPath = 'apps/server/package.json';
const server = JSON.parse(fs.readFileSync(serverPath, 'utf8'));
server.scripts ??= {};
server.scripts.typecheck = 'tsc --noEmit';
fs.writeFileSync(serverPath, JSON.stringify(server, null, 2) + '\n');
NODE

if grep -RIl --exclude-dir=node_modules 'wpp_prospector_bot_server/contracts' apps/panel/src >/tmp/wpp-contract-imports.txt; then
  while IFS= read -r file; do
    sed -i 's#wpp_prospector_bot_server/contracts#@wpp/contracts#g' "$file"
  done </tmp/wpp-contract-imports.txt
fi

if grep -Rqs --exclude-dir=node_modules 'wpp_prospector_bot_server/contracts' apps/panel/src; then
  echo "Old sibling-repository contract import still exists" >&2
  exit 1
fi

echo "==> Creating root workspace"
cat > package.json <<'EOF'
{
  "name": "design-ui-wpp-boot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.0.0"
  },
  "workspaces": [
    "apps/server",
    "apps/panel",
    "packages/contracts"
  ],
  "scripts": {
    "sync:contracts": "node scripts/sync-contracts.mjs",
    "lint": "npm run lint -w wpp_prospector_bot_server && npm run lint -w wpp_prospector_bot_panel",
    "typecheck": "npm run typecheck -w @wpp/contracts && npm run typecheck -w wpp_prospector_bot_server && npm run typecheck -w wpp_prospector_bot_panel",
    "test": "npm run test -w wpp_prospector_bot_server && npm run test -w wpp_prospector_bot_panel",
    "build": "npm run build -w wpp_prospector_bot_server && npm run build -w wpp_prospector_bot_panel",
    "check:contracts": "npm run sync:contracts && git diff --exit-code -- packages/contracts/src",
    "check": "npm run check:contracts && npm run lint && npm run typecheck && npm test && npm run build"
  }
}
EOF

cat > .gitignore <<'EOF'
node_modules/
dist/
coverage/
*.log
.DS_Store
.env
.env.*
!.env.example
*.sqlite
*.sqlite3
*.db
.wwebjs_auth/
.wwebjs_cache/
.tmp/
.temp/
.vscode/
.idea/
EOF

{
  echo '# Environment reference for apps/server. Copy values to a local .env; never commit secrets.'
  echo
  cat apps/server/.env.example
} > .env.example

cat > README.md <<'EOF'
# DesignUIWPPBoot

Monorepo de evolução do produto de prospecção por WhatsApp.

## Estrutura

- `apps/server` — servidor, motor conversacional, conectividade WhatsApp, persistência e API de gestão.
- `apps/panel` — painel React/Vite atual. O visual foi preservado nesta migração.
- `packages/contracts` — contratos Zod/TypeScript compartilhados entre API e painel.
- `openspec` — especificação canônica e histórico de mudanças do produto.
- `docs` — baseline, arquitetura, mapa de telas e auditoria UX.

## Requisitos

- Node.js 24+
- npm

## Desenvolvimento

```bash
npm install
npm run check
```

Para iniciar os componentes separadamente:

```bash
npm run dev -w wpp_prospector_bot_server
npm run dev -w wpp_prospector_bot_panel
```

## Processo de mudança

Mudanças relevantes usam OpenSpec:

`explore → propose → apply → archive`

A migração das fases 0–8 não altera o design visual do painel. O próximo checkpoint é a proposta OpenSpec específica do redesign de UX/UI.
EOF

mkdir -p docs
cat > docs/baseline.md <<EOF
# Baseline de Migração — 2026-09-04

| Componente | Origem | Branch | Commit fixado |
| --- | --- | --- | --- |
| Server + bot runtime | \`Marcoslima016/wpp_prospector_bot\` | \`feature/refinamento_bot\` | \`$SERVER_SHA\` |
| Panel | \`Marcoslima016/wpp_prospector_bot_panel\` | \`main\` | \`$PANEL_SHA\` |
| Destino inicial | \`nutricionistaalmeidavh-spec/DesignUIWPPBoot\` | \`main\` | \`7e41b1ba5f6af07bf841b994718b4c6497ad1517\` |

## Decisão de baseline

O branch \`feature/refinamento_bot\` é utilizado porque contém, numa única linha evolutiva, o servidor Fastify, WhatsApp Cloud API, conversation engine, management API, persistência, métricas, importação/prospecção de leads e as especificações OpenSpec atuais.

Os repositórios de origem são somente leitura nesta migração. Todas as alterações são feitas em \`DesignUIWPPBoot\`.
EOF

cat > docs/architecture.md <<'EOF'
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
EOF

cat > docs/screen-map.md <<'EOF'
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
EOF

cat > docs/ux-audit.md <<'EOF'
# Auditoria UX — checkpoint antes de alterar UI

## Princípio

O painel já entrega os fluxos centrais de gestão, mas sua arquitetura de informação ainda reflete a ordem em que as funções foram implementadas, não o trabalho diário de um operador/gestor. A próxima fase deve melhorar experiência sem reescrever funcionalidades que já funcionam.

## P0 — bloqueios de experiência do produto

### Prospecção não está acessível na navegação atual

O servidor já possui capabilities e operações de leads/prospecção, mas o router e o AppShell atuais expõem apenas Conversas e Consumo. Para um produto de prospecção, iniciar/importar leads precisa ser um fluxo de primeira classe.

**Próxima fase:** desenhar o fluxo completo `importar → validar → iniciar prospecção → acompanhar resultado` antes de codificar a tela.

### Não existe visão operacional inicial

Depois do login, a experiência leva o usuário diretamente para módulos específicos. Falta uma visão que responda rapidamente: o bot está operando? quantas conversas exigem atenção? quantos leads estão em prospecção? houve erros? qual o consumo recente?

**Próxima fase:** dashboard inicial orientado a decisão, não coleção de cards decorativos.

## P1 — alto impacto na operação

### Conversas precisam funcionar como inbox operacional

A listagem atual é funcional, porém deve evoluir para priorização: estado, intenção, pendência, última atividade e necessidade de intervenção precisam ser legíveis sem abrir cada conversa.

### Ações manuais precisam de feedback mais explícito

Handoff, retomada e mensagem manual são ações de consequência operacional. A UI futura deve explicitar estado em andamento, sucesso, erro e o novo dono da conversa.

### Erro de backend e sessão expirada precisam ser diferenciados

O bootstrap de autenticação atual usa uma chamada de overview; falhas gerais podem acabar apresentadas como estado anônimo. A experiência futura deve separar 401/sessão expirada de indisponibilidade/erro do servidor.

### Capabilities não devem mascarar falha operacional

A consulta de capabilities é tolerante a ausência do endpoint, útil para compatibilidade, mas um erro de rede/servidor não deve ser indistinguível de capability ausente na experiência final.

### Consumo precisa mostrar significado, não apenas métrica

A tela deve ajudar o gestor a relacionar consumo/custo com atividade: período, mensagens/conversas, LLM e tendência, com contexto suficiente para tomada de decisão.

## P2 — refinamento e qualidade

- estados vazios com próxima ação clara;
- skeleton/loading consistente entre telas;
- mensagens de erro recuperáveis;
- navegação e densidade adequadas a desktop sem perder mobile;
- foco visível, labels e contraste acessíveis;
- atalhos e redução de cliques para operador recorrente;
- consistência de nomenclatura entre servidor, OpenSpec e interface.

## Fluxos que devem guiar o redesign

1. **Gestor:** entrar → entender saúde/volume/custo → localizar exceções → agir.
2. **SDR/operador:** entrar → ver conversas que pedem atenção → abrir contexto → assumir/responder/retomar.
3. **Prospecção:** importar leads → revisar validação → iniciar lote → acompanhar progresso/falhas → abrir conversas geradas.

## Limite deste checkpoint

Nenhum componente visual, CSS, layout, rota nova ou comportamento de interação foi alterado por esta auditoria. O próximo passo é abrir uma mudança OpenSpec própria para o redesign do dashboard e dos fluxos acima.
EOF

mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'EOF'
name: Monorepo CI

on:
  push:
    branches: [main, integration/phases-0-8]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Verify shared contracts are synchronized
        run: npm run check:contracts
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
EOF

rm -f package-lock.json
npm install

touch .bootstrap-complete

echo "==> Bootstrap assembled. Running pre-commit verification."
npm run check

echo "==> Bootstrap complete."
