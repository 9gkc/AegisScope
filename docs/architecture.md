# AegisScope Architecture

## Product boundary

AegisScope is a defensive operations workspace for assets that the signed-in user is authorized to assess. The product stores programs, explicitly authorized assets, findings, report drafts, and non-sensitive audit metadata. Its public Portfolio route is isolated from all private workspace records.

## Core entities

| Entity | Purpose | Ownership model |
| :--- | :--- | :--- |
| Program | A bug-bounty, pentest, or internal security engagement | Owned by one authenticated user |
| Asset | An explicitly authorized domain, public IP, or web application | Belongs to a program and owner |
| Finding | A documented security observation and remediation lifecycle | Belongs to a program and owner; may reference one asset |
| Report draft | A reproducible Markdown report derived from a finding | Belongs to the same owner as its finding |
| Header review | A low-impact inspection log for a validated allowlisted web asset | Belongs to the asset and owner |

## Privacy decisions

Private workspace data is accessed only through authenticated procedures. A user can view and mutate only records they own. The platform owner has an administrative oversight role. Local Terraform, Docker Compose, and Kubernetes review is parsed in the browser only and is never sent to the application server, database, or file storage.

## Defensive checks

The HTTP header reviewer only accepts HTTPS or HTTP targets matching an active allowlisted asset. It rejects embedded credentials, non-standard ports, redirects, loopback addresses, private address ranges, link-local ranges, and hostnames resolving to non-public addresses. Requests are low impact: `GET`, no redirect following, a timeout, a fixed user agent, a small response body limit, and rate limits per authenticated user.

