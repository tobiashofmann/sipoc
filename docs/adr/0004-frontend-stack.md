# 4. Frontend stack: Angular standalone components, SAP UI5 Web Components, Tailwind CSS

## Status

Accepted

## Context

The UI needed a component/widget library well-suited to dense, tabular, enterprise-style business
data (partner lists, SIPOC columns, Go hierarchies) without building form controls, tables, and
layout primitives from scratch, plus a way to add utility styling on top without fighting the
widget library's own CSS.

## Decision

Build the frontend as an Angular application using **standalone components** (no `NgModule`s),
**SAP UI5 Web Components** (`@ui5/webcomponents` / `@ui5/webcomponents-fiori`) as the widget
library — framework-agnostic custom elements that work naturally alongside Angular's own component
model — and **Tailwind CSS** for layout/utility styling on top. Components that use UI5 elements
declare `schemas: [CUSTOM_ELEMENTS_SCHEMA]` so Angular's template compiler accepts the custom
element tags.

`@ngx-translate` handles i18n (see [0009](0009-i18n-ngx-translate.md)).

Feature folders under `src/app/` mirror the backend aggregates one-to-one (`business-partners/`,
`gos/`, `sipocs/`, plus `home/` for the dashboard and `shared/` for cross-cutting services), each
typically holding a `*.model.ts`, `*.service.ts` (HTTP calls), and list/detail components.

## Consequences

- Standalone components avoid `NgModule` boilerplate, at the cost of every component needing its
  own explicit `imports` array — there's no module-level "import once, use everywhere."
- SAP UI5 Web Components being framework-agnostic custom elements means Angular has no built-in
  type-checking or template diagnostics for their attributes/events; mistakes there surface at
  runtime, not compile time.
- Because the feature folders mirror the backend aggregates, a backend model change (e.g. a new
  field in `SCHEMA.md`) has an obvious, predictable place to land on the frontend side too.
