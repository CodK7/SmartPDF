# SmartPDF Privacy Notice

Last updated: 31 August 2026

## Local document storage

SmartPDF stores document drafts in the browser (IndexedDB) on the user's device. SmartPDF does not provide cloud document storage or account synchronization in the current release. Drafts are deleted when the user deletes them or clears the site's data in the browser; they cannot be recovered afterwards.

## PDF export processing

When a user explicitly selects **Export PDF**, SmartPDF sends only the HTML, CSS, embedded fonts, and document data required to create that PDF to Cloudflare Browser Rendering. Cloudflare acts as an external data processor for this operation.

The production renderer is restricted to the PDF Quick Action. SmartPDF sets `cacheTTL` to `0`, disables JavaScript, does not use Crawl or Session Recording, and blocks renderer network access except for embedded `data:` resources required by the document. SmartPDF does not persist the submitted HTML or returned PDF on its server after the request completes and does not log document content.

The generated PDF is returned directly to the user's browser. If the protected renderer or its required Cloudflare bindings are unavailable, export fails without using a less secure fallback.

## Data minimization and safeguards

Export requests are size-bounded, schema-validated, same-origin protected, escaped before HTML rendering, and rate-limited. Profile images must be validated and cropped to the supported local format before export. Arbitrary URLs, filesystem access, command execution, and access to localhost or private networks are not permitted by the renderer architecture.

Operational logs may contain an error category, response status, timing, and request-level platform metadata needed to operate the service. They must not contain CV, invoice, quotation, HTML, image, or PDF content.

## Third-party processing

Cloudflare processes export data transiently to create the requested PDF. Deployment owners must review and accept the applicable Cloudflare terms, data-processing terms, region settings, and retention commitments before production launch.
