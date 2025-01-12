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
  opacity: 0.8;
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
`;

class SocialComments extends HTMLElement {
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
    
    // Add Font Awesome CDN
    if (!document.querySelector('link[href*="fontawesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }

    // Mastodon config
    this.mastodonHost = mastodonHost || null;
    this.mastodonUser = mastodonUser || null;
    this.mastodonTootId = mastodonTootId || null;

    // Bluesky config
    const blueskyUrl = this.getAttribute("bluesky-post") || null;
    // Convert normal URL to API format if needed
    this.blueskyPostUri = blueskyUrl ? this.convertBlueskyUrl(blueskyUrl) : null;

    this.commentsLoaded = false;
    this.allComments = [];

    const styleElem = document.createElement("style");
    styleElem.innerHTML = styles;
    document.head.appendChild(styleElem);
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

  async loadComments() {
    if (this.commentsLoaded) return;

    document.getElementById("social-comments-list").innerHTML =
      "Loading comments...";

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
      const replies = this.allComments.filter(comment => !comment.isOriginalPost);
      
      // Sort replies by date
      replies.sort((a, b) => new Date(a.date) - new Date(b.date));

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

        // Add stats with icons
        statsContainer.innerHTML = `
          <div title="Total Replies">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;">
              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
            </svg>
            ${totalStats.replies}
          </div>
          <div title="Total Boosts">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;">
              <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/>
            </svg>
            ${totalStats.reposts}
          </div>
          <div title="Total Favorites">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 4px;">
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
      document.getElementById("social-comments-list").innerHTML =
        "<p>Error loading comments</p>";
    }
  }

  async loadMastodonComments() {
    try {
      // First get the original toot's stats
      const statusResponse = await fetch(
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
      const contextResponse = await fetch(
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
      const response = await fetch(
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

  processBlueskyReplies(replies) {
    replies.forEach(reply => {
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
        inReplyTo: reply.post.reply?.parent?.uri || reply.post.reply?.root?.uri
      });

      if (reply.replies && reply.replies.length > 0) {
        this.processBlueskyReplies(reply.replies);
      }
    });
  }

  getMastodonHandle(account) {
    let handle = `@${account.acct}`;
    if (account.acct.indexOf("@") === -1) {
      const domain = new URL(account.url);
      handle += `@${domain.hostname}`;
    }
    return handle;
  }

  renderComment(comment) {
    const div = document.createElement("div");
    div.classList.add("social-comment");
    
    // Only indent if it's a reply to another reply, not to the original post
    const isReplyToReply = comment.inReplyTo && 
      (comment.platform === 'mastodon' ? 
        comment.inReplyTo !== this.mastodonTootId :
        comment.inReplyTo !== this.blueskyPostUri);
    
    if (isReplyToReply) {
      div.style.marginLeft = "var(--comment-indent)";
    }

    const platformIcon = comment.platform === 'mastodon' ? 
      '<i class="fab fa-mastodon" style="color: var(--mastodon-color)"></i>' : 
      '<i class="fa-brands fa-bluesky" style="color: var(--bluesky-color)"></i>';

    div.innerHTML = `
      <div class="author">
        <div class="avatar">
          <img src="${this.escapeHtml(comment.author.avatar)}" height=48 width=48 alt="">
        </div>
        <div class="details">
          <a class="name" href="${comment.author.url}" rel="nofollow">${this.escapeHtml(comment.author.name)}</a>
          <a class="user" href="${comment.author.url}" rel="nofollow">${this.escapeHtml(comment.author.handle)}</a>
        </div>
        <span class="platform-indicator">
          ${platformIcon}
        </span>
        <a class="date" href="${comment.url}" rel="nofollow">
          ${new Date(comment.date).toLocaleDateString()}<br>${new Date(comment.date).toLocaleTimeString()}
        </a>
      </div>
      <div class="content">${comment.platform === 'mastodon' ? comment.content : this.formatBlueskyContent(comment.content)}</div>
      ${comment.attachments ? this.renderAttachments(comment.attachments) : ''}
      <div class="status">
        <div class="replies ${comment.stats.replies > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
            ${comment.stats.replies || ''}
          </a>
        </div>
        <div class="${comment.platform === 'mastodon' ? 'reblogs' : 'reposts'} ${comment.stats.reposts > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/></svg>
            ${comment.stats.reposts || ''}
          </a>
        </div>
        <div class="${comment.platform === 'mastodon' ? 'favourites' : 'likes'} ${comment.stats.likes > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            ${comment.stats.likes || ''}
          </a>
        </div>
      </div>
    `;

    if (typeof DOMPurify !== "undefined") {
      div.innerHTML = DOMPurify.sanitize(div.innerHTML);
    }

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
              <img src="${attachment.preview_url}" alt="${this.escapeHtml(attachment.description)}" />
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
