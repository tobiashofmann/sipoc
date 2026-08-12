# 9. i18n via ngx-translate, German-first domain content

## Status

Accepted

## Context

The tool's domain vocabulary is German (SIPOC is internally also called "LIPOK": Lieferant, Input,
Prozess, Output, Kunde) and its primary users are German-speaking, but the codebase and
documentation are meant to stay accessible to English-speaking contributors too.

## Decision

Split the language concern in two:

- **Code and identifiers are English** everywhere (class/method/variable names, DTO fields, REST
  paths) — including in `Lipok`, whose fields and API are all English despite the entity itself
  standing in for the German "LIPOK" acronym.
- **Domain/business *content*** — seed data, example SIPOC entries, the `lipok.md` design notes —
  is German, since that's the language the tool's actual output is authored and consumed in.
- **Frontend user-facing UI strings** go through `@ngx-translate` with German and English
  translation files, not hardcoded text, so the UI itself can be used in either language regardless
  of what language the underlying data was entered in.

One deliberate exception: the Markdown export (`LipokExportService.buildMarkdown`) always emits
fixed German section/column headers (`Metadaten`, `Geschäftsobjekt`, `LIPOK`, `Lieferant`, `Input`,
`Prozess`, `Output`, `Kunde`) regardless of the UI's current language — the export format is not
currently wired into the translation system.

## Consequences

- A contributor reading the codebase never needs German to understand *how* it works — only the
  seeded example data and the exported Markdown headers are German.
- New user-facing strings must be added to both translation files (or the PR is incomplete); this
  is a manual discipline `@ngx-translate` doesn't enforce automatically.
- The Markdown export's hardcoded German headers are a known inconsistency with the "UI strings are
  translated" rule above — internationalizing the export was out of scope when it was built and
  would need its own follow-up decision.
