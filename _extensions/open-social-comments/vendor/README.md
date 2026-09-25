DOMPurify 3.4.16 is bundled locally so comment sanitization does not depend on a CDN.
Source: https://github.com/cure53/DOMPurify
Upstream license: `DOMPurify-LICENSE` (Apache-2.0 OR MPL-2.0).

To update, install the reviewed DOMPurify version as an exact dev dependency,
run `npm run vendor`, and run the browser tests. Commit the package lock and
vendored files together. The source map is not shipped or needed at runtime.
