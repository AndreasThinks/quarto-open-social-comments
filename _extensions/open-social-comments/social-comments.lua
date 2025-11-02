local function ensureHtmlDeps()
  quarto.doc.addHtmlDependency({
      name = 'open-social-comments',
      version = '1.0.3',
      scripts = {"social-comments.js"}
  })
end

-- Escape HTML special characters to prevent XSS
local function escapeHtml(str)
  if not str then return "" end
  str = tostring(str)
  str = str:gsub("&", "&amp;")
  str = str:gsub("<", "&lt;")
  str = str:gsub(">", "&gt;")
  str = str:gsub('"', "&quot;")
  str = str:gsub("'", "&#039;")
  return str
end

function Meta(m)
  ensureHtmlDeps()

  -- Initialize variables for both platforms
  local has_comments = false
  local social_html = '<social-comments'

  -- Handle Mastodon configuration
  if m.mastodon_comments and m.mastodon_comments.user and m.mastodon_comments.toot_id and m.mastodon_comments.host then
      local user = escapeHtml(pandoc.utils.stringify(m.mastodon_comments.user))
      local toot_id = escapeHtml(pandoc.utils.stringify(m.mastodon_comments.toot_id))
      local host = escapeHtml(pandoc.utils.stringify(m.mastodon_comments.host))

      -- Pass configuration via data attributes instead of global variables
      social_html = social_html ..
        ' mastodon-host="' .. host .. '"' ..
        ' mastodon-user="' .. user .. '"' ..
        ' mastodon-toot-id="' .. toot_id .. '"'

      has_comments = true
  end

  -- Handle Bluesky configuration
  if m.bluesky_comments and m.bluesky_comments.post_uri then
      local post_uri = escapeHtml(pandoc.utils.stringify(m.bluesky_comments.post_uri))
      social_html = social_html .. ' bluesky-post="' .. post_uri .. '"'
      has_comments = true
  end

  -- Handle optional configuration
  if m.social_comments_config then
      -- Cache duration in minutes (default: 15)
      if m.social_comments_config.cache_duration then
          local cache_duration = escapeHtml(pandoc.utils.stringify(m.social_comments_config.cache_duration))
          social_html = social_html .. ' cache-duration="' .. cache_duration .. '"'
      end

      -- Maximum comments to display
      if m.social_comments_config.max_comments then
          local max_comments = escapeHtml(pandoc.utils.stringify(m.social_comments_config.max_comments))
          social_html = social_html .. ' max-comments="' .. max_comments .. '"'
      end

      -- Show/hide stats
      if m.social_comments_config.show_stats ~= nil then
          local show_stats = pandoc.utils.stringify(m.social_comments_config.show_stats)
          social_html = social_html .. ' show-stats="' .. show_stats .. '"'
      end
  end

  social_html = social_html .. '></social-comments>'

  if has_comments then
      -- JavaScript to inject social comments into a specific div
      local inject_script = [[
<script type="text/javascript">
document.addEventListener('DOMContentLoaded', function() {
  var div = document.getElementById('quarto-content');
  if(div) {
    div.innerHTML += `]] .. social_html .. [[`;
  }
});
</script>
]]

      -- Include external scripts with SRI hashes
      local script_html = '<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.1/purify.min.js" integrity="sha512-uHOKtSfJWScGmyyFr2O2+efpDx2nhwHU2v7MVeptzZoiC7bdF6Ny/CmZhN2AwIK1oCFiVQQ5DA/L9FSzyPNu6Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>'

      -- Insert these elements in the document's head
      quarto.doc.includeText("in-header", script_html .. inject_script)
  end
end
