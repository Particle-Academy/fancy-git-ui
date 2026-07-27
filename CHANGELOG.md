# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0:** breaking changes land in MINOR releases. Until 1.0 the minor
> number is not a compatibility promise — read the entry, not the version.

## [Unreleased]

## [0.1.2] — 2026-07-26

### Fixed

- **`<WorkingTree>` rows ran the path and its status together** — a file showed
  as `src/runtime/run-flow.tsmodified`. The row's two children (the path label
  and the status) are adjacent inline boxes and the stylesheet never gave the
  row a layout, so they simply abutted. Every consumer saw it; it surfaced when
  the showcase first rendered the component.

  The row is now a flex line with the status pushed right and dimmed, and a long
  path ellipsises instead of pushing the status off the edge.

  **What you must DO:** nothing, if you import `@particle-academy/fancy-git-ui/styles.css`.
  If you replaced that stylesheet with your own, add a layout for
  `[data-git-path]` — the markup is unchanged.

[Unreleased]: https://github.com/Particle-Academy/fancy-git-ui/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/Particle-Academy/fancy-git-ui/compare/v0.1.1...v0.1.2
