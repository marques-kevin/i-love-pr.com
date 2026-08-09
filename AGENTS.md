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
- Format: **Prettier** (`npm run format`)
- Types: `npm run typecheck`
- Tests: `npm run test`
- Full gate: `npm run check`
