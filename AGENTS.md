# Agent / contributor conventions

## Naming

- **Variables, functions, Redux state keys, repository methods**: `snake_case` (`get_settings`, `map_state_to_props`, `elapsed_hours`)
- **Classes, types, interfaces, React component exports**: `PascalCase` (`IlovePrDatabase`, `AppSettings`, `Dashboard`, `Wrapper`)
- **Files**: `snake_case` everywhere (`dashboard.tsx`, `dashboard.connector.tsx`, `settings_repository.ts`)
- **Exception**: React/DOM/framework props stay camelCase (`className`, `onClick`, `onOpenChange`)

## Redux

- Use **Redux Toolkit** + `react-redux` **`connect`** — presentational pattern
- **Forbidden**: `useAppDispatch`, `useAppSelector`, and other Redux hooks
- Pattern:
  - `mon_fichier.connector.tsx` — `map_state_to_props`, `map_dispatch_to_props`, `connector`, `ConnectorProps`
  - `mon_fichier.tsx` — `export function Wrapper` + `export const MonFichier = connector(Wrapper)`
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

## Tooling

- Lint: **oxlint** (`npm run lint`)
- Format: **Prettier** (`npm run format`)
- Types: `npm run typecheck`
- Tests: `npm run test`
- Full gate: `npm run check`
