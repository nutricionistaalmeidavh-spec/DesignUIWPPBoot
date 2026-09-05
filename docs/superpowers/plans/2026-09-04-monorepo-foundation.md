# WPP Prospector Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the current functional server/bot and panel into a stable npm-workspace monorepo, preserve OpenSpec, validate the integrated build, and document the current UI/UX before any redesign.

**Architecture:** Keep the current server+bot runtime intact under `apps/server`, migrate the React panel under `apps/panel`, and introduce `packages/contracts` as the shared management API contract surface. The server OpenSpec tree becomes canonical at repository root; visual UI remains unchanged in this checkpoint.

**Tech Stack:** Node.js 24+, TypeScript, Fastify, Zod, Vitest, React 18, Vite, TanStack Query, React Router, npm workspaces, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-monorepo-foundation-design.md`

## Global Constraints

- Do not modify the two source repositories.
- Server source is pinned to `464e5dcb1cef198721e1db3c46cc48500ae02d0d` from `feature/refinamento_bot`.
- Panel source is pinned to `f8ef396c0dca73e89618fa79922b1633577ecb90` from `main`.
- Node.js minimum is 24.
- No visual UI redesign in phases 0–8.
- Preserve the server's canonical OpenSpec history.
- Remove local/cache/generated artifacts from the migrated snapshot.

---

### Task 1: Baseline and isolated migration branch

**Files:**
- Create: `docs/baseline.md`
- Existing branch: `integration/phases-0-8`

**Produces:** Exact source SHAs and migration provenance.

- [ ] Record source repo, branch and commit SHAs.
- [ ] Record destination baseline SHA.
- [ ] Confirm source repositories receive no writes.
- [ ] Commit baseline documentation.

### Task 2: Migrate server and panel snapshots

**Files:**
- Create: `apps/server/**`
- Create: `apps/panel/**`
- Create: `docs/legacy/panel-openspec/**`
- Create/replace: `openspec/**`

**Produces:** Pinned source snapshots inside the destination repository.

- [ ] Clone server source at the pinned SHA in CI migration tooling.
- [ ] Clone panel source at the pinned SHA.
- [ ] Copy server runtime while excluding `.git`, `.DS_Store`, `.agents`, `.claude`, `.vscode`, `node_modules`, `dist` and nested `.github` workflows.
- [ ] Move the server OpenSpec tree to repository root.
- [ ] Copy panel runtime with the same local/generated exclusions.
- [ ] Preserve panel OpenSpec separately under `docs/legacy/panel-openspec`.
- [ ] Verify the expected package names and source entry points exist.

### Task 3: Create workspace and shared contracts

**Files:**
- Create: `package.json`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/src/**`
- Create: `scripts/sync-contracts.mjs`
- Modify: `apps/panel/package.json`
- Modify: `apps/panel/src/api/contracts.ts`

**Consumes:** `apps/server/src/management/interface/dto/*.ts`.

**Produces:** `@wpp/contracts` workspace package.

- [ ] Add npm workspaces for server, panel and contracts.
- [ ] Write `sync-contracts.mjs` to copy the complete server DTO directory into `packages/contracts/src` deterministically.
- [ ] Run the sync once and commit the generated contract snapshot.
- [ ] Replace the panel's `file:../wpp_prospector_bot_server` dependency with `@wpp/contracts: workspace:*`.
- [ ] Replace imports from `wpp_prospector_bot_server/contracts` with `@wpp/contracts`.
- [ ] Remove nested lockfiles and generate one root `package-lock.json`.

### Task 4: Repository-level validation scripts

**Files:**
- Modify: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

**Produces:** Stable root commands.

- [ ] Add `sync:contracts`, `lint`, `typecheck`, `test`, `build` and `check` scripts.
- [ ] Keep server environment variables documented by copying its `.env.example` into the root reference file without secrets.
- [ ] Add ignores for dependencies, builds, local databases, logs, credentials and editor/cache artifacts.
- [ ] Run `npm install` on Node 24.

### Task 5: Verify equivalent server/panel behavior

**Files:** No product behavior changes unless a migration-only path resolution problem is found.

**Produces:** Evidence that the migrated code remains build/test compatible.

- [ ] Run `npm run sync:contracts`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] If a migration-only failure occurs, add the smallest possible regression test before changing behavior-bearing code.

### Task 6: CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Produces:** Pull-request and branch validation for the monorepo.

- [ ] Configure Node 24 and `npm ci`.
- [ ] Verify contracts are synchronized and fail CI on drift.
- [ ] Run lint, typecheck, tests and build.
- [ ] Upload no secrets or runtime databases.

### Task 7: OpenSpec consolidation and architecture docs

**Files:**
- Preserve: `openspec/**`
- Create: `docs/architecture.md`
- Create: `README.md`

**Produces:** One canonical product specification and architecture reference.

- [ ] Keep server OpenSpec specs and archived changes at root.
- [ ] Document component ownership and data flow.
- [ ] Document that bot-core physical extraction is intentionally deferred to avoid pre-UI regressions.
- [ ] Document the mandatory `explore → propose → apply → archive` workflow for future material changes.

### Task 8: Current screen map and UX audit

**Files:**
- Create: `docs/screen-map.md`
- Create: `docs/ux-audit.md`

**Produces:** The checkpoint immediately before redesign.

- [ ] Map login, conversations, conversation detail, consumption and fallback routes from the actual router.
- [ ] Map API dependencies and actions for each screen.
- [ ] Record missing/latent prospecting capabilities exposed by the server but not yet surfaced by the current panel.
- [ ] Audit information hierarchy, navigation, action feedback, loading/error/empty states, operator workflow, manager visibility, responsive behavior and accessibility.
- [ ] Rank UX findings as P0/P1/P2 without implementing visual changes.
- [ ] Stop before creating or applying the dashboard redesign change.

## Final verification

- [ ] Compare source SHAs with `docs/baseline.md`.
- [ ] Confirm the source repositories were not modified.
- [ ] Run `npm run check` from a clean install.
- [ ] Inspect the destination diff for accidental credentials, generated databases or UI redesign changes.
- [ ] Open a PR from `integration/phases-0-8` to `main`; do not merge automatically.
