-- Modified September 2026: append a static element without rewriting the page DOM.
local function attribute(value)
  return pandoc.utils.stringify(value):gsub('&', '&amp;'):gsub('"', '&quot;')
    :gsub("'", '&#39;'):gsub('<', '&lt;'):gsub('>', '&gt;')
end

function Pandoc(doc)
  if not quarto.doc.isFormat('html') then return doc end
  local attributes = {}
  local mastodon = doc.meta.mastodon_comments
  local bluesky = doc.meta.bluesky_comments
  if mastodon then
    if not (mastodon.user and mastodon.host and mastodon.toot_id) then
      error('mastodon_comments requires user, host and toot_id (quote the toot_id).')
    end
    table.insert(attributes, 'mastodon-host="' .. attribute(mastodon.host) .. '"')
    table.insert(attributes, 'mastodon-user="' .. attribute(mastodon.user) .. '"')
    table.insert(attributes, 'mastodon-toot-id="' .. attribute(mastodon.toot_id) .. '"')
  end
  if bluesky then
    if not bluesky.post_uri then error('bluesky_comments requires post_uri.') end
    table.insert(attributes, 'bluesky-post="' .. attribute(bluesky.post_uri) .. '"')
  end
  if #attributes > 0 then
    quarto.doc.addHtmlDependency({
      name = 'open-social-comments', version = '1.1.0',
      scripts = {'vendor/purify.min.js', 'social-comments.js'}
    })
    doc.blocks:insert(pandoc.RawBlock('html', '<social-comments ' .. table.concat(attributes, ' ') ..
      '><noscript>Please enable JavaScript to view the social comments.</noscript></social-comments>'))
  end
  return doc
end
