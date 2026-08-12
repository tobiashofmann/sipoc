# 1. Record architecture decisions

## Status

Accepted

## Context

The project already documents *what* the system looks like today — `SCHEMA.md` for the backend
domain model and REST API, `CLAUDE.md` for repo layout and workflow, and per-feature-branch
`docs/requirements-*.md` files for what a given change was supposed to do. None of these capture
*why* a given structural choice was made, what alternatives existed, or what trade-offs were
accepted — that reasoning otherwise only lives in commit messages and PR discussions, which are
hard to rediscover later.

## Decision

Record significant, hard-to-reverse architectural decisions as Architecture Decision Records
(ADRs) under `docs/adr/`, numbered sequentially. Each ADR is short (Status/Context/Decision/
Consequences) and, once accepted, is treated as immutable history — a changed decision gets a new
ADR that supersedes the old one, rather than an edit.

An ADR is warranted for decisions that are expensive to reverse or that a future contributor is
likely to second-guess without the original context (e.g. "why is there no `customerId` field on
`BusinessPartner`?"). Routine implementation choices belong in code comments or PR descriptions,
not here.

## Consequences

- Future contributors (and the AI agents working on this repo) have a fixed place to check before
  proposing a structural change, and a fixed place to add reasoning when they make one.
- ADRs are documentation, not enforcement — nothing prevents the code from drifting away from a
  recorded decision. Keeping `SCHEMA.md` and the ADRs consistent with the code is a manual
  discipline, same as any other doc.
