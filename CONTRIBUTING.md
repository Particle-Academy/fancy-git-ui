# Contributing to @particle-academy/fancy-git-ui

Notes for anyone, human or agent, working ON this package's code. How to USE the
package is in [AGENTS.md](./AGENTS.md); what it is, is in [README.md](./README.md).
`CLAUDE.md` is a symlink to this file, so Claude Code reads these notes when it
works in this repo.

## Layout

- `src/<component>.tsx` — one file per surface (`working-tree`, `diff-viewer`,
  `commit-history`, `repository-browser`, `review-list`, `branch-picker`,
  `commit-composer`, `create-review-form`), re-exported from `src/index.ts`.
- `src/commit-graph/` — `layoutCommitGraph`, with its own tests in
  `__tests__/`.
- `src/styles.css` — the thin default stylesheet, published as `./styles.css`.
- `tests/` — the vitest suite (`components.test.tsx`, `diff-viewer.test.tsx`).

## Invariants

- **Components emit intents; they never invoke Git or a provider API
  themselves.** Each is controlled: it takes a value and reports an intent.
- **The `data-git-*` handles are a contract**, not an implementation detail.
  Agents and stylesheets both target them, and every rule in `styles.css`
  targets one. Renaming a handle is a breaking change.
- Diff parsing, hunk ids and merge helpers come from
  `@particle-academy/fancy-file-commons`; do not reimplement them here.

## Commands

```bash
npm run build   # tsup
npm run lint    # tsc --noEmit && eslint .
npm test        # vitest run
```

`prepublishOnly` runs lint, test and build in that order.

## Changelog

Update `CHANGELOG.md` (Keep a Changelog) in the same commit as the change.
