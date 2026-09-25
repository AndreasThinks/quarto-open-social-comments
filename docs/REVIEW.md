# September 2026 review

Reviewed the complete extension (JavaScript, Lua filter, extension metadata,
installation instructions and example), starting at `e761199`.

## Implemented

| Finding | Fix |
| --- | --- |
| Replies were globally flattened; Mastodon direct replies were all indented and Bluesky read the wrong parent field. | Build platform-specific parent/child trees. Preserve orphaned replies, deduplicate IDs, guard cycles, order siblings, provide collapse controls and parent links, and cap visual indentation. |
| Bluesky-only pages threw a `ReferenceError` while reading undefined Mastodon globals. | Read per-element attributes on connection, with guarded support for legacy global configuration. |
| Untrusted remote HTML was inserted before optional sanitization; unsafe URLs were interpolated into markup. | Build the interface with DOM APIs, allow only HTTP(S) URLs, bundle DOMPurify locally, sanitize Mastodon formatting before insertion, and fall back to text if sanitization is unavailable. |
| The Lua filter rebuilt `quarto-content` with `innerHTML +=`, replacing existing elements and their event handlers; metadata was interpolated into executable scripts. | Append an escaped static web component through the Pandoc AST. No global variables or inline insertion scripts; no web dependencies for unconfigured or non-HTML documents. |
| Fetch failures were swallowed; Mastodon HTTP errors were not checked. | Check HTTP status, bound requests with timeouts, load platforms independently, display actionable errors and allow retries without duplicating results. |
| Deleted/blocked Bluesky thread entries could abort processing. | Handle union members without posts and retain available replies. Resolve handle URLs to canonical DIDs before loading threads. |
| Bluesky regex replacements ignored link facets and UTF-8 offsets, losing full destinations and mislinking some text. | Render links, mentions and hashtags from byte-indexed facets, preserve newlines, and safely link plain URLs. Preserve sanitized Mastodon anchors. |
| Global IDs, global CSS defaults and duplicate component registrations prevented reliable multi-instance use. | Scope queries/styles to each component, create unique comment IDs, and make registration/reconnection idempotent. |
| Engagement summaries could double-count duplicated posts or imply that all replies had loaded. | Deduplicate posts and label the reply total as loaded replies. Explain platform limits and retain links to the original conversations. |
| Mastodon content warnings and sensitive flags were ignored. | Place marked content and attachments behind an initially collapsed disclosure. |

Version: **1.1.0**. No publishing, authentication or backend service is introduced.

## Further improvements to consider

1. **Large-thread continuation:** add bounded, user-triggered fetching of truncated
   branches. Mastodon unauthenticated context is limited to 60 descendants/depth 20;
   requesting greater Bluesky depth alone cannot guarantee every reply. Avoid
   unbounded per-comment requests that amplify rate limits.
2. **Moderation controls:** let site owners exclude posts/accounts and configure
   Bluesky label handling. The current reader follows public API availability and
   does not implement a complete moderation policy or labeler preference system.
3. **Reader privacy and caching:** an optional “Load comments” button would let
   readers choose when to contact social servers; consider caching and refresh
   controls for frequently visited pages.
4. **Rich media:** render Bluesky images, external cards, quoted posts and video;
   support Mastodon custom emoji and polls. This change preserves the existing
   Mastodon attachment support but does not implement these additional embeds.
5. **Theme and accessibility coverage:** add automatic Quarto light/dark theme
   defaults, localisation, and Firefox/WebKit plus screen-reader checks. The
   existing CSS variables remain available for site-specific styling.

## API references

- [Mastodon status context and public limits](https://docs.joinmastodon.org/methods/statuses/#context)
- [Bluesky getPostThread lexicon](https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/feed/getPostThread.json)
- [Bluesky rich-text facets](https://docs.bsky.app/docs/advanced-guides/post-richtext)
- [Quarto Lua API](https://quarto.org/docs/extensions/lua-api.html)
