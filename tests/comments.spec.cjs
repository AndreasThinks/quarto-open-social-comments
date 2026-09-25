const { test, expect } = require('@playwright/test');
const { resolve } = require('node:path');
const script = resolve(__dirname, '../_extensions/open-social-comments/social-comments.js');
const sanitizer = resolve(__dirname, '../_extensions/open-social-comments/vendor/purify.min.js');
const bUri = id => `at://did:plc:alice/app.bsky.feed.post/${id}`;
const bPost = (id, parent = 'root', date = '2026-09-01T12:00:00Z', extra = {}) => ({
  uri: bUri(id), author: { did: 'did:plc:alice', handle: 'alice.test', displayName: id },
  record: { text: `Bluesky ${id}`, createdAt: date, reply: { parent: { uri: bUri(parent) } } },
  replyCount: 0, repostCount: 0, likeCount: 0, ...extra
});
const mPost = (id, parent = '1', extra = {}) => ({
  id, in_reply_to_id: parent, content: `<p>Mastodon ${id}</p>`, created_at: '2026-09-01T12:00:00Z',
  account: { display_name: `Mastodon ${id}`, acct: 'alice', url: 'https://social.test/@alice' },
  url: `https://social.test/@alice/${id}`, replies_count: 0, reblogs_count: 0, favourites_count: 0,
  media_attachments: [], ...extra
});
const bAttrs = 'bluesky-post="at://did:plc:alice/app.bsky.feed.post/root"';
const mAttrs = 'mastodon-host="social.test" mastodon-user="alice" mastodon-toot-id="1"';
async function mount(page, { attrs = bAttrs, replies = [], descendants = [], failM = false, failB = false, purify = true, html, rootExtra = {}, before } = {}) {
  const requests = [];
  await page.route('https://**/*', async route => {
    const url = new URL(route.request().url()); requests.push(url.href);
    let body, status = 200;
    if (url.pathname.endsWith('resolveHandle')) body = { did: 'did:plc:alice' };
    else if (url.pathname.endsWith('getPostThread')) { status = failB ? 503 : 200; body = { thread: { post: bPost('root', null, undefined, rootExtra), replies } }; }
    else if (url.pathname.endsWith('/context')) { status = failM ? 429 : 200; body = { descendants }; }
    else if (url.pathname.includes('/statuses/')) { status = failM ? 429 : 200; body = mPost('1', null); }
    else { await route.abort(); return; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.setContent(html || `<main id="quarto-content"><button id="existing">Existing control</button><social-comments ${attrs}></social-comments></main>`);
  if (before) await page.evaluate(before);
  if (purify) await page.addScriptTag({ path: sanitizer });
  await page.addScriptTag({ path: script });
  await expect(page.locator('social-comments .social-comments-list').first()).toHaveAttribute('aria-busy', 'false');
  return requests;
}

test('Bluesky-only: preserves three levels, sorts siblings, collapses replies, links to parent', async ({ page }) => {
  const replies = [
    { post: bPost('older', 'root', '2026-09-01T10:00:00Z'), replies: [
      { post: bPost('child-new', 'older', '2026-09-01T12:00:00Z') },
      { post: bPost('child-old', 'older', '2026-09-01T11:00:00Z'), replies: [{ post: bPost('grandchild', 'child-old') }] }
    ] },
    { post: bPost('newer', 'root', '2026-09-02T10:00:00Z') }
  ];
  const requests = await mount(page, { replies });
  await expect(page.locator('.social-comment .name')).toHaveText(['newer', 'older', 'child-old', 'grandchild', 'child-new']);
  await expect(page.locator('.social-comments-list > ul > li')).toHaveCount(2);
  await expect(page.locator('li li li article .name')).toHaveText('grandchild');
  const child = page.locator('article').filter({ has: page.locator('.name', { hasText: /^child-old$/ }) });
  const parentId = await page.locator('article').filter({ has: page.locator('.name', { hasText: /^older$/ }) }).getAttribute('id');
  await expect(child.locator('.reply-context').first()).toHaveAttribute('href', `#${parentId}`);
  await page.locator('summary').first().click();
  await expect(child).toBeHidden();
  expect(requests.find(url => url.includes('getPostThread'))).toContain('depth=100&parentHeight=0');
  await expect(page.locator('.comments-stats')).toContainText('5 loaded replies');
});

test('Mastodon: unordered descendants, missing parents, duplicates, cycles and root replies', async ({ page }) => {
  await mount(page, { attrs: mAttrs, descendants: [mPost('3', '2'), mPost('2'), mPost('4', 'missing'), mPost('3', '2'), mPost('5', '6'), mPost('6', '5'), mPost('7', '7')] });
  await expect(page.locator('article')).toHaveCount(6);
  await expect(page.locator('li li article .name')).toHaveText('Mastodon 3');
  await expect(page.locator('.social-comments-list > ul > li')).toHaveCount(5);
  await expect(page.locator('article').filter({ hasText: 'Mastodon 2' }).first()).toHaveCSS('margin-inline-start', '0px');
  await expect(page.locator('.reply-context').filter({ hasText: 'unavailable' })).toHaveCount(4);
});

test('blocked/deleted Bluesky union members do not hide valid siblings or descendants', async ({ page }) => {
  await mount(page, { replies: [
    { $type: 'app.bsky.feed.defs#blockedPost', uri: bUri('blocked'), blocked: true },
    { $type: 'app.bsky.feed.defs#notFoundPost', uri: bUri('deleted'), notFound: true, replies: [{ post: bPost('orphan', 'deleted') }] },
    { post: bPost('visible') }
  ] });
  await expect(page.locator('article')).toHaveCount(2);
  await expect(page.locator('article').filter({ hasText: 'Bluesky orphan' })).toContainText('unavailable');
});

test('handle URLs are resolved to DIDs and query strings are not part of post IDs', async ({ page }) => {
  const requests = await mount(page, { attrs: 'bluesky-post="https://bsky.app/profile/alice.test/post/root?ref=share"' });
  expect(requests[0]).toContain('resolveHandle?handle=alice.test');
  expect(new URL(requests[1]).searchParams.get('uri')).toBe(bUri('root'));
});

test('platforms load independently and retries replace results without duplicates', async ({ page }) => {
  await mount(page, { attrs: `${mAttrs} ${bAttrs}`, failM: true, replies: [{ post: bPost('visible') }] });
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.locator('.comments-notice').first()).toContainText('Mastodon comments could not be loaded');
  await page.route('https://social.test/**', route => route.fulfill({ json: route.request().url().endsWith('/context') ? { descendants: [mPost('2')] } : mPost('1', null) }));
  await page.getByRole('button', { name: 'Retry loading comments' }).click();
  await expect(page.locator('article')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Retry loading comments' })).toHaveCount(0);
});

test('both HTTP failures show errors rather than a misleading empty state', async ({ page }) => {
  await mount(page, { attrs: `${mAttrs} ${bAttrs}`, failM: true, failB: true });
  await expect(page.locator('.comments-notice')).toHaveCount(3);
  await expect(page.getByText('No comments found.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retry loading comments' })).toBeVisible();
});

test('HTTP success with unavailable root is reported as an error', async ({ page }) => {
  await mount(page, { rootExtra: { record: null } });
  await expect(page.locator('.comments-notice').first()).toContainText('Bluesky comments could not be loaded');
});

test('unsafe content, profile URLs and attachments cannot execute code', async ({ page }) => {
  const hostile = mPost('2', '1', {
    content: '<img src=x onerror="window.pwned=1"><svg onload="window.pwned=1"></svg><script>window.pwned=1</script><p>Safe <strong>bold</strong> <a href="javascript:window.pwned=1">bad link</a></p>',
    account: { display_name: '<img onerror=window.pwned=1>', acct: 'evil', url: 'javascript:window.pwned=1', avatar_static: 'data:image/svg+xml,<svg onload=window.pwned=1>' },
    url: 'javascript:window.pwned=1',
    media_attachments: [{ type: 'image', url: 'javascript:window.pwned=1' }, { type: 'image', url: 'https://social.test/image', preview_url: '" onerror="window.pwned=1', description: '"><img onerror=window.pwned=1>' }]
  });
  await mount(page, { attrs: mAttrs, descendants: [hostile] });
  await expect(page.locator('.content strong')).toHaveText('bold');
  await expect(page.locator('social-comments script, social-comments svg, social-comments [onerror], social-comments [onload], social-comments a[href^="javascript:"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
});

test('missing sanitizer fails safely to text', async ({ page }) => {
  await mount(page, { attrs: mAttrs, purify: false, descendants: [mPost('2', '1', { content: '<img src=x onerror="window.pwned=1">' })] });
  await expect(page.locator('.content img')).toHaveCount(0);
  await expect(page.locator('.content')).toHaveText('<img src=x onerror="window.pwned=1">');
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
});

test('UTF-8 facets preserve emoji, links, newlines and literal placeholder-like text', async ({ page }) => {
  const text = '🙂 read this\n__ELEMENT_0__';
  await mount(page, { replies: [{ post: bPost('facet', 'root', undefined, { record: { text, facets: [
    { index: { byteStart: 5, byteEnd: 14 }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://example.org/full' }] }
  ] } }) }] });
  await expect(page.locator('.content')).toHaveText(text);
  await expect(page.locator('.content a')).toHaveText('read this');
  await expect(page.locator('.content a')).toHaveAttribute('href', 'https://example.org/full');
});

test('instances stay isolated, duplicate script inclusion and reconnect are safe, existing controls survive', async ({ page }) => {
  await mount(page, { html: `<button id="existing">Existing control</button><social-comments ${mAttrs}></social-comments><social-comments ${bAttrs}></social-comments>`,
    descendants: [mPost('2')], replies: [{ post: bPost('b') }],
    before: () => document.getElementById('existing').addEventListener('click', () => { window.clicked = true; }) });
  await expect(page.locator('social-comments').nth(0).locator('article .name')).toHaveText('Mastodon 2');
  await expect(page.locator('social-comments').nth(1).locator('article .name')).toHaveText('b');
  await page.addScriptTag({ path: script });
  await page.evaluate(() => { const comments = document.querySelector('social-comments'); comments.remove(); document.body.append(comments); });
  await expect(page.locator('article')).toHaveCount(2);
  const ids = await page.locator('article').evaluateAll(nodes => nodes.map(node => node.id));
  expect(new Set(ids).size).toBe(2);
  await page.locator('#existing').click();
  expect(await page.evaluate(() => window.clicked)).toBe(true);
  await expect(page.locator('#open-social-comments-styles')).toHaveCount(1);
});

test('deep threads remain readable at mobile width and retain every returned reply', async ({ page }) => {
  let node = { post: bPost('level-11', 'level-10') };
  for (let depth = 10; depth >= 0; depth--) node = { post: bPost(`level-${depth}`, depth ? `level-${depth - 1}` : 'root'), replies: [node] };
  await page.setViewportSize({ width: 375, height: 850 });
  await mount(page, { replies: [node] });
  await expect(page.locator('article')).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('article').last()).toHaveCSS('margin-inline-start', '36px');
  await page.screenshot({ path: 'test-results/mobile-thread.png', fullPage: true });
});

test('content warnings remain collapsed and media retain accessible descriptions', async ({ page }) => {
  await mount(page, { attrs: mAttrs, descendants: [mPost('2', '1', { spoiler_text: 'Content warning', media_attachments: [
    { type: 'image', url: 'https://social.test/photo', preview_url: 'https://social.test/preview', description: 'A useful image' }
  ] })] });
  await expect(page.locator('.content')).toBeHidden();
  await page.getByText('Content warning', { exact: true }).click();
  await expect(page.locator('.content')).toBeVisible();
  await expect(page.locator('.attachments img')).toHaveAttribute('alt', 'A useful image');
});

test('Mastodon hyperlinks retain full destinations, mentions and hashtag text', async ({ page }) => {
  await mount(page, { attrs: mAttrs, descendants: [mPost('2', '1', {
    content: '<p>Read <a href="https://example.org/article?x=1&amp;y=2"><span class="invisible">https://</span><span class="ellipsis">example.org/article</span><span class="invisible">?x=1&amp;y=2</span></a> with <a class="mention" href="https://other.test/@bob">@bob</a> about <a class="hashtag" href="https://social.test/tags/quarto">#quarto</a>.</p>'
  })] });
  await expect(page.locator('.content a')).toHaveCount(3);
  await expect(page.locator('.content a').nth(0)).toHaveAttribute('href', 'https://example.org/article?x=1&y=2');
  await expect(page.locator('.content a').nth(0)).toHaveText('example.org/article', { useInnerText: true });
  await expect(page.locator('.content a').nth(1)).toHaveAttribute('href', 'https://other.test/@bob');
  await expect(page.locator('.content a').nth(2)).toHaveText('#quarto');
  await expect(page.locator('.content a').nth(0)).toHaveAttribute('rel', 'nofollow noopener noreferrer');
});

test('Bluesky shortened URLs, mentions, Unicode hashtags and emoji use facet destinations', async ({ page }) => {
  const text = '🎉 example.org/long… @bob #café';
  const facet = (label, feature) => {
    const start = text.indexOf(label);
    return { index: { byteStart: Buffer.byteLength(text.slice(0, start)), byteEnd: Buffer.byteLength(text.slice(0, start + label.length)) }, features: [feature] };
  };
  await mount(page, { replies: [{ post: bPost('links', 'root', undefined, { record: { text, facets: [
    facet('example.org/long…', { $type: 'app.bsky.richtext.facet#link', uri: 'https://example.org/long/full/path?x=1&y=2' }),
    facet('@bob', { $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:bob' }),
    facet('#café', { $type: 'app.bsky.richtext.facet#tag', tag: 'café' })
  ] } }) }] });
  await expect(page.locator('.content')).toHaveText(text);
  await expect(page.locator('.content a')).toHaveCount(3);
  await expect(page.locator('.content a').nth(0)).toHaveAttribute('href', 'https://example.org/long/full/path?x=1&y=2');
  await expect(page.locator('.content a').nth(1)).toHaveAttribute('href', 'https://bsky.app/profile/did%3Aplc%3Abob');
  await expect(page.locator('.content a').nth(2)).toHaveAttribute('href', 'https://bsky.app/hashtag/caf%C3%A9');
});

test('Bluesky plain URLs without facets remain clickable without consuming punctuation', async ({ page }) => {
  const text = 'See https://example.org/a?b=1&c=2, and (https://example.org/wiki/Test_(thing)).';
  await mount(page, { replies: [{ post: bPost('plain', 'root', undefined, { record: { text } }) }] });
  await expect(page.locator('.content')).toHaveText(text);
  await expect(page.locator('.content a')).toHaveText(['https://example.org/a?b=1&c=2', 'https://example.org/wiki/Test_(thing)']);
});

test('unsafe or malformed Bluesky facets preserve text without unsafe links', async ({ page }) => {
  const text = '🙂 bad good';
  await mount(page, { replies: [{ post: bPost('invalid-facet', 'root', undefined, { record: { text, facets: [
    { index: { byteStart: 1, byteEnd: 3 }, features: [] },
    { index: { byteStart: 5, byteEnd: 8 }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'javascript:window.pwned=1' }] },
    { index: { byteStart: 7, byteEnd: 90 }, features: [] }
  ] } }) }] });
  await expect(page.locator('.content')).toHaveText(text);
  await expect(page.locator('.content a')).toHaveCount(0);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
});
