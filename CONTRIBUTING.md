# Contributing to AegisScope

Thank you for helping improve AegisScope.

## Core Boundary

AegisScope is an **allowlist-first** AppSec operations workspace. Contributions must preserve the following boundaries:

- Only authorized assets may be reviewed
- No broad discovery, port scanning, or exploit execution
- No credential attacks or authentication bypass attempts
- Header reviews remain low-impact and tightly constrained
- Local configuration reviews stay in the browser and must not upload content

## Development Standards

- Prefer small, focused, and explainable changes
- Keep authentication and authorization assumptions explicit
- Never hard-code secrets, tokens, or production identifiers
- Update documentation and the security model when behavior changes
- Keep all project content in English

## Local Quality Gate

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

## Pull Requests

A good pull request describes the problem, the solution, the validation performed, and any impact on authorization or privacy boundaries.

## Security Reports

Follow the process in [SECURITY.md](SECURITY.md). Do not post sensitive details in public issues.
