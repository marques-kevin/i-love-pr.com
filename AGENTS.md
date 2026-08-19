# Agent / contributor conventions

## Structure

```
src/
  modules/
    dashboard/
      components/   # UI + connectors
      redux/        # slice + thunks
    settings/
    sync/
    onboarding/
    app/            # shell layout
  store/            # create_store, create_app_async_thunk, ThunkExtra
  repositories/
  lib/
  components/ui/    # shadcn only
```

## Naming

- **Variables, functions, Redux state keys, repository methods**: `snake_case` (`get_settings`, `map_state_to_props`, `elapsed_hours`)
- **Classes, types, interfaces, React component exports**: `PascalCase` (`IlovePrDatabase`, `AppSettings`, `Dashboard`, `Wrapper`)
- **Files**: `snake_case` everywhere (`dashboard.tsx`, `dashboard.connector.tsx`, `settings_repository.ts`)
- **Exception**: React/DOM/framework props stay camelCase (`className`, `onClick`, `onOpenChange`)

## Redux

- Use **Redux Toolkit** + `react-redux` **`connect`** — presentational pattern
- **Forbidden**: `useAppDispatch`, `useAppSelector`, and other Redux hooks
- **Event-oriented boot**: `main.tsx` dispatches `global_app_initialized()` after `create_store`; side effects chain via **listener middleware** (`src/store/register_app_listeners.ts`) — not `useEffect` in App
- **Forbidden in `src/modules/app/**`**: `useEffect` / `useLayoutEffect` (enforced by oxlint)
- Pattern:
  - `mon_fichier.connector.tsx` — `map_state_to_props`, `map_dispatch_to_props`, `connector`, `ConnectorProps`
  - `mon_fichier.tsx` — `export function Wrapper` + `export const MonFichier = connector(Wrapper)`
- **One connector per component** that reads/writes Redux — never a god-connector on App that pipes everything as props
- App / Dashboard stay thin layout shells that compose connected children — **no props drilling of Redux data**
- Use `create_app_async_thunk` (typed `RootState` + `ThunkExtra`) — never raw `createAsyncThunk` with manual config
- Inject repositories via `thunk.extraArgument` (`create_store({ repositories })`) — never import Dexie repos as singletons inside slices

## Data access

- IndexedDB only through `src/repositories/*`
- `src/lib/db.ts` — Dexie schema + `db` export only
- Production: `create_dexie_repositories(db)`
- Tests: `create_memory_repositories()`

## Testing

- Vitest, `environment: 'node'`
- Unit-test pure logic and repositories only
- **Never** test React components — no `@testing-library/react`
- Coverage: `npm run test:coverage` (v8, reports in `coverage/`)

## Tooling

- Lint: **oxlint** (`npm run lint`)
- Format: **Prettier** (`npm run format` / `npm run format:check`)
- Types: `npm run typecheck` (`tsc -b --noEmit && tsc -p functions --noEmit`)
- Tests: `npm run test`
- Functions bundle: `npm run functions:build` (`wrangler pages functions build`, no deploy)
- Full gate: `npm run check` (typecheck + lint + format:check + test + i18n + functions:build)
- **Git hooks** (Husky, installed via `npm install` → `prepare`):
  - `pre-commit` — Prettier on staged files via lint-staged
  - `pre-push` — full `npm run check`
- **Never** skip hooks (`--no-verify` / `--no-gpg-sign` to bypass) — agents included

## Review

When reviewing or cleaning up a pull request:

1. **Read** this file (`AGENTS.md`) first
2. **Review** the diff against the conventions above (naming, Redux, data access, testing, tooling)
3. **Fix** any violations with minimal, focused diffs — no unrelated refactors
4. **Verify** with `npm run check` before marking the PR ready

See also `APPROVAL_POLICY.md` for approval criteria and `.cursor/rules/pr_review.mdc` for the Cursor review rule.

## GitHub

- **Never push directly to `main`** — always work on a feature branch and open a pull request
- **Board tickets** (GitHub Projects / issues) and **pull requests** (titles + descriptions) must be written in **English**
- **Commits** use [Conventional Commits](https://www.conventionalcommits.org/) so they map to SemVer:
  - `feat:` → minor
  - `fix:` → patch
  - `feat!:` / `fix!:` / `BREAKING CHANGE:` → major
  - Also allowed: `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `style:` (no release bump unless marked breaking)
  - Subject in English, imperative, no trailing period (e.g. `feat: add dashboard tabs`)
