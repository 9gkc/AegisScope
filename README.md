# AegisScope

> **AegisScope is an allowlist-first application-security operations workspace.** It helps an authenticated practitioner organise authorized programs, assets, findings, report drafts, and low-impact security reviews without turning the workspace into a broad scanning or exploitation tool.

## Product boundary

| Module | Purpose | Enforced boundary |
| :--- | :--- | :--- |
| Programs, assets, and findings | Private operational record keeping | Records are scoped to the authenticated owner or user. |
| Report studio | Markdown report drafting from a private finding | The draft requires manual review and warns against secrets or unredacted personal data. |
| HTTP header review | One low-impact `HEAD` request for an authorized asset | Active verified allowlist only, exact host matching, public-address validation, no redirects, standard ports, short timeout, and rate limiting. |
| Local configuration review | Heuristic review of Terraform, Docker Compose, and Kubernetes text | Runs in the browser only; configuration text is not posted, persisted, or uploaded. |
| Public Portfolio | Present selected work and professional principles | Never queries private workspace records. |

## Responsible-use policy

AegisScope is designed only for assets that the user is explicitly authorized to assess. It intentionally excludes broad discovery, port scanning, exploit execution, credential attacks, authentication bypass attempts, and testing against unapproved targets. The platform does not certify a target as secure; all observations require context-aware human validation.

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

The database schema lives in `drizzle/schema.ts`. Update the schema, generate and review a migration, then apply the reviewed SQL before relying on a new data model.

## Security model

The detailed threat model, access matrix, and module limits are available in [`docs/security-model.md`](docs/security-model.md). To report a potential security issue in this project, use the contact and disclosure process published by the repository owner rather than including sensitive details in a public issue.
