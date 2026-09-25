# Open Social Comments for Quarto

This extension adds social media comments to your Quarto blog posts, supporting both Mastodon and Bluesky.

You can see (and leave a comment on) a [working example on my blog here](https://andreasthinks.me/posts/quarto_comments/open-social.html).

> **Note**: This extension was previously named "quarto-mastodon-comments". The repository has been renamed to better reflect its expanded functionality. The old installation command will continue to work thanks to GitHub's automatic redirects.

## Migration from quarto-mastodon-comments

If you previously used quarto-mastodon-comments, the simplest migration path is to install open-social-comments alongside it:

1. Keep your existing quarto-mastodon-comments installation to maintain compatibility with older posts
2. Install open-social-comments using the command below
3. For new posts, use the open-social-comments configuration format

This approach ensures your existing posts continue to work while allowing you to use the expanded features in new content.

## Installing

```bash
quarto add AndreasThinks/quarto-open-social-comments
```

> If you previously installed this extension as `quarto-mastodon-comments`, you don't need to make any changes. GitHub's redirects ensure that existing installations continue to work.

To pin the current release instead of following `main`:

```bash
quarto add AndreasThinks/quarto-open-social-comments@v1.1.0
```

[Release notes and downloads](https://github.com/AndreasThinks/quarto-open-social-comments/releases/latest)

This will install the extension under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using

### Mastodon Comments

1. Create a post about your content on Mastodon (for example, an announcement post)
2. Click on this post to obtain the relevant "toot id" from the URL
3. Add the following to your post's YAML header, replacing the values with your Mastodon details:

```yaml
filters:
  - open-social-comments
mastodon_comments:
  user: "AndreasThinks"
  host: "fosstodon.org"
  toot_id: "111995180253316042"
```

### Bluesky Comments

1. Create a post about your content on Bluesky
2. Copy the post's URL
3. Add the following to your post's YAML header:

```yaml
filters:
  - open-social-comments
bluesky_comments:
  post_uri: "https://bsky.app/profile/theradr.bsky.social/post/3knoaw5z4ek2v"
```

### Using Both

You can enable both Mastodon and Bluesky comments on the same post by including both configurations:

```yaml
filters:
  - open-social-comments
mastodon_comments:
  user: "AndreasThinks"
  host: "fosstodon.org"
  toot_id: "111995180253316042"
bluesky_comments:
  post_uri: "https://bsky.app/profile/theradr.bsky.social/post/3knoaw5z4ek2v"
```

## Threaded replies and links

Replies are grouped beneath the comment they answer on both platforms. Top-level
threads are newest first; replies within a thread are oldest first. Use the reply
count below a comment to collapse or expand its children. Deep threads retain their
parent links while visual indentation stops after three levels, including on mobile.
Replies with an unavailable parent remain visible with a short notice.

Mastodon links, mentions and hashtags retain their original destinations and safe
formatting. Bluesky links use the post's rich-text facets: shortened display text
links to the full URL, mentions link to the referenced account, and Unicode hashtags
are supported. Plain HTTP(S) URLs also become links when facets are absent. Reply
links open the corresponding social post; this extension does not post replies itself.

Only public replies supplied by each platform are shown. Mastodon's unauthenticated
context endpoint has limits (currently 60 descendants and depth 20); Bluesky is
requested with depth 100 and may still return incomplete or moderated threads.
The original-conversation links remain available for the full discussion. No API
keys or login are needed. A failed platform shows an error and retry button while
successful results from the other platform remain visible.

Mastodon content warnings and sensitive content are collapsed initially. External
HTML is sanitized **before** insertion using the bundled DOMPurify dependency. If
that dependency is unavailable, Mastodon content is displayed as text.

### Styling

The existing CSS custom properties are scoped to `social-comments`, so they do not
change unrelated page elements. For example, add this to your site's CSS:

```css
social-comments {
  --comment-indent: 20px;
  --block-background-color: #f7f8f8;
  --font-color: #5d686f;
}
```

### Updating

```bash
quarto update extension AndreasThinks/quarto-open-social-comments
```

Re-render your site after updating. Existing YAML configuration continues to work.
Keep Mastodon `toot_id` values quoted to preserve the complete identifier.

## Development and checks

Install Node.js 22 or later and Quarto, then run:

```bash
npm ci
npx playwright install chromium
npm test
npm run test:filter
quarto render example.qmd
```

The browser tests use deterministic API fixtures and include threading, hyperlinks,
Unicode offsets, unsafe HTML/URLs, missing posts, platform failures, multiple
instances, and mobile layout. The filter tests render real Quarto documents to
check dependency packaging, metadata escaping, HTML insertion and non-HTML output.
Set `QUARTO_BIN` or `CHROMIUM_PATH` if using executables outside the default paths.
See [the review notes](docs/REVIEW.md) for remaining improvements and limitations.

## Publishing releases

Update the version in `_extension.yml`, the Lua dependency declaration and
`package.json`/`package-lock.json`, and add `docs/releases/vX.Y.Z.md` with release
notes. After the changes reach `main` and the **Test extension** workflow passes,
the release workflow creates the version tag, publishes a GitHub release and
attaches an archive containing the installable extension. Existing releases and
tags are never overwritten.

Quarto's unpinned install/update commands use `main`; `@vX.Y.Z` installs a specific
tag. Users need no npm build step and should re-render their site after updating.

## Acknowledgements

This project builds upon and is inspired by the work of others:

- The Mastodon comments component is based on the [mastodon-comments webcomponent](https://github.com/dpecos/mastodon-comments) by dpecos
- The Bluesky comments implementation draws from [this webcomponent](https://gist.github.com/LoueeD/b7dec10b2ea56c825cbb0b3a514720ed) by LoueeD
- HTML sanitization uses [DOMPurify](https://github.com/cure53/DOMPurify), bundled with its upstream license

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
