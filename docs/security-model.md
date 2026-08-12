# AegisScope Security Model

## Responsible-use boundary

Every network-facing module is constrained to assets the user has explicitly entered as authorized and attached to an active program. The platform is not designed for broad discovery, credential attacks, exploit execution, vulnerability exploitation, port scanning, or testing of any unapproved target.

## Authorization matrix

| Action | Owner | User | Unauthenticated visitor |
| :--- | :---: | :---: | :---: |
| View public Portfolio | Yes | Yes | Yes |
| Create and manage own programs, assets, findings, and reports | Yes | Yes | No |
| Run a header review for own active allowlisted assets | Yes | Yes | No |
| View another user's private records | Yes | No | No |
| Review local configuration | Yes, browser-only | Yes, browser-only | No |

## Module limits

| Module | Enforced limit |
| :--- | :--- |
| Asset inventory | Inputs are normalized and accepted only as public domains, public IP addresses, or HTTP(S) application URLs. Authorization status and program association are required. |
| Header reviewer | Exact host match against active assets, public-network validation, standard HTTP/S ports only, short timeout, no redirects, and request rate limiting. |
| Findings and reports | Evidence is free-text metadata only; do not store secrets, access tokens, production credentials, or unredacted personal data. |
| Local configuration review | Runs entirely in the browser. Configuration text is never posted, persisted, or uploaded. |
| Public Portfolio | Reads only deliberately published profile content; it never queries private workspace data. |

## Rate limits

Sensitive write operations and header-review requests are limited per authenticated user in the application process. This is a defence-in-depth control; production deployments should additionally use platform-level request limits at the edge for multi-instance enforcement.

