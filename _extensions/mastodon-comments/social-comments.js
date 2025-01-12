const styles = `
:root {
  --font-color: #5d686f;
  --font-size: 1.0rem;
  --block-border-width: 1px;
  --block-border-radius: 3px;
  --block-border-color: #ededf0;
  --block-background-color: #f7f8f8;
  --comment-indent: 40px;
}

#social-comments-list {
  margin: 0 auto;
  margin-top: 1rem;
}

.social-comment {
  background-color: var(--block-background-color);
  border-radius: var(--block-border-radius);
  border: var(--block-border-width) var(--block-border-color) solid;
  padding: 20px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  color: var(--font-color);
  font-size: var(--font-size);
}

.social-comment p {
  margin-bottom: 0px;
}

.social-comment .author {
  padding-top: 0;
  display: flex;
}

.social-comment .author a {
  text-decoration: none;
}

.social-comment .author .avatar img {
  margin-right: 1rem;
  min-width: 60px;
  border-radius: 5px;
}

.social-comment .author .details {
  display: flex;
  flex-direction: column;
}

.social-comment .author .details .name {
  font-weight: bold;
}

.social-comment .author .details .user {
  color: #5d686f;
  font-size: medium;
}

.social-comment .author .date {
  margin-left: auto;
  font-size: small;
}

.social-comment .content {
  margin: 15px 20px;
}

.social-comment .attachments {
  margin: 0px 10px;
}

.social-comment .attachments > * {
  margin: 0px 10px;
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
  color: #5d686f;
  text-decoration: none;
}

.social-comment .status .replies.active a {
  color: #003eaa;
}

.social-comment .status .reblogs.active a,
.social-comment .status .reposts.active a {
  color: #8c8dff;
}

.social-comment .status .favourites.active a,
.social-comment .status .likes.active a {
  color: #ca8f04;
}

.social-comment .platform-indicator {
  font-size: 0.8em;
  color: #888;
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0,0,0,0.05);
}
`;

class SocialComments extends HTMLElement {
  constructor() {
    super();

    // Mastodon config
    this.mastodonHost = mastodonHost || null;
    this.mastodonUser = mastodonUser || null;
    this.mastodonTootId = mastodonTootId || null;

    // Bluesky config
    this.blueskyPostUri = this.getAttribute("bluesky-post") || null;

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
        ${this.blueskyPostUri ? `<a href="https://bsky.app/profile/${this.blueskyPostUri.split('/')[2]}/post/${this.blueskyPostUri.split('/').pop()}">Bluesky</a>` : ''}
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

      // Sort all comments by date
      this.allComments.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Render comments
      if (this.allComments.length > 0) {
        document.getElementById("social-comments-list").innerHTML = "";
        this.allComments.forEach(comment => {
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
        url: `https://bsky.app/profile/${reply.post.author.did}/post/${reply.post.uri.split('/').pop()}`,
        stats: {
          replies: reply.post.replyCount,
          reposts: reply.post.repostCount,
          likes: reply.post.likeCount
        },
        inReplyTo: reply.post.reply?.parent.uri
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
    
    if (comment.inReplyTo) {
      div.style.marginLeft = "var(--comment-indent)";
    }

    const platformIcon = comment.platform === 'mastodon' ? 
      '<i class="fa fa-mastodon"></i>' : 
      '<svg height="12" width="12" viewBox="0 0 16 16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.5 7.5H9v5H7v-5H4.5v-2h7v2z"/></svg>';

    div.innerHTML = `
      <div class="author">
        <div class="avatar">
          <img src="${this.escapeHtml(comment.author.avatar)}" height=60 width=60 alt="">
        </div>
        <div class="details">
          <a class="name" href="${comment.author.url}" rel="nofollow">${this.escapeHtml(comment.author.name)}</a>
          <a class="user" href="${comment.author.url}" rel="nofollow">${this.escapeHtml(comment.author.handle)}</a>
        </div>
        <a class="date" href="${comment.url}" rel="nofollow">
          ${new Date(comment.date).toLocaleString()}
        </a>
        <span class="platform-indicator">
          ${platformIcon}
        </span>
      </div>
      <div class="content">${comment.platform === 'mastodon' ? comment.content : this.escapeHtml(comment.content)}</div>
      ${comment.attachments ? this.renderAttachments(comment.attachments) : ''}
      <div class="status">
        <div class="replies ${comment.stats.replies > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <i class="fa fa-reply fa-fw"></i>${comment.stats.replies || ''}
          </a>
        </div>
        <div class="${comment.platform === 'mastodon' ? 'reblogs' : 'reposts'} ${comment.stats.reposts > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <i class="fa fa-retweet fa-fw"></i>${comment.stats.reposts || ''}
          </a>
        </div>
        <div class="${comment.platform === 'mastodon' ? 'favourites' : 'likes'} ${comment.stats.likes > 0 ? 'active' : ''}">
          <a href="${comment.url}" rel="nofollow">
            <i class="fa fa-star fa-fw"></i>${comment.stats.likes || ''}
          </a>
        </div>
      </div>
    `;

    if (typeof DOMPurify !== "undefined") {
      div.innerHTML = DOMPurify.sanitize(div.innerHTML);
    }

    document.getElementById("social-comments-list").appendChild(div);
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
