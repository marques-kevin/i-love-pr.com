# Approval policy

Before reviewing or approving a pull request, the agent must follow this workflow.

## 1. Read project conventions

Read `AGENTS.md` at the repository root. It defines naming, Redux patterns, data access, testing, tooling, and GitHub conventions. Treat it as the single source of truth for this codebase.

## 2. Review the changes

Inspect the PR diff against `AGENTS.md`:

- **Naming**: `snake_case` for variables, functions, state keys, repository methods, and file names; `PascalCase` for types, interfaces, and React component exports
- **Redux**: `connect` pattern with one connector per component; no Redux hooks; no `useEffect` in `src/modules/app/**`; `create_app_async_thunk`; repositories injected via thunk extra argument
- **Data access**: IndexedDB only through `src/repositories/*`; no direct Dexie imports in slices
- **Testing**: Vitest node environment; unit-test logic and repositories only; never test React components
- **Tooling**: code must pass `npm run check` (typecheck, lint, format, test, i18n)

Flag any violation as a review finding. Do not approve until violations are fixed or explicitly justified.

## 3. Clean up to match guidelines

When the agent is allowed to edit the PR (review automation with write access), fix violations directly:

- Rename identifiers and files to match conventions
- Refactor Redux usage to the connector pattern
- Move data access behind repositories
- Run `npm run check` and fix remaining failures

Prefer minimal, focused diffs. Do not refactor unrelated code.

## Approval criteria

Approve only when:

- CI passes (typecheck, lint, format, test, i18n)
- Changes align with `AGENTS.md`
- No unresolved review findings from Bugbot or Security Agents (when enabled)
- PR title and description are in English; commits follow Conventional Commits

Require human review when:

- The PR changes `AGENTS.md`, `APPROVAL_POLICY.md`, or `.cursor/**` policy files
- The PR touches sync, authentication, or data persistence in non-trivial ways
- Risk score exceeds the configured threshold
