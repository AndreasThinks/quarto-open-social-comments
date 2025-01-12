# Open Social Comments for Quarto

This extension adds social media comments to your Quarto blog posts, supporting both Mastodon and Bluesky. The Mastodon integration is based on [the excellent webcomponent by dpecos](https://github.com/dpecos/mastodon-comments?tab=readme-ov-file). You can see (and leave a comment on) a [working example on my blog here](https://andreasthinks.me/posts/quarto_comments/).

> **Note**: This extension was previously named "quarto-mastodon-comments". The repository has been renamed to better reflect its expanded functionality. The old installation command will continue to work thanks to GitHub's automatic redirects.

## Installing

```bash
quarto install extension AndreasThinks/open-social-comments
```

> If you previously installed this extension as `quarto-mastodon-comments`, you don't need to make any changes. GitHub's redirects ensure that existing installations continue to work.

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

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
