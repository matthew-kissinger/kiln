# Search indexing — September 6, 2026

The owner reported Search Console's “Duplicate without user-selected canonical”
warning for kilnstudio.tools. The domain property's report was inspected in the
owner's browser. Its six affected URLs were last crawled August 28–September 1,
before the current OSS site snapshot. Google's individual selected canonicals
were not inspected; the current live responses were checked for all six.

| Reported URL | Current first response | Current destination |
| --- | --- | --- |
| `https://www.kilnstudio.tools/` | 301 | Canonical HTTPS apex |
| `http://www.kilnstudio.tools/` | 301 | Canonical HTTPS apex |
| `https://play.kilnstudio.tools/` | 302 | GitHub Pages, then canonical HTTPS apex |
| `https://play.kilnstudio.tools/pocket-settlement` | 302 | Same redirect chain |
| `https://play.kilnstudio.tools/tower-defense` | 302 | Same redirect chain |
| `https://play.kilnstudio.tools/chess-board` | 302 | Same redirect chain |

All six end at a 200 HTML document declaring `https://kilnstudio.tools/` canonical.
Search Console accepted **Validate Fix** and showed **Validation started** on
September 6. This requests a fresh evaluation; it does not mean Google has finished
validation or indexed every duplicate. Analytics configuration was not changed.

## Live checks before this change

- `https://kilnstudio.tools/` returns 200 with exactly one static HTML canonical:
  `https://kilnstudio.tools/`.
- HTTP, `https://www.kilnstudio.tools/`, and the GitHub Pages project address
  redirect to that HTTPS apex URL.
- `/index.html` and a query-string variant return 200 and declare the same
  canonical root. They should consolidate into the root, not be indexed separately.
- `/robots.txt` and `/sitemap.xml` returned 404.

This change adds a crawl-allowing robots file referencing a sitemap that contains
only the canonical root. The existing canonical remains in the original HTML.
Hash routes such as `#/gallery` are views within one document; they are not listed
as separate crawlable pages or given fragment canonicals. Individually indexed
gallery pages would require real page URLs and distinct page content.

Google treats redirects and canonical links as strong signals and sitemap entries
as a weaker, complementary signal. A missing sitemap alone does not establish
the cause of this warning. Do not block duplicate URLs with robots.txt or add
`noindex` to the main page to try to solve canonical selection.

Reference: [Google's canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## Remaining Search Console work

1. Submit `https://kilnstudio.tools/sitemap.xml` after deployment.
2. Allow Google to recrawl. Deployment cannot guarantee indexing or immediately
   clear the report. A duplicate excluded in favor of the intended root is normal.
3. If the report persists after a fresh crawl, inspect Google's selected canonical
   for the remaining examples. The retired `play` host could be simplified to a
   direct permanent redirect at its hosting configuration; that infrastructure
   is not owned by this GitHub Pages repository and was not changed here.

No account permissions were changed. Deployment and sitemap submission receipts
are recorded in the release handoff.
