---
name: feature-branch-workflow
description: Git workflow for this repo, where main is protected on GitHub. Use at the start of every feature, bugfix, refactor or dependency update (any change that will be committed) to create a feature branch, and again when the user says the work is done or asks for a PR. Never commit to main, and only open a PR after local tests pass and the user explicitly approves.
---

# Feature branch workflow

`main` is protected on GitHub: all changes reach it through a pull request.

## 1. Start of a feature: create a branch

Before the first edit of a new feature/fix/chore:

1. `git branch --show-current`. If it is `main` (or another unrelated branch), branch off an up-to-date `main`:
   ```sh
   git fetch origin
   git switch -c <type>/<short-kebab-description> origin/main
   ```
   `<type>` is one of `feature`, `fix`, `chore`, `docs`, `refactor` (e.g. `feature/lipok-export-pdf`, `chore/update-mcp-deps`).
2. If the working tree has uncommitted changes that belong to a different task, ask the user before switching; never discard or silently carry them over.
3. If already on a matching feature branch, keep working there. One feature = one branch.

## 2. While working

- Commit only on the feature branch, in small logical commits (follow the repo's commit style and attribution rules).
- **Never** commit to or push `main`; never force-push; never merge into `main` locally.
- Everything stays on the feature branch (local, or pushed to `origin/<branch>` only when the user asks) until step 3 is complete.

## 3. Finishing: tests, then the user's go-ahead, then PR

1. Run all tests for every part touched, locally, and make sure they pass:
   - Backend: `cd backend/server && ./mvnw test`
   - Frontend: `cd frontend/sipoc-ui && npm test -- --watch=false`
   - MCP server (no test suite): `cd sipoc-mcp-server && npm run build`
   If anything fails, fix it on the branch (or report it); do not proceed to a PR.
2. Report the result to the user (what ran, pass/fail, branch name, `git log --oneline origin/main..HEAD`) and **ask whether to create the PR**.
3. Only after the user explicitly says so: push the branch (`git push -u origin <branch>`) and open the PR with `gh pr create --base main`, with a short summary and test results in the description.
4. Do not merge the PR; the user merges it. After the merge, offer to switch back to `main`, pull, and delete the local branch.

"Tests passed" is not approval. The PR is created only when the user explicitly asks or confirms it.
