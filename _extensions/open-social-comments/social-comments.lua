local function ensureHtmlDeps()
  quarto.doc.addHtmlDependency({
      name = 'open-social-comments',
      version = '1.0.0',
      scripts = {"social-comments.js"}
  })
end

function Meta(m)
  ensureHtmlDeps()

  -- Initialize variables for both platforms
  local has_comments = false
  local social_html = '<social-comments'

  -- Handle Mastodon configuration via data attributes
  if m.mastodon_comments and m.mastodon_comments.user and m.mastodon_comments.toot_id and m.mastodon_comments.host then
      local user = pandoc.utils.stringify(m.mastodon_comments.user)
      local toot_id = pandoc.utils.stringify(m.mastodon_comments.toot_id)
      local host = pandoc.utils.stringify(m.mastodon_comments.host)

      social_html = social_html .. ' data-mastodon-host="' .. host .. '"'
      social_html = social_html .. ' data-mastodon-user="' .. user .. '"'
      social_html = social_html .. ' data-mastodon-toot-id="' .. toot_id .. '"'

      has_comments = true
  end

  -- Handle Bluesky configuration
  if m.bluesky_comments and m.bluesky_comments.post_uri then
      local post_uri = pandoc.utils.stringify(m.bluesky_comments.post_uri)
      social_html = social_html .. ' bluesky-post="' .. post_uri .. '"'
      has_comments = true
  end

  -- Handle social_comments_options
  if m.social_comments_options then
      if m.social_comments_options.hide_author_replies then
          local hide_author = pandoc.utils.stringify(m.social_comments_options.hide_author_replies)
          if hide_author == "true" then
              social_html = social_html .. ' data-hide-author-replies="true"'
          end
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

      -- Include external scripts directly
      local script_html = '<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.1/purify.min.js" integrity="sha512-uHOKtSfJWScGmyyFr2O2+efpDx2nhwHU2v7MVeptzZoiC7bdF6Ny/CmZhN2AwIK1oCFiVQQ5DA/L9FSzyPNu6Q==" crossorigin="anonymous"></script>'

      -- Insert these elements in the document's head
      quarto.doc.includeText("in-header", script_html .. inject_script)
  end
end
