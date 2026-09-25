const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, cpSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const work = mkdtempSync(join(tmpdir(), 'social-comments-filter-'));
cpSync(resolve(__dirname, '../_extensions'), join(work, '_extensions'), { recursive: true });
after(() => rmSync(work, { recursive: true, force: true }));
function render(name, metadata, format = 'html') {
  writeFileSync(join(work, `${name}.qmd`), `---\ntitle: Filter test\nfilters: [open-social-comments]\n${metadata}\n---\n\nExisting **content**.\n`);
  execFileSync(process.env.QUARTO_BIN || 'quarto', ['render', `${name}.qmd`, '--to', format], { cwd: work, stdio: 'pipe' });
  return readFileSync(join(work, `${name}.${format === 'html' ? 'html' : 'md'}`), 'utf8');
}
test('HTML places comments in content and bundles dependencies locally', () => {
  const html = render('both', 'mastodon_comments:\n  user: alice\n  host: social.test\n  toot_id: "123456789012345678"\nbluesky_comments:\n  post_uri: "at://did:plc:alice/app.bsky.feed.post/root"');
  assert.match(html, /<social-comments mastodon-host="social.test" mastodon-user="alice" mastodon-toot-id="123456789012345678" bluesky-post=/);
  assert.ok(html.indexOf('<social-comments') > html.indexOf('Existing <strong>content</strong>'));
  assert.match(html, /src="both_files\/libs\/(?:quarto-contrib\/)?open-social-comments-1.1.0\/purify.min.js"/);
  assert.match(html, /src="both_files\/libs\/(?:quarto-contrib\/)?open-social-comments-1.1.0\/social-comments.js"/);
  assert.doesNotMatch(html, /cdnjs.cloudflare|innerHTML \+=|var mastodonHost/);
});
test('metadata special characters cannot break out of attributes or insert scripts', () => {
  const html = render('escaping', `bluesky_comments:\n  post_uri: '\`https://bsky.app/profile/a/post/b?x="</script><img onerror=alert(1)>&y=2\`'`);
  // Quarto's HTML serializer may decode angle brackets inside a quoted attribute.
  // The quote must stay escaped and the payload must stay entirely in that attribute.
  const component = html.match(/<social-comments bluesky-post="([^"\n]*)">/);
  assert.ok(component);
  assert.match(component[1], /&quot;/);
  assert.match(component[1], /&amp;y=2/);
  assert.doesNotMatch(html.replace(component[0], ''), /<img onerror=alert/);
});
test('no configuration leaves HTML free of extension scripts', () => {
  const html = render('none', '');
  assert.doesNotMatch(html, /<social-comments|social-comments\.js|purify\.min\.js/);
});
test('non-HTML output does not contain web components or JavaScript', () => {
  const markdown = render('plain', 'bluesky_comments:\n  post_uri: "at://did:plc:alice/app.bsky.feed.post/root"', 'gfm');
  assert.doesNotMatch(markdown, /<social-comments|social-comments\.js|purify\.min\.js/);
  assert.match(markdown, /Existing \*\*content\*\*/);
});
test('incomplete configuration produces a useful build error', () => {
  assert.throws(() => render('invalid', 'mastodon_comments:\n  user: alice'), error => /mastodon_comments requires user, host and toot_id/.test(error.stderr.toString()));
});
