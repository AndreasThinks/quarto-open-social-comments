(() => {
// Modified September 2026: threaded rendering and safe, instance-local loading.
const styles = `
social-comments {
  display: block;
  min-width: 0;
  --font-color: #5d686f;
  --font-size: 1.0rem;
  --block-border-width: 1px;
  --block-border-radius: 3px;
  --block-border-color: #ededf0;
  --block-background-color: #f7f8f8;
  --comment-indent: 24px;
}

social-comments .social-comments-list {
  margin: 0 auto;
  margin-top: 1rem;
}

social-comments .social-comment {
  background-color: var(--block-background-color);
  border-radius: var(--block-border-radius);
  border: var(--block-border-width) var(--block-border-color) solid;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  color: var(--font-color);
  font-size: var(--font-size);
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

social-comments .social-comment p {
  margin-bottom: 0px;
}

social-comments .social-comment .author {
  padding-top: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
}

social-comments .social-comment .author a {
  text-decoration: none;
}

social-comments .social-comment .author .avatar img {
  margin-right: 0.5rem;
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 5px;
}

social-comments .social-comment .author .details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

social-comments .social-comment .author .details .name {
  font-weight: bold;
}

social-comments .social-comment .author .details .user {
  color: #5d686f;
  font-size: medium;
}

social-comments .social-comment .author .date {
  margin-left: auto;
  font-size: small;
  white-space: nowrap;
}

social-comments .social-comment .content {
  margin: 0.75rem 0;
  width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
}

social-comments .social-comment .attachments {
  margin: 0.5rem 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

social-comments .social-comment .attachments > * {
  margin: 0;
  max-width: 100%;
}

social-comments .social-comment .attachments img {
  max-width: 100%;
}

social-comments .social-comment .content p:first-child {
  margin-top: 0;
  margin-bottom: 0;
}

social-comments .social-comment .status > div {
  display: inline-block;
  margin-right: 15px;
}

social-comments .social-comment .status a {
  color: #5d686f;
  text-decoration: none;
}

social-comments .social-comment .status .replies.active a {
  color: #003eaa;
}

social-comments .social-comment .status .reblogs.active a,
social-comments .social-comment .status .reposts.active a {
  color: #8c8dff;
}

social-comments .social-comment .status .favourites.active a,
social-comments .social-comment .status .likes.active a {
  color: #ca8f04;
}

social-comments .social-comment .platform-indicator {
  margin-left: auto;
  padding: 2px;
  display: flex;
  align-items: center;
}

social-comments .social-comment .platform-indicator i {
  font-size: 16px;
}
social-comments .comment-thread { list-style: none; padding: 0; margin: 0; }
social-comments .thread-offset { margin-inline-start: calc(var(--thread-depth, 0) * var(--comment-indent)); }
social-comments .thread-toggle { margin-bottom: 1rem; cursor: pointer; }
social-comments .comments-stats { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0; }
social-comments .reply-context, social-comments .comments-notice { font-size: 0.9rem; }
social-comments .reply-context { display: block; margin-bottom: 0.4rem; }
social-comments .status { display: flex; flex-wrap: wrap; gap: 1rem; }
social-comments .platform-indicator { font-size: 0.8rem; }
social-comments .sensitive-content > summary { cursor: pointer; }
@media (max-width: 600px) {
  social-comments { --comment-indent: 12px; }
  social-comments .social-comment { padding: 0.75rem; }
  social-comments .social-comment .author .date { white-space: normal; }
}
`;

let instanceId = 0;
const platformName = platform => platform === 'mastodon' ? 'Mastodon' : 'Bluesky';
const count = value => Number.isSafeInteger(value) && value > 0 ? value : 0;
const key = comment => `${comment.platform}:${comment.id}`;
const timestamp = comment => Date.parse(comment.date) || 0;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function link(text, url, className) {
  const href = safeUrl(url);
  const node = element(href ? 'a' : 'span', className, text);
  if (href) {
    node.href = href;
    node.rel = 'nofollow noopener noreferrer';
  }
  return node;
}

function blueskyReference(value) {
  let actor, postId;
  if (value.startsWith('at://')) {
    const match = value.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([A-Za-z0-9._~:-]+)$/);
    if (match) [, actor, postId] = match;
  } else {
    const url = new URL(value);
    const match = url.pathname.match(/^\/profile\/([^/]+)\/post\/([A-Za-z0-9._~:-]+)\/?$/);
    if (url.protocol === 'https:' && url.host === 'bsky.app' && !url.username && !url.password && match) {
      [, actor, postId] = match;
      actor = decodeURIComponent(actor);
    }
  }
  if (!actor || !postId || !/^(?:did:[a-z]+:[A-Za-z0-9._:%-]+|[A-Za-z0-9.-]+)$/.test(actor)) {
    throw new Error('Use a bsky.app post URL or an at:// post URI.');
  }
  return { actor, postId, uri: `at://${actor}/app.bsky.feed.post/${postId}`,
    url: `https://bsky.app/profile/${encodeURIComponent(actor)}/post/${encodeURIComponent(postId)}` };
}

class SocialComments extends HTMLElement {
  constructor() {
    super();
    this.instanceId = ++instanceId;
    this.allComments = [];
    this.errors = [];
    this.commentsLoaded = false;
  }

  connectedCallback() {
    // Attributes are available here even when the element was parser-created.
    if (this.initialized) return;
    this.initialized = true;
    if (!document.getElementById('open-social-comments-styles')) {
      const style = element('style');
      style.id = 'open-social-comments-styles';
      style.textContent = styles;
      document.head.append(style);
    }
    this.readConfiguration();
    this.replaceChildren(element('h2', '', 'Comments'));
    const introduction = element('p', '', 'Join the conversation on ');
    const sources = [];
    if (this.mastodon) sources.push(link('Mastodon', this.mastodon.url));
    if (this.bluesky) sources.push(link('Bluesky', this.bluesky.url));
    sources.forEach((source, index) => { if (index) introduction.append(' or '); introduction.append(source); });
    if (sources.length) this.append(introduction);
    this.list = element('div', 'social-comments-list');
    this.list.setAttribute('aria-live', 'polite');
    this.append(this.list);
    this.loadComments();
  }

  readConfiguration() {
    this.configErrors = [];
    const attribute = (name, legacy) => this.getAttribute(name) ?? globalThis[legacy];
    const host = attribute('mastodon-host', 'mastodonHost');
    const user = attribute('mastodon-user', 'mastodonUser');
    const id = attribute('mastodon-toot-id', 'mastodonTootId');
    if (host || user || id) {
      try {
        const origin = new URL(`https://${host}`);
        if (!host || !user || !/^\d+$/.test(String(id)) || origin.host !== host || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) {
          throw new Error('Invalid Mastodon configuration.');
        }
        this.mastodon = { host, id: String(id), url: `${origin.origin}/@${encodeURIComponent(user)}/${id}` };
      } catch { this.configErrors.push('Check the Mastodon host, user and toot_id settings.'); }
    }
    const post = this.getAttribute('bluesky-post');
    if (post) {
      try { this.bluesky = blueskyReference(post); }
      catch { this.configErrors.push('Check the Bluesky post_uri setting.'); }
    }
  }

  async fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async loadComments() {
    if (this.loading) return;
    this.loading = true;
    this.commentsLoaded = false;
    this.allComments = [];
    this.errors = [...this.configErrors];
    this.list.textContent = 'Loading comments…';
    this.list.setAttribute('aria-busy', 'true');
    const load = async (platform, loader) => {
      try { this.allComments.push(...await loader()); }
      catch (error) {
        console.warn(`Unable to load ${platformName(platform)} comments:`, error);
        this.errors.push(`${platformName(platform)} comments could not be loaded. Please try again or open the conversation above.`);
      }
    };
    await Promise.all([
      this.mastodon ? load('mastodon', () => this.loadMastodonComments()) : null,
      this.bluesky ? load('bluesky', () => this.loadBlueskyComments()) : null
    ]);
    this.renderComments();
    this.list.setAttribute('aria-busy', 'false');
    this.loading = false;
    this.commentsLoaded = true;
  }

  mastodonComment(status, original = false) {
    if (!status?.id || !status.account) return null;
    const account = status.account;
    let handle = account.acct || account.username || '';
    if (!handle.includes('@')) handle += `@${this.mastodon.host}`;
    return {
      platform: 'mastodon', id: String(status.id), inReplyTo: status.in_reply_to_id == null ? null : String(status.in_reply_to_id),
      content: status.content || '', author: { name: account.display_name || handle, handle: `@${handle}`, avatar: account.avatar_static, url: account.url },
      date: status.created_at, url: status.url || status.uri,
      stats: { replies: count(status.replies_count), reposts: count(status.reblogs_count), likes: count(status.favourites_count) },
      attachments: Array.isArray(status.media_attachments) ? status.media_attachments : [],
      warning: status.spoiler_text || (status.sensitive ? 'Sensitive content' : ''), isOriginalPost: original
    };
  }

  async loadMastodonComments() {
    const base = `https://${this.mastodon.host}/api/v1/statuses/${this.mastodon.id}`;
    const [status, context] = await Promise.all([this.fetchJson(base), this.fetchJson(`${base}/context`)]);
    const original = this.mastodonComment(status, true);
    if (!original || !Array.isArray(context.descendants)) throw new Error('Invalid Mastodon response');
    return [original, ...context.descendants.map(reply => this.mastodonComment(reply)).filter(Boolean)];
  }

  blueskyComment(post, parent, original = false) {
    if (!post?.uri || !post.author || !post.record) return null;
    let reference;
    try { reference = blueskyReference(post.uri); } catch { return null; }
    return {
      platform: 'bluesky', id: post.uri, inReplyTo: post.record.reply?.parent?.uri || parent || null,
      content: post.record.text || '', facets: post.record.facets,
      author: { name: post.author.displayName || post.author.handle, handle: `@${post.author.handle}`, avatar: post.author.avatar,
        url: `https://bsky.app/profile/${encodeURIComponent(post.author.did || post.author.handle)}` },
      date: post.record.createdAt || post.indexedAt, url: reference.url,
      stats: { replies: count(post.replyCount), reposts: count(post.repostCount), likes: count(post.likeCount) }, isOriginalPost: original
    };
  }

  async loadBlueskyComments() {
    let uri = this.bluesky.uri;
    if (!this.bluesky.actor.startsWith('did:')) {
      const params = new URLSearchParams({ handle: this.bluesky.actor });
      const resolved = await this.fetchJson(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?${params}`);
      if (typeof resolved.did !== 'string' || !resolved.did.startsWith('did:')) throw new Error('Unable to resolve Bluesky handle');
      uri = `at://${resolved.did}/app.bsky.feed.post/${this.bluesky.postId}`;
    }
    const params = new URLSearchParams({ uri, depth: '100', parentHeight: '0' });
    const data = await this.fetchJson(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?${params}`);
    const original = this.blueskyComment(data.thread?.post, null, true);
    if (!original) throw new Error('Bluesky post is unavailable');
    const comments = [original];
    const pending = [{ replies: data.thread.replies, parent: original.id }];
    while (pending.length) {
      const { replies, parent } = pending.pop();
      if (!Array.isArray(replies)) continue;
      for (const reply of replies) {
        if (!reply) continue;
        const comment = this.blueskyComment(reply.post, parent);
        if (comment) comments.push(comment);
        // Blocked/deleted union members have no post. Keep any visible descendants.
        pending.push({ replies: reply.replies, parent: comment?.id || reply.uri || parent });
      }
    }
    return comments;
  }

  buildThreads() {
    const unique = new Map(this.allComments.map(comment => [key(comment), comment]));
    const originals = new Set([...unique.values()].filter(c => c.isOriginalPost).map(key));
    const nodes = new Map([...unique.values()].filter(c => !c.isOriginalPost).map(comment => [key(comment), { comment, children: [] }]));
    const roots = [];
    for (const node of nodes.values()) {
      const parentKey = `${node.comment.platform}:${node.comment.inReplyTo}`;
      let parent = nodes.get(parentKey);
      // Guard malformed self-links and cycles without dropping comments.
      const seen = new Set([key(node.comment)]);
      let ancestor = parent;
      while (ancestor) {
        const ancestorKey = key(ancestor.comment);
        if (seen.has(ancestorKey)) { parent = null; break; }
        seen.add(ancestorKey);
        ancestor = nodes.get(`${ancestor.comment.platform}:${ancestor.comment.inReplyTo}`);
      }
      node.parent = parent || null;
      node.orphan = !!node.comment.inReplyTo && !parent && !originals.has(parentKey);
      if (parent) parent.children.push(node); else roots.push(node);
    }
    const byDate = (a, b) => timestamp(a.comment) - timestamp(b.comment) || key(a.comment).localeCompare(key(b.comment));
    for (const node of nodes.values()) node.children.sort(byDate);
    roots.sort((a, b) => -byDate(a, b));
    return { roots, nodes, unique };
  }

  renderComments() {
    this.list.replaceChildren();
    const { roots, nodes, unique } = this.buildThreads();
    for (const message of this.errors) this.list.append(element('p', 'comments-notice', message));
    if (this.errors.length && (this.mastodon || this.bluesky)) {
      const retry = element('button', '', 'Retry loading comments');
      retry.type = 'button';
      retry.addEventListener('click', () => this.loadComments());
      this.list.append(retry);
    }
    if (unique.size) {
      const totals = [...unique.values()].reduce((sum, c) => ({ likes: sum.likes + c.stats.likes, reposts: sum.reposts + c.stats.reposts }), { likes: 0, reposts: 0 });
      const stats = element('div', 'comments-stats');
      stats.append(element('span', '', `${nodes.size} loaded ${nodes.size === 1 ? 'reply' : 'replies'}`),
        element('span', '', `${totals.reposts} boosts / reposts`), element('span', '', `${totals.likes} likes`));
      stats.title = 'Engagement counts include the original posts and the replies loaded here.';
      this.list.append(stats);
    }
    if (!roots.length && !this.errors.length) this.list.append(element('p', '', 'No comments found.'));
    const ids = new Map([...nodes.keys()].map((id, index) => [id, `social-comment-${this.instanceId}-${index}`]));
    const rootList = element('ul', 'comment-thread');
    this.list.append(rootList);
    const pending = roots.slice().reverse().map(node => ({ node, container: rootList, depth: 0 }));
    while (pending.length) {
      const { node, container, depth } = pending.pop();
      const item = element('li');
      const article = this.renderComment(node.comment);
      article.id = ids.get(key(node.comment));
      article.classList.add('thread-offset');
      article.style.setProperty('--thread-depth', Math.min(depth, 3));
      if (node.parent) {
        const context = element('a', 'reply-context', `Replying to ${node.parent.comment.author.name}`);
        context.href = `#${ids.get(key(node.parent.comment))}`;
        article.prepend(context);
      } else if (node.orphan) {
        article.prepend(element('p', 'reply-context', 'Reply to an unavailable comment'));
      }
      item.append(article);
      container.append(item);
      if (node.children.length) {
        const details = element('details', 'thread-replies');
        details.open = true;
        const summary = element('summary', 'thread-toggle thread-offset', `${node.children.length} ${node.children.length === 1 ? 'reply' : 'replies'}`);
        summary.style.setProperty('--thread-depth', Math.min(depth + 1, 3));
        const children = element('ul', 'comment-thread');
        details.append(summary, children);
        item.append(details);
        for (const child of node.children.slice().reverse()) pending.push({ node: child, container: children, depth: depth + 1 });
      }
      if (node.comment.stats.replies > node.children.length) {
        article.append(link('More replies may be available on ' + platformName(node.comment.platform), node.comment.url, 'reply-context'));
      }
    }
    if (this.mastodon || this.bluesky) this.list.append(element('p', 'comments-notice', 'Only publicly available replies returned by each platform are shown. Open the original conversation for the full thread.'));
  }

  renderComment(comment) {
    const article = element('article', 'social-comment');
    const author = element('div', 'author');
    const avatarUrl = safeUrl(comment.author.avatar);
    if (avatarUrl) {
      const avatar = element('div', 'avatar');
      const image = element('img');
      image.src = avatarUrl; image.alt = ''; image.width = 48; image.height = 48; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
      avatar.append(image); author.append(avatar);
    }
    const details = element('div', 'details');
    details.append(link(comment.author.name, comment.author.url, 'name'), link(comment.author.handle, comment.author.url, 'user'));
    const date = new Date(comment.date);
    const dateLink = link('', comment.url, 'date');
    const time = element('time', '', Number.isNaN(date.getTime()) ? 'View post' : date.toLocaleString());
    if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString();
    dateLink.append(time);
    author.append(details, dateLink, element('span', 'platform-indicator', platformName(comment.platform)));
    article.append(author);
    let body = article;
    if (comment.warning) {
      body = element('details', 'sensitive-content');
      body.append(element('summary', '', comment.warning));
      article.append(body);
    }
    const content = element('div', 'content');
    if (comment.platform === 'mastodon') {
      if (globalThis.DOMPurify?.isSupported) {
        // Sanitize before insertion, restrict to formatting, and never insert unsanitized HTML.
        content.append(globalThis.DOMPurify.sanitize(comment.content, {
          RETURN_DOM_FRAGMENT: true,
          ALLOWED_TAGS: ['p', 'br', 'a', 'span', 'strong', 'em', 'b', 'i', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li'],
          ALLOWED_ATTR: ['href', 'title', 'class'], ALLOW_DATA_ATTR: false
        }));
        for (const anchor of content.querySelectorAll('a')) {
          const href = safeUrl(anchor.getAttribute('href'));
          if (href) { anchor.href = href; anchor.rel = 'nofollow noopener noreferrer'; }
          else anchor.removeAttribute('href');
        }
      } else { content.textContent = comment.content; }
    } else { content.append(this.formatBlueskyContent(comment.content, comment.facets)); }
    body.append(content);
    if (comment.attachments?.length) body.append(this.renderAttachments(comment.attachments));
    const status = element('div', 'status');
    status.append(link(`Reply (${comment.stats.replies})`, comment.url), link(`Boosts / reposts: ${comment.stats.reposts}`, comment.url), link(`Likes: ${comment.stats.likes}`, comment.url));
    article.append(status);
    return article;
  }

  formatBlueskyContent(text, facets) {
    const fragment = document.createDocumentFragment();
    const appendPlainText = value => {
      let offset = 0;
      for (const match of value.matchAll(/https?:\/\/[^\s<>"']+/g)) {
        let url = match[0].replace(/[.,!?;:]+$/, '');
        // Keep balanced parentheses in URLs, but leave sentence punctuation outside.
        while (url.endsWith(')') && (url.match(/\)/g) || []).length > (url.match(/\(/g) || []).length) url = url.slice(0, -1);
        fragment.append(value.slice(offset, match.index), link(url, url));
        offset = match.index + url.length;
      }
      fragment.append(value.slice(offset));
    };
    // Facet offsets are UTF-8 bytes, not JavaScript UTF-16 string positions.
    const bytes = new TextEncoder().encode(text);
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let cursor = 0;
    for (const facet of (Array.isArray(facets) ? facets : []).slice().sort((a, b) => (a?.index?.byteStart || 0) - (b?.index?.byteStart || 0))) {
      const start = facet?.index?.byteStart, end = facet?.index?.byteEnd;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < cursor || end <= start || end > bytes.length) continue;
      const feature = Array.isArray(facet.features) ? facet.features[0] : null;
      let url;
      if (feature?.$type === 'app.bsky.richtext.facet#link') url = feature.uri;
      if (feature?.$type === 'app.bsky.richtext.facet#mention' && typeof feature.did === 'string') url = `https://bsky.app/profile/${encodeURIComponent(feature.did)}`;
      if (feature?.$type === 'app.bsky.richtext.facet#tag' && typeof feature.tag === 'string') url = `https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}`;
      try {
        const before = decoder.decode(bytes.slice(cursor, start));
        const label = decoder.decode(bytes.slice(start, end));
        appendPlainText(before);
        fragment.append(link(label, url));
        cursor = end;
      } catch { /* Ignore malformed offsets without losing the remaining text. */ }
    }
    appendPlainText(new TextDecoder().decode(bytes.slice(cursor)));
    return fragment;
  }

  renderAttachments(attachments) {
    const container = element('div', 'attachments');
    for (const attachment of attachments) {
      const url = safeUrl(attachment?.url);
      if (!url) continue;
      if (attachment.type === 'image') {
        const anchor = link('', url);
        const image = element('img');
        image.src = safeUrl(attachment.preview_url) || url;
        image.alt = attachment.description || ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
        anchor.append(image); container.append(anchor);
      } else if (['video', 'gifv', 'audio'].includes(attachment.type)) {
        const media = element(attachment.type === 'audio' ? 'audio' : 'video');
        media.controls = true; media.preload = 'none'; media.src = url;
        if (attachment.type === 'gifv') { media.loop = true; media.muted = true; media.playsInline = true; }
        container.append(media);
      } else { container.append(link('View attachment', url)); }
    }
    return container;
  }
}

if (!customElements.get('social-comments')) customElements.define('social-comments', SocialComments);
})();
