const styles = `
:root {
  /* Inherit from Quarto theme where possible */
  --font-color: var(--bs-body-color, #5d686f);
  --font-size: var(--bs-body-font-size, 1rem);
  --block-border-width: var(--bs-border-width, 1px);
  --block-border-radius: var(--bs-border-radius, 0.375rem);
  --block-border-color: var(--bs-border-color, rgba(0, 0, 0, 0.125));
  --block-background-color: var(--bs-tertiary-bg, #f8f9fa);
  --comment-indent: 40px;
  --comment-background: var(--block-background-color);
  --comment-radius: var(--block-border-radius);
  --comment-border-color: var(--block-border-color);
  --comment-link: var(--bs-link-color, #0d6efd);

  /* Platform-specific colors that maintain brand identity */
  --mastodon-color: #563acc;
  --bluesky-color: #0085ff;

  /* Interactive element colors */
  --link-color: var(--bs-link-color, #0d6efd);
  --link-hover-color: var(--bs-link-hover-color, #0a58ca);
  --replies-active-color: var(--bs-primary, #0d6efd);
  --reblogs-active-color: var(--bs-info, #0dcaf0);
  --likes-active-color: var(--bs-warning, #ffc107);
}

#social-comments-list {
  margin: 0 auto;
  margin-top: 1rem;
}

.social-comment {
  background-color: var(--block-background-color);
  border-radius: var(--block-border-radius);
  border: var(--block-border-width) var(--block-border-color) solid;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  color: var(--font-color);
  font-size: var(--font-size);
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.social-comment p {
  margin-bottom: 0px;
}

.comments-loading {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--comment-background);
  border-radius: var(--comment-radius);
  border: 1px solid var(--comment-border-color);
}

.comments-loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--comment-border-color);
  border-top-color: var(--comment-link);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.comments-error {
  padding: 1.5rem;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: var(--comment-radius);
  color: #ff9999;
}

.social-comment .author {
  padding-top: 0;
  display: grid;
  grid-template-columns: 48px 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.5rem;
  align-items: start;
}

.social-comment .author a {
  text-decoration: none;
}

.social-comment .author .avatar {
  grid-column: 1;
  grid-row: 1 / span 2;
}

.social-comment .author .avatar img {
  width: 48px;
  height: 48px;
  border-radius: 5px;
}

.social-comment .author .details {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: grid;
  grid-template-rows: auto auto;
  min-width: 0;
}

.social-comment .author .details .name {
  font-weight: bold;
  grid-row: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.social-comment .author .details .user {
  color: var(--font-color);
  opacity: 0.8;
  font-size: medium;
  grid-row: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.social-comment .platform-indicator {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.social-comment .author .date {
  grid-column: 3;
  grid-row: 2;
  font-size: x-small;
  text-align: right;
  white-space: normal;
  line-height: 1.2;
}

.social-comment .content {
  margin: 0.75rem 0;
  width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.social-comment .attachments {
  margin: 0.5rem 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-comment .attachments > * {
  margin: 0;
  max-width: 100%;
}

.social-comment .attachments img {
  max-width: 100%;
}

.social-comment .content p:first-child {
  margin-top: 0;
  margin-bottom: 0;
}

.social-comment .status > div {
  display: inline-block;
  margin-right: 15px;
}

.social-comment .status a {
  color: var(--font-color);
  text-decoration: none;
}

.social-comment .status .replies.active a {
  color: var(--replies-active-color);
}

.social-comment .status .reblogs.active a,
.social-comment .status .reposts.active a {
  color: var(--reblogs-active-color);
}

.social-comment .status .favourites.active a,
.social-comment .status .likes.active a {
  color: var(--likes-active-color);
}

.social-comment .platform-indicator i {
  font-size: 16px;
}

/* Visually hidden class for accessibility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Mobile responsive styles */
@media (max-width: 600px) {
  .social-comment .author {
    grid-template-columns: 48px 1fr auto;
    grid-template-rows: auto auto;
    gap: 0.4rem 0.75rem;
  }

  .social-comment .author .details {
    grid-column: 2;
    grid-row: 1 / span 2;
    min-width: 0;
  }

  .social-comment .author .details .name,
  .social-comment .author .details .user {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .social-comment .platform-indicator {
    grid-column: 3;
    grid-row: 1;
  }

  .social-comment .author .date {
    grid-column: 3;
    grid-row: 2;
  }
}
`;

// Default avatar as SVG data URI
const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none">
  <rect width="56" height="56" fill="#1a1f2e"/>
  <circle cx="28" cy="20" r="10" fill="#4a5568"/>
  <path d="M10 50c0-10 8-18 18-18s18 8 18 18" fill="#4a5568"/>
</svg>
`);

// Global flag to prevent duplicate style injection
let stylesInjected = false;

class SocialComments extends HTMLElement {
  // API timeout in milliseconds
  static API_TIMEOUT = 10000;

  convertBlueskyUrl(url) {
    // Convert https://bsky.app/profile/user.bsky.social/post/postid
    // to at://did:plc:user.bsky.social/app.bsky.feed.post/postid
    try {
      const match = url.match(/https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([^\/]+)/);
      if (match) {
        const [_, handle, postId] = match;
        // For the API, we need to use the handle directly without converting to did:plc format
        return `at://${handle}/app.bsky.feed.post/${postId}`;
      }
      // If it's already in API format, return as is
      if (url.startsWith('at://')) {
        return url;
      }
      throw new Error('Invalid Bluesky URL format');
    } catch (error) {
      console.error('Error converting Bluesky URL:', error);
      return null;
    }
  }

  constructor() {
    super();

    // Ensure Font Awesome is loaded
    this.ensureFontAwesome();

    // Mastodon config - use data attributes instead of global variables
    this.mastodonHost = this.getAttribute('data-mastodon-host') || null;
    this.mastodonUser = this.getAttribute('data-mastodon-user') || null;
    this.mastodonTootId = this.getAttribute('data-mastodon-toot-id') || null;
    this.hideAuthorReplies = this.getAttribute('data-hide-author-replies') === 'true';

    // Bluesky config
    const blueskyUrl = this.getAttribute("bluesky-post") || null;
    // Convert normal URL to API format if needed
    this.blueskyPostUri = blueskyUrl ? this.convertBlueskyUrl(blueskyUrl) : null;

    this.commentsLoaded = false;
    this.allComments = [];
    this.replyDepthMap = new Map();

    // Prevent duplicate style injection
    if (!stylesInjected) {
      const styleElem = document.createElement("style");
      styleElem.innerHTML = styles;
      document.head.appendChild(styleElem);
      stylesInjected = true;
    }
  }

  ensureFontAwesome() {
    const faLoaded = document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]') ||
                     document.querySelector('style[data-font-awesome]') ||
                     document.querySelector('.fa, .fas, .fab, .far');
    if (!faLoaded) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <h2>Comments</h2>
      <noscript>
        <div id="error">
          Please enable JavaScript to view the social comments.
        </div>
      </noscript>
      <p>Join the conversation on
        ${this.mastodonTootId ? `<a href="https://${this.mastodonHost}/@${this.mastodonUser}/${this.mastodonTootId}">Mastodon</a>` : ''}
        ${this.mastodonTootId && this.blueskyPostUri ? ' or ' : ''}
        ${this.getAttribute("bluesky-post") ? `<a href="${this.getAttribute("bluesky-post").startsWith('http') ? this.getAttribute("bluesky-post") : `https://bsky.app/profile/${this.getAttribute("bluesky-post").split('/')[2]}/post/${this.getAttribute("bluesky-post").split('/').pop()}`}">Bluesky</a>` : ''}
      </p>
      <div id="social-comments-list"></div>
    `;

    const comments = document.getElementById("social-comments-list");
    const rootStyle = this.getAttribute("style");
    if (rootStyle) {
      comments.setAttribute("style", rootStyle);
    }

    this.loadComments();
  }

  escapeHtml(unsafe) {
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  sanitizeHtml(html) {
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html);
    }
    // Fallback: strip HTML and wrap in paragraph
    console.warn('DOMPurify not loaded, stripping HTML from content');
    return `<p>${this.escapeHtml(this.stripHtml(html))}</p>`;
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SocialComments.API_TIMEOUT);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  showLoading() {
    document.getElementById("social-comments-list").innerHTML = `
      <div class="comments-loading">
        <div class="comments-loading-spinner"></div>
        <span>Loading comments...</span>
      </div>
    `;
  }

  showError(message) {
    document.getElementById("social-comments-list").innerHTML = `
      <div class="comments-error">
        <p>Unable to load comments. Please try again later.</p>
      </div>
    `;
    console.error("Comments error:", message);
  }

  async loadComments() {
    if (this.commentsLoaded) return;

    this.showLoading();

    try {
      // Load Mastodon comments if configured
      if (this.mastodonTootId) {
        await this.loadMastodonComments();
      }

      // Load Bluesky comments if configured
      if (this.blueskyPostUri) {
        await this.loadBlueskyComments();
      }

      // Filter out original posts for display but include their stats in total
      const originalPosts = this.allComments.filter(comment => comment.isOriginalPost);
      let replies = this.allComments.filter(comment => !comment.isOriginalPost);

      // Filter out author replies if hideAuthorReplies is enabled
      if (this.hideAuthorReplies) {
        const authorHandles = new Set();
        originalPosts.forEach(post => {
          if (post.author && post.author.handle) {
            authorHandles.add(post.author.handle.toLowerCase());
          }
        });
        replies = replies.filter(comment => {
          const handle = (comment.author?.handle || '').toLowerCase();
          return !authorHandles.has(handle);
        });
      }

      // Sort replies by date
      replies.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Build reply depth map for indentation
      this.buildReplyDepthMap();

      // Calculate total stats including original posts
      const totalStats = this.allComments.reduce((acc, comment) => {
        acc.replies += comment.stats.replies || 0;
        acc.reposts += comment.stats.reposts || 0;
        acc.likes += comment.stats.likes || 0;
        return acc;
      }, { replies: 0, reposts: 0, likes: 0 });

      // Render comments
      if (replies.length > 0 || originalPosts.length > 0) {
        const commentsContainer = document.getElementById("social-comments-list");
        commentsContainer.innerHTML = "";

        // Add stats container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'comments-stats';
        statsContainer.style.cssText = `
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          color: var(--font-color);
          font-size: calc(var(--font-size) * 0.9);
          padding: var(--bs-card-spacer-y, 1rem) var(--bs-card-spacer-x, 1rem);
          background: var(--block-background-color);
          border-radius: var(--block-border-radius);
          border: var(--block-border-width) var(--block-border-color) solid;
        `;

        // Add stats with icons and accessibility labels
        statsContainer.innerHTML = `
          <div title="Total Replies">
            <span class="visually-hidden">Replies:</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true">
              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
            </svg>
            ${totalStats.replies}
          </div>
          <div title="Total Boosts">
            <span class="visually-hidden">Boosts:</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true">
              <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/>
            </svg>
            ${totalStats.reposts}
          </div>
          <div title="Total Favorites">
            <span class="visually-hidden">Favorites:</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            ${totalStats.likes}
          </div>
        `;

        commentsContainer.appendChild(statsContainer);

        // Render replies only
        replies.forEach(comment => {
          this.renderComment(comment);
        });
      } else {
        document.getElementById("social-comments-list").innerHTML =
          "<p>No comments found</p>";
      }

      this.commentsLoaded = true;
    } catch (error) {
      console.error("Error loading comments:", error);
      this.showError(error.message);
    }
  }

  buildReplyDepthMap() {
    // Build a map of comment ID to its parent ID for depth calculation
    const parentMap = new Map();

    this.allComments.forEach(comment => {
      if (comment.inReplyTo) {
        parentMap.set(comment.id, comment.inReplyTo);
      }
    });

    // Calculate depth for each comment
    const getDepth = (commentId, visited = new Set()) => {
      if (visited.has(commentId)) return 0; // Prevent infinite loops
      visited.add(commentId);

      const parentId = parentMap.get(commentId);
      if (!parentId) return 0;

      // Check if parent is the original post
      const isReplyToOriginal =
        parentId === this.mastodonTootId ||
        parentId === this.blueskyPostUri;

      if (isReplyToOriginal) return 0;

      // Check if parent exists in our comments
      const parentExists = this.allComments.some(c => c.id === parentId);
      if (!parentExists) return 0;

      return 1 + getDepth(parentId, visited);
    };

    this.allComments.forEach(comment => {
      const depth = getDepth(comment.id);
      this.replyDepthMap.set(comment.id, depth);
    });
  }

  async loadMastodonComments() {
    try {
      // First get the original toot's stats
      const statusResponse = await this.fetchWithTimeout(
        `https://${this.mastodonHost}/api/v1/statuses/${this.mastodonTootId}`
      );
      const statusData = await statusResponse.json();

      // Add the original toot's stats
      this.allComments.push({
        platform: 'mastodon',
        id: statusData.id,
        content: statusData.content,
        author: {
          name: statusData.account.display_name,
          handle: this.getMastodonHandle(statusData.account),
          avatar: statusData.account.avatar_static,
          url: statusData.account.url
        },
        date: statusData.created_at,
        url: statusData.url,
        stats: {
          replies: statusData.replies_count,
          reposts: statusData.reblogs_count,
          likes: statusData.favourites_count
        },
        attachments: statusData.media_attachments,
        isOriginalPost: true
      });

      // Then get the context (replies)
      const contextResponse = await this.fetchWithTimeout(
        `https://${this.mastodonHost}/api/v1/statuses/${this.mastodonTootId}/context`
      );
      const contextData = await contextResponse.json();

      if (contextData.descendants && Array.isArray(contextData.descendants)) {
        contextData.descendants.forEach(toot => {
          this.allComments.push({
            platform: 'mastodon',
            id: toot.id,
            content: toot.content,
            author: {
              name: toot.account.display_name,
              handle: this.getMastodonHandle(toot.account),
              avatar: toot.account.avatar_static,
              url: toot.account.url
            },
            date: toot.created_at,
            url: toot.url,
            stats: {
              replies: toot.replies_count,
              reposts: toot.reblogs_count,
              likes: toot.favourites_count
            },
            attachments: toot.media_attachments,
            inReplyTo: toot.in_reply_to_id
          });
        });
      }
    } catch (error) {
      console.error("Error loading Mastodon comments:", error);
    }
  }

  async loadBlueskyComments() {
    try {
      const params = new URLSearchParams({ uri: this.blueskyPostUri });
      const response = await this.fetchWithTimeout(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?${params.toString()}`,
        {
          headers: { Accept: "application/json" }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Bluesky thread: ${response.statusText}`);
      }

      const data = await response.json();

      // Add the original post's stats
      if (data.thread?.post) {
        const post = data.thread.post;
        this.allComments.push({
          platform: 'bluesky',
          id: post.uri,
          content: post.record.text,
          author: {
            name: post.author.displayName || post.author.handle,
            handle: post.author.handle,
            avatar: post.author.avatar,
            url: `https://bsky.app/profile/${post.author.did}`
          },
          date: post.indexedAt,
          url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
          stats: {
            replies: post.replyCount,
            reposts: post.repostCount,
            likes: post.likeCount
          },
          attachments: this.extractBlueskyAttachments(post),
          isOriginalPost: true
        });
      }

      if (data.thread && data.thread.replies) {
        this.processBlueskyReplies(data.thread.replies);
      }
    } catch (error) {
      console.error("Error loading Bluesky comments:", error);
    }
  }

  extractBlueskyAttachments(post) {
    const attachments = [];
    if (post.embed) {
      // Handle images
      if (post.embed.images) {
        post.embed.images.forEach(img => {
          attachments.push({
            type: 'image',
            url: img.fullsize || img.thumb,
            preview_url: img.thumb || img.fullsize,
            description: img.alt || ''
          });
        });
      }
      // Handle embedded images in record
      if (post.embed.$type === 'app.bsky.embed.images#view') {
        (post.embed.images || []).forEach(img => {
          attachments.push({
            type: 'image',
            url: img.fullsize || img.thumb,
            preview_url: img.thumb || img.fullsize,
            description: img.alt || ''
          });
        });
      }
      // Handle external link embeds with thumbnails
      if (post.embed.$type === 'app.bsky.embed.external#view' && post.embed.external) {
        const ext = post.embed.external;
        if (ext.thumb) {
          attachments.push({
            type: 'link',
            url: ext.uri,
            preview_url: ext.thumb,
            description: ext.title || ext.description || '',
            title: ext.title,
            linkDescription: ext.description
          });
        }
      }
    }
    return attachments;
  }

  processBlueskyReplies(replies) {
    replies.forEach(reply => {
      // Skip blocked or deleted posts
      if (!reply.post) return;

      this.allComments.push({
        platform: 'bluesky',
        id: reply.post.uri,
        content: reply.post.record.text,
        author: {
          name: reply.post.author.displayName || reply.post.author.handle,
          handle: reply.post.author.handle,
          avatar: reply.post.author.avatar,
          url: `https://bsky.app/profile/${reply.post.author.did}`
        },
        date: reply.post.indexedAt,
        url: `https://bsky.app/profile/${reply.post.author.handle}/post/${reply.post.uri.split('/').pop()}`,
        stats: {
          replies: reply.post.replyCount,
          reposts: reply.post.repostCount,
          likes: reply.post.likeCount
        },
        attachments: this.extractBlueskyAttachments(reply.post),
        inReplyTo: reply.post.record?.reply?.parent?.uri || reply.post.record?.reply?.root?.uri
      });

      if (reply.replies && reply.replies.length > 0) {
        this.processBlueskyReplies(reply.replies);
      }
    });
  }

  getMastodonHandle(account) {
    try {
      let handle = `@${account.acct}`;
      if (account.acct.indexOf("@") === -1) {
        const domain = new URL(account.url);
        handle += `@${domain.hostname}`;
      }
      return handle;
    } catch (error) {
      console.warn('Error parsing Mastodon account URL:', error);
      return `@${account.acct || account.username || 'unknown'}`;
    }
  }

  renderComment(comment) {
    const div = document.createElement("div");
    div.classList.add("social-comment");

    // Calculate multi-level indentation
    const depth = this.replyDepthMap.get(comment.id) || 0;
    const maxIndent = 3;
    const effectiveDepth = Math.min(depth, maxIndent);
    if (effectiveDepth > 0) {
      div.style.marginLeft = `calc(var(--comment-indent) * ${effectiveDepth})`;
    }

    const authorName = this.escapeHtml(comment.author.name);
    const platformIcon = comment.platform === 'mastodon' ?
      `<i class="fab fa-mastodon" style="color: var(--mastodon-color)" aria-hidden="true"></i>
       <span class="visually-hidden">Posted on Mastodon</span>` :
      `<i class="fa-brands fa-bluesky" style="color: var(--bluesky-color)" aria-hidden="true"></i>
       <span class="visually-hidden">Posted on Bluesky</span>`;

    const avatarUrl = comment.author.avatar || DEFAULT_AVATAR;

    div.innerHTML = `
      <div class="author">
        <div class="avatar">
          <img src="${this.escapeHtml(avatarUrl)}" height=48 width=48 alt="${authorName}'s avatar" loading="lazy" onerror="this.src='${DEFAULT_AVATAR}'">
        </div>
        <div class="details">
          <a class="name" href="${comment.author.url}" rel="nofollow">${authorName}</a>
          <a class="user" href="${comment.author.url}" rel="nofollow">${this.escapeHtml(comment.author.handle)}</a>
        </div>
        <span class="platform-indicator">
          ${platformIcon}
        </span>
        <a class="date" href="${comment.url}" rel="nofollow">
          ${new Date(comment.date).toLocaleDateString()}<br>${new Date(comment.date).toLocaleTimeString()}
        </a>
      </div>
      <div class="content">${comment.platform === 'mastodon' ? this.sanitizeHtml(comment.content) : this.formatBlueskyContent(comment.content)}</div>
      ${comment.attachments ? this.renderAttachments(comment.attachments) : ''}
      <div class="status">
        <div class="replies ${comment.stats.replies > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <span class="visually-hidden">Replies:</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
            ${comment.stats.replies || ''}
          </a>
        </div>
        <div class="${comment.platform === 'mastodon' ? 'reblogs' : 'reposts'} ${comment.stats.reposts > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <span class="visually-hidden">Boosts:</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/></svg>
            ${comment.stats.reposts || ''}
          </a>
        </div>
        <div class="${comment.platform === 'mastodon' ? 'favourites' : 'likes'} ${comment.stats.likes > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <span class="visually-hidden">Favorites:</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            ${comment.stats.likes || ''}
          </a>
        </div>
      </div>
    `;

    document.getElementById("social-comments-list").appendChild(div);
  }

  formatBlueskyContent(text) {
    // Create arrays to store our special elements and their replacements
    const elements = [];
    let tempText = text;
    let counter = 0;

    // Function to store an element and return a placeholder
    const storePlaceholder = (element, link, display) => {
      const placeholder = `__ELEMENT_${counter}__`;
      elements.push({
        placeholder,
        html: `<a href="${this.escapeHtml(link)}" rel="nofollow">${this.escapeHtml(display)}</a>`
      });
      counter++;
      return placeholder;
    };

    // Extract URLs
    const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    tempText = tempText.replace(urlPattern, (url) =>
      storePlaceholder(url, url, url)
    );

    // Extract mentions
    const mentionPattern = /@([a-zA-Z0-9.-]+)/g;
    tempText = tempText.replace(mentionPattern, (match, handle) =>
      storePlaceholder(match, `https://bsky.app/profile/${handle}`, match)
    );

    // Extract hashtags
    const hashtagPattern = /#([a-zA-Z0-9_]+)/g;
    tempText = tempText.replace(hashtagPattern, (match, tag) =>
      storePlaceholder(match, `https://bsky.app/search?q=${encodeURIComponent(match)}`, match)
    );

    // Convert newlines to br tags
    tempText = tempText.replace(/\n/g, '<br>');

    // Escape the remaining text
    tempText = this.escapeHtml(tempText);

    // Replace placeholders with their HTML elements
    elements.forEach(({placeholder, html}) => {
      tempText = tempText.replace(placeholder, html);
    });

    return tempText;
  }

  renderAttachments(attachments) {
    if (!attachments || attachments.length === 0) return '';

    return `
      <div class="attachments">
        ${attachments.map(attachment => {
          if (attachment.type === "image") {
            return `<a href="${attachment.url}" rel="nofollow">
              <img src="${attachment.preview_url}" alt="${this.escapeHtml(attachment.description)}" loading="lazy" />
            </a>`;
          } else if (attachment.type === "link" && attachment.preview_url) {
            return `<a href="${attachment.url}" rel="nofollow" class="link-preview">
              <img src="${attachment.preview_url}" alt="${this.escapeHtml(attachment.title || attachment.description)}" loading="lazy" />
              ${attachment.title ? `<span class="link-title">${this.escapeHtml(attachment.title)}</span>` : ''}
            </a>`;
          } else if (attachment.type === "video") {
            return `<video controls><source src="${attachment.url}" type="${attachment.mime_type}"></video>`;
          } else if (attachment.type === "gifv") {
            return `<video autoplay loop muted playsinline><source src="${attachment.url}" type="${attachment.mime_type}"></video>`;
          } else if (attachment.type === "audio") {
            return `<audio controls><source src="${attachment.url}" type="${attachment.mime_type}"></audio>`;
          } else {
            return `<a href="${attachment.url}" rel="nofollow">${attachment.type}</a>`;
          }
        }).join("")}
      </div>
    `;
  }
}

customElements.define("social-comments", SocialComments);
