# Contributing

Thanks for your interest in improving SIPOC Management App! Please also read our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Bugs & ideas

Please open an [issue](https://github.com/tobiashofmann/sipoc/issues) first —
for bugs, feature ideas, or questions about a rule. It's recommended (not required) to have
an issue for every pull request, so the "why" behind a change is captured.

## Making a change

- Work on a feature branch (`feature/...`, `fix/...`, `chore/...`) — `main` is protected,
  no direct commits.
- Keep pull requests small and focused on one logical change. Several small PRs are
  preferred over one large one.
- Open the pull request against `main`.

## Before opening a PR

Try out the app

```bash
npm install
./sipoc.sh start
```

- Code should be documented where the *why* isn't obvious.
- New or changed behavior needs tests.
- The CI pipeline must pass.

## Architecture

See /docs and the ADRs. Also look at [`CLAUDE.md`](CLAUDE.md) for details on the project's architecture and conventions
