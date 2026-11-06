---
name: apache-license-header
description: Adds the short Apache 2.0 license header (Copyright + SPDX-License-Identifier) to source files in projects licensed under Apache-2.0. Use whenever you create or edit a source file (java, ts, css, html, sh, ps1, bat, yml, properties, Dockerfile, pom.xml) in such a project, or when asked to add/check license headers across the repo.
---

# Apache 2.0 license header

Per the [ASF license FAQ](https://www.apache.org/foundation/license-faq.html#Apply-My-Software), every source file of an Apache-2.0 project carries a short header:

```
Copyright <year> <owner>
SPDX-License-Identifier: Apache-2.0
```

## When to apply

1. Check that the project is Apache-2.0: the root `LICENSE` starts with "Apache License / Version 2.0". If not, do nothing.
2. When you **create** a source file, or **edit** one that has no header, add the header. If a file already contains `SPDX-License-Identifier` in its first lines, leave it untouched (never duplicate, never change the year of an existing header).
3. Owner: the copyright holder of the project (default: `git config user.name`; this repo: `Tobias Hofmann`). Year: the year the file was created (current year for new files).

## How

Use the bundled script, which picks the right comment syntax, keeps shebangs / `<?xml?>` / `@echo off` / Dockerfile `# syntax=` lines first, preserves BOM and line endings, and is idempotent:

```sh
python3 .claude/skills/apache-license-header/scripts/add_header.py --owner "Tobias Hofmann" [--year 2026] [--dry-run] <file-or-dir>...
```

- With no paths it processes all git-tracked files in the repo.
- For tracked files without `--year`, the year of the first commit is used; untracked (new) files get the current year.
- It skips generated/vendored content (`node_modules`, `dist`, `target`, `.angular`, `documentation`, lock files, `mvnw*`, `*.d.ts`, binaries, JSON/Markdown).

Do not hand-write headers when the script can do it. After running, review `git diff --stat` and make sure the build still passes.
