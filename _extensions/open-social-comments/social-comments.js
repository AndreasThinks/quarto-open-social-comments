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

/* Improve focus indicators for keyboard navigation */
.social-comment .author a:focus,
.social-comment .status a:focus {
  outline: 2px solid var(--link-color);
  outline-offset: 2px;
  border-radius: 2px;
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
}

.social-comment .author .details .user {
  color: var(--font-color);
  opacity: 0.85;
  font-size: medium;
  grid-row: 2;
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

/* Loading spinner */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0,0,0,.1);
  border-radius: 50%;
  border-top-color: var(--link-color);
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  padding: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: var(--block-border-radius);
  margin: 1rem 0;
}
`;

class SocialComments extends HTMLElement {
  constructor() {
    super();

    // Load Font Awesome only once
    if (!SocialComments.fontAwesomeLoaded) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css';
      fontAwesomeLink.integrity = 'sha512-9xKTRVabjVeZmc+GUW8GgSmcREDunMM+Dt/GrzchfN8tkwHizc5RP4Ok/MXFFy5rIjrjY4RGs171b6+lPP+Zrg==';
      fontAwesomeLink.crossOrigin = 'anonymous';
      fontAwesomeLink.referrerPolicy = 'no-referrer';
      document.head.appendChild(fontAwesomeLink);
      SocialComments.fontAwesomeLoaded = true;
    }

    // Read configuration from data attributes (no global variables)
    this.mastodonHost = this.getAttribute("mastodon-host");
    this.mastodonUser = this.getAttribute("mastodon-user");
    this.mastodonTootId = this.getAttribute("mastodon-toot-id");

    // Bluesky config
    const blueskyUrl = this.getAttribute("bluesky-post");
    this.blueskyPostUri = blueskyUrl ? this.convertBlueskyUrl(blueskyUrl) : null;
    this.blueskyDisplayUrl = blueskyUrl;

    // Configuration options
    this.cacheDuration = parseInt(this.getAttribute("cache-duration") || "15") * 60 * 1000; // Convert to ms
    this.maxComments = parseInt(this.getAttribute("max-comments") || "0"); // 0 = unlimited
    this.showStats = this.getAttribute("show-stats") !== "false"; // Default true

    this.commentsLoaded = false;
    this.allComments = [];

    // Add styles only once
    if (!SocialComments.stylesLoaded) {
      const styleElem = document.createElement("style");
      styleElem.innerHTML = styles;
      document.head.appendChild(styleElem);
      SocialComments.stylesLoaded = true;
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <h2>Comments</h2>
      <noscript>
        <div class="error-message">
          Please enable JavaScript to view the social comments.
        </div>
      </noscript>
      ${this.generateJoinConversationText()}
      <div id="social-comments-list"></div>
    `;

    const comments = document.getElementById("social-comments-list");
    const rootStyle = this.getAttribute("style");
    if (rootStyle) {
      comments.setAttribute("style", rootStyle);
    }

    this.loadComments();
  }

  generateJoinConversationText() {
    const links = [];

    if (this.mastodonTootId && this.mastodonHost && this.mastodonUser) {
      const url = `https://${this.mastodonHost}/@${this.mastodonUser}/${this.mastodonTootId}`;
      links.push(`<a href="${this.escapeHtml(url)}">Mastodon</a>`);
    }

    if (this.blueskyDisplayUrl) {
      const url = this.getSafeBlueskyDisplayUrl();
      links.push(`<a href="${this.escapeHtml(url)}">Bluesky</a>`);
    }

    if (links.length === 0) return '';

    return `<p>Join the conversation on ${links.join(' or ')}</p>`;
  }

  getSafeBlueskyDisplayUrl() {
    try {
      if (!this.blueskyDisplayUrl) return '';

      if (this.blueskyDisplayUrl.startsWith('http')) {
        return this.blueskyDisplayUrl;
      }

      // Convert at:// format to https://
      if (this.blueskyDisplayUrl.startsWith('at://')) {
        const parts = this.blueskyDisplayUrl.split('/');
        if (parts.length >= 5) {
          const handle = parts[2];
          const postId = parts[4];
          return `https://bsky.app/profile/${handle}/post/${postId}`;
        }
      }

      return this.blueskyDisplayUrl;
    } catch (error) {
      console.error('Error formatting Bluesky URL:', error);
      return '';
    }
  }

  convertBlueskyUrl(url) {
    try {
      if (!url) return null;

      // Handle https://bsky.app URLs
      const match = url.match(/https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([^\/]+)/);
      if (match) {
        const [_, handle, postId] = match;
        return `at://${handle}/app.bsky.feed.post/${postId}`;
      }

      // If already in API format, return as is
      if (url.startsWith('at://')) {
        return url;
      }

      console.error('Invalid Bluesky URL format:', url);
      return null;
    } catch (error) {
      console.error('Error converting Bluesky URL:', error);
      return null;
    }
  }

  escapeHtml(unsafe) {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Cache management
  getCacheKey(platform) {
    if (platform === 'mastodon') {
      return `social-comments-mastodon-${this.mastodonHost}-${this.mastodonTootId}`;
    } else if (platform === 'bluesky') {
      return `social-comments-bluesky-${this.blueskyPostUri}`;
    }
    return null;
  }

  getFromCache(platform) {
    try {
      const key = this.getCacheKey(platform);
      if (!key) return null;

      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - data.timestamp < this.cacheDuration) {
        return data.comments;
      }

      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  }

  saveToCache(platform, comments) {
    try {
      const key = this.getCacheKey(platform);
      if (!key) return;

      const data = {
        timestamp: Date.now(),
        comments: comments
      };

      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to cache:', error);
    }
  }

  showError(message) {
    const container = document.getElementById("social-comments-list");
    if (container) {
      container.innerHTML = `<div class="error-message">${this.escapeHtml(message)}</div>`;
    }
  }

  showLoading() {
    const container = document.getElementById("social-comments-list");
    if (container) {
      container.innerHTML = '<div><span class="loading-spinner"></span>Loading comments...</div>';
    }
  }

  async loadComments() {
    if (this.commentsLoaded) return;

    // Check if DOMPurify is available (mandatory for security)
    if (typeof DOMPurify === "undefined") {
      this.showError("Security library failed to load. Cannot display comments safely.");
      return;
    }

    this.showLoading();

    try {
      // Load both platforms in parallel for better performance
      const promises = [];

      if (this.mastodonTootId) {
        promises.push(
          this.loadMastodonComments().catch(error => ({
            platform: 'mastodon',
            error: error.message
          }))
        );
      }

      if (this.blueskyPostUri) {
        promises.push(
          this.loadBlueskyComments().catch(error => ({
            platform: 'bluesky',
            error: error.message
          }))
        );
      }

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter(r => r && r.error);
      if (errors.length > 0 && this.allComments.length === 0) {
        const errorMessages = errors.map(e => `${e.platform}: ${e.error}`).join('; ');
        this.showError(`Failed to load comments. ${errorMessages}`);
        return;
      }

      // Filter and sort comments
      const originalPosts = this.allComments.filter(comment => comment.isOriginalPost);
      let replies = this.allComments.filter(comment => !comment.isOriginalPost);

      // Apply max comments limit if set
      if (this.maxComments > 0 && replies.length > this.maxComments) {
        replies = replies.slice(0, this.maxComments);
      }

      // Sort replies by date
      replies.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Render comments
      if (replies.length > 0 || originalPosts.length > 0) {
        const commentsContainer = document.getElementById("social-comments-list");
        commentsContainer.innerHTML = "";

        // Add stats if enabled and we have original posts
        if (this.showStats && originalPosts.length > 0) {
          const statsHtml = this.buildStatsHTML(originalPosts);
          const statsDiv = document.createElement('div');
          statsDiv.innerHTML = DOMPurify.sanitize(statsHtml);
          commentsContainer.appendChild(statsDiv.firstChild);
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        replies.forEach(comment => {
          const commentElement = this.buildCommentElement(comment);
          fragment.appendChild(commentElement);
        });

        commentsContainer.appendChild(fragment);
      } else {
        document.getElementById("social-comments-list").innerHTML =
          "<p>No comments found</p>";
      }

      this.commentsLoaded = true;
    } catch (error) {
      console.error("Error loading comments:", error);
      this.showError("An unexpected error occurred while loading comments.");
    }
  }

  buildStatsHTML(originalPosts) {
    // Calculate stats from original posts only
    const totalStats = originalPosts.reduce((acc, comment) => {
      acc.replies += comment.stats.replies || 0;
      acc.reposts += comment.stats.reposts || 0;
      acc.likes += comment.stats.likes || 0;
      return acc;
    }, { replies: 0, reposts: 0, likes: 0 });

    return `
      <div class="comments-stats" style="
        display: flex;
        gap: 20px;
        margin-bottom: 15px;
        color: var(--font-color);
        font-size: calc(var(--font-size) * 0.9);
        padding: var(--bs-card-spacer-y, 1rem) var(--bs-card-spacer-x, 1rem);
        background: var(--block-background-color);
        border-radius: var(--block-border-radius);
        border: var(--block-border-width) var(--block-border-color) solid;
      ">
        <div title="Total Replies" aria-label="Total Replies: ${totalStats.replies}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true">
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
          </svg>
          ${totalStats.replies}
        </div>
        <div title="Total Boosts" aria-label="Total Boosts: ${totalStats.reposts}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true">
            <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/>
          </svg>
          ${totalStats.reposts}
        </div>
        <div title="Total Favorites" aria-label="Total Favorites: ${totalStats.likes}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          ${totalStats.likes}
        </div>
      </div>
    `;
  }

  async loadMastodonComments() {
    // Check cache first
    const cached = this.getFromCache('mastodon');
    if (cached) {
      this.allComments.push(...cached);
      return;
    }

    try {
      // Fetch status and context in parallel
      const [statusResponse, contextResponse] = await Promise.all([
        fetch(`https://${this.mastodonHost}/api/v1/statuses/${this.mastodonTootId}`),
        fetch(`https://${this.mastodonHost}/api/v1/statuses/${this.mastodonTootId}/context`)
      ]);

      if (!statusResponse.ok) {
        throw new Error(`Failed to fetch Mastodon post: ${statusResponse.status} ${statusResponse.statusText}`);
      }

      if (!contextResponse.ok) {
        throw new Error(`Failed to fetch Mastodon replies: ${contextResponse.status} ${contextResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      const contextData = await contextResponse.json();

      const mastodonComments = [];

      // Add the original toot's stats
      mastodonComments.push({
        platform: 'mastodon',
        id: statusData.id,
        content: statusData.content,
        author: {
          name: statusData.account.display_name || statusData.account.username,
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

      // Process replies
      if (contextData.descendants && Array.isArray(contextData.descendants)) {
        contextData.descendants.forEach(toot => {
          mastodonComments.push({
            platform: 'mastodon',
            id: toot.id,
            content: toot.content,
            author: {
              name: toot.account.display_name || toot.account.username,
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

      // Save to cache
      this.saveToCache('mastodon', mastodonComments);
      this.allComments.push(...mastodonComments);

    } catch (error) {
      console.error("Error loading Mastodon comments:", error);
      throw new Error(`Unable to load Mastodon comments: ${error.message}`);
    }
  }

  async loadBlueskyComments() {
    // Check cache first
    const cached = this.getFromCache('bluesky');
    if (cached) {
      this.allComments.push(...cached);
      return;
    }

    try {
      const params = new URLSearchParams({ uri: this.blueskyPostUri });
      const response = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?${params.toString()}`,
        {
          headers: { Accept: "application/json" }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Bluesky thread: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const blueskyComments = [];

      // Add the original post's stats
      if (data.thread?.post) {
        const post = data.thread.post;
        blueskyComments.push({
          platform: 'bluesky',
          id: post.uri,
          content: post.record.text,
          author: {
            name: post.author.displayName || post.author.handle,
            handle: `@${post.author.handle}`,
            avatar: post.author.avatar,
            url: `https://bsky.app/profile/${post.author.did}`
          },
          date: post.indexedAt,
          url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
          stats: {
            replies: post.replyCount || 0,
            reposts: post.repostCount || 0,
            likes: post.likeCount || 0
          },
          isOriginalPost: true
        });
      }

      // Process replies
      if (data.thread && data.thread.replies) {
        this.processBlueskyReplies(data.thread.replies, blueskyComments);
      }

      // Save to cache
      this.saveToCache('bluesky', blueskyComments);
      this.allComments.push(...blueskyComments);

    } catch (error) {
      console.error("Error loading Bluesky comments:", error);
      throw new Error(`Unable to load Bluesky comments: ${error.message}`);
    }
  }

  processBlueskyReplies(replies, commentsArray) {
    replies.forEach(reply => {
      if (!reply.post) return;

      commentsArray.push({
        platform: 'bluesky',
        id: reply.post.uri,
        content: reply.post.record.text,
        author: {
          name: reply.post.author.displayName || reply.post.author.handle,
          handle: `@${reply.post.author.handle}`,
          avatar: reply.post.author.avatar,
          url: `https://bsky.app/profile/${reply.post.author.did}`
        },
        date: reply.post.indexedAt,
        url: `https://bsky.app/profile/${reply.post.author.handle}/post/${reply.post.uri.split('/').pop()}`,
        stats: {
          replies: reply.post.replyCount || 0,
          reposts: reply.post.repostCount || 0,
          likes: reply.post.likeCount || 0
        },
        inReplyTo: reply.post.reply?.parent?.uri || reply.post.reply?.root?.uri
      });

      // Recursively process nested replies
      if (reply.replies && reply.replies.length > 0) {
        this.processBlueskyReplies(reply.replies, commentsArray);
      }
    });
  }

  getMastodonHandle(account) {
    let handle = `@${account.acct}`;
    if (account.acct.indexOf("@") === -1) {
      try {
        const domain = new URL(account.url);
        handle += `@${domain.hostname}`;
      } catch (error) {
        console.warn('Error parsing account URL:', error);
      }
    }
    return handle;
  }

  buildCommentElement(comment) {
    const div = document.createElement("div");
    div.classList.add("social-comment");

    // Calculate indentation for threaded replies
    const indent = this.calculateIndentation(comment);
    if (indent > 0) {
      div.style.marginLeft = `calc(var(--comment-indent) * ${indent})`;
    }

    const platformInfo = this.getPlatformInfo(comment.platform);
    const timeHtml = this.formatTime(comment.date);
    const contentHtml = comment.platform === 'mastodon' ?
      comment.content :
      this.formatBlueskyContent(comment.content);

    div.innerHTML = `
      <div class="author">
        <div class="avatar">
          <img src="${this.escapeHtml(comment.author.avatar)}"
               width="48"
               height="48"
               alt="${this.escapeHtml(comment.author.name)} avatar"
               loading="lazy">
        </div>
        <div class="details">
          <a class="name" href="${this.escapeHtml(comment.author.url)}" rel="nofollow">
            ${this.escapeHtml(comment.author.name)}
          </a>
          <a class="user" href="${this.escapeHtml(comment.author.url)}" rel="nofollow">
            ${this.escapeHtml(comment.author.handle)}
          </a>
        </div>
        <span class="platform-indicator" aria-label="Posted on ${platformInfo.name}">
          ${platformInfo.icon}
        </span>
        ${timeHtml}
      </div>
      <div class="content">${contentHtml}</div>
      ${comment.attachments ? this.renderAttachments(comment.attachments) : ''}
      ${this.buildStatusHTML(comment)}
    `;

    // Sanitize with DOMPurify (already checked it's loaded)
    div.innerHTML = DOMPurify.sanitize(div.innerHTML);

    return div;
  }

  calculateIndentation(comment) {
    // Only indent if it's a reply to another reply, not to the original post
    if (!comment.inReplyTo) return 0;

    if (comment.platform === 'mastodon') {
      return comment.inReplyTo !== this.mastodonTootId ? 1 : 0;
    } else if (comment.platform === 'bluesky') {
      return comment.inReplyTo !== this.blueskyPostUri ? 1 : 0;
    }

    return 0;
  }

  getPlatformInfo(platform) {
    if (platform === 'mastodon') {
      return {
        name: 'Mastodon',
        icon: '<i class="fab fa-mastodon" style="color: var(--mastodon-color)" aria-hidden="true"></i>'
      };
    } else {
      return {
        name: 'Bluesky',
        icon: '<i class="fa-brands fa-bluesky" style="color: var(--bluesky-color)" aria-hidden="true"></i>'
      };
    }
  }

  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      const isoDate = date.toISOString();
      const displayDate = date.toLocaleDateString();
      const displayTime = date.toLocaleTimeString();

      return `
        <time class="date" datetime="${isoDate}" title="${displayDate} ${displayTime}">
          ${displayDate}<br>${displayTime}
        </time>
      `;
    } catch (error) {
      console.warn('Error formatting date:', error);
      return `<span class="date">${this.escapeHtml(dateString)}</span>`;
    }
  }

  buildStatusHTML(comment) {
    const hasReplies = comment.stats.replies > 0;
    const hasReposts = comment.stats.reposts > 0;
    const hasLikes = comment.stats.likes > 0;

    const repostLabel = comment.platform === 'mastodon' ? 'reblogs' : 'reposts';
    const likeLabel = comment.platform === 'mastodon' ? 'favourites' : 'likes';

    return `
      <div class="status">
        <div class="replies ${hasReplies ? 'active' : ''}" aria-label="${comment.stats.replies} replies">
          <a href="${this.escapeHtml(comment.url)}" rel="nofollow" aria-label="View ${comment.stats.replies} replies">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
            </svg>
            ${comment.stats.replies || ''}
          </a>
        </div>
        <div class="${repostLabel} ${hasReposts ? 'active' : ''}" aria-label="${comment.stats.reposts} ${repostLabel}">
          <a href="${this.escapeHtml(comment.url)}" rel="nofollow" aria-label="View ${comment.stats.reposts} ${repostLabel}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/>
            </svg>
            ${comment.stats.reposts || ''}
          </a>
        </div>
        <div class="${likeLabel} ${hasLikes ? 'active' : ''}" aria-label="${comment.stats.likes} ${likeLabel}">
          <a href="${this.escapeHtml(comment.url)}" rel="nofollow" aria-label="View ${comment.stats.likes} ${likeLabel}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            ${comment.stats.likes || ''}
          </a>
        </div>
      </div>
    `;
  }

  formatBlueskyContent(text) {
    if (!text) return '';

    // Store elements and their replacements
    const elements = [];
    let tempText = text;
    let counter = 0;

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

    // Escape remaining text
    tempText = this.escapeHtml(tempText);

    // Replace placeholders with HTML
    elements.forEach(({placeholder, html}) => {
      tempText = tempText.replace(placeholder, html);
    });

    return tempText;
  }

  renderAttachments(attachments) {
    if (!attachments || attachments.length === 0) return '';

    const attachmentHtml = attachments.map(attachment => {
      if (attachment.type === "image") {
        const altText = attachment.description ? this.escapeHtml(attachment.description) : 'Attached image';
        return `<a href="${this.escapeHtml(attachment.url)}" rel="nofollow">
          <img src="${this.escapeHtml(attachment.preview_url)}"
               alt="${altText}"
               loading="lazy" />
        </a>`;
      } else if (attachment.type === "video") {
        return `<video controls aria-label="Attached video">
          <source src="${this.escapeHtml(attachment.url)}" type="${this.escapeHtml(attachment.mime_type)}">
          Your browser does not support the video tag.
        </video>`;
      } else if (attachment.type === "gifv") {
        return `<video autoplay loop muted playsinline aria-label="Animated GIF">
          <source src="${this.escapeHtml(attachment.url)}" type="${this.escapeHtml(attachment.mime_type)}">
        </video>`;
      } else if (attachment.type === "audio") {
        return `<audio controls aria-label="Attached audio">
          <source src="${this.escapeHtml(attachment.url)}" type="${this.escapeHtml(attachment.mime_type)}">
          Your browser does not support the audio element.
        </audio>`;
      } else {
        return `<a href="${this.escapeHtml(attachment.url)}" rel="nofollow">
          ${this.escapeHtml(attachment.type)} attachment
        </a>`;
      }
    }).join("");

    return `<div class="attachments">${attachmentHtml}</div>`;
  }
}

// Static properties for one-time loading
SocialComments.fontAwesomeLoaded = false;
SocialComments.stylesLoaded = false;

customElements.define("social-comments", SocialComments);
