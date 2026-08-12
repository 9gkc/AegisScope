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

## Production readiness and publication

Before publishing a release, run the following checks from the project root:

```bash
pnpm test
pnpm check
pnpm build
```

When a schema change is required, update `drizzle/schema.ts`, generate the migration with `pnpm drizzle-kit generate`, review the generated SQL, and apply that reviewed migration through the managed database workflow. Never substitute an unreviewed schema push for a production migration and never place production secrets in source control.

Authentication is provided by the managed OAuth configuration. The project owner is established from the platform-managed owner identity; do not hard-code account identifiers, session secrets, database URLs, or OAuth values in the client or repository. Deploy only after saving a checked project version, then use the project interface’s **Publish** control to release that version.

> **Operational requirement:** Before activating a header review, record the program authorization, add the exact public asset to the allowlist, and have the workspace owner verify it. The release must not be used to perform broad discovery, exploit execution, credential attacks, or testing of systems without explicit authorization.

## Security model

The detailed threat model, access matrix, and module limits are available in [`docs/security-model.md`](docs/security-model.md). To report a potential security issue in this project, use the contact and disclosure process published by the repository owner rather than including sensitive details in a public issue.
