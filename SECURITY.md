# Security reporting and release status

The application is under active launch development. No long-term support or
security response-time commitment is currently established.

## Reporting a vulnerability

Do not post access tokens, account identifiers, private garden exports or a
working exploit containing personal data in a public issue. Report suspected
vulnerabilities privately to [aaron@categori.se](mailto:aaron@categori.se).
The maintainer designated this contact for security reports; no response-time
commitment is currently established.

Include the affected version or URL, minimal reproduction using your own test
data, expected versus observed behavior, and the scope of exposure. Redact
credentials and other people's information. Do not test other users' accounts,
run load tests or broadly scan infrastructure to demonstrate a report.

## Relevant boundaries

- Local gardens remain in browser storage unless explicitly exported or uploaded
  as an account copy. Clearing browser storage can remove local work.
- Account saves contain personal gardens and their named versions. Both the
  browser and service exclude public-demo workspaces; demo-only uploads are
  refused. The service derives ownership from the authenticated identity and
  uses conditional revisions for writes.
- Restoring an account copy replaces personal gardens after confirmation and
  preserves this browser's public-demo experiments. Full downloaded JSON backups
  include local demo work as well; handle those files as private garden data.
- Editing or renaming a public demo does not make it personal. **Copy to my
  gardens** explicitly creates a separate personal workspace eligible for upload.
- Versioned deletion removes the current account-list entry but retains storage
  versions; it is not permanent erasure.
- Hosted authentication, cross-browser recovery and account isolation require
  real acceptance evidence in addition to local tests. Validate these against the
  specific deployed release; see [source preparation](docs/architecture/public-release.md).

Do not commit live account configuration, tokens, private fixtures or operational
receipts. Use synthetic payloads for tests and retain sensitive incident evidence
outside the public repository.
