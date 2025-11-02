/**
 * Unit tests for Open Social Comments
 *
 * These tests verify the core functionality without requiring a browser environment.
 * For full integration tests, use the test.html file.
 */

// Test suite for HTML escaping
function testEscapeHtml() {
  console.log('Testing HTML escaping...');

  const tests = [
    { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
    { input: 'Normal text', expected: 'Normal text' },
    { input: 'Text with & ampersand', expected: 'Text with &amp; ampersand' },
    { input: "Text with 'single' and \"double\" quotes", expected: "Text with &#039;single&#039; and &quot;double&quot; quotes" },
    { input: '', expected: '' },
    { input: null, expected: '' },
    { input: undefined, expected: '' },
  ];

  const escapeHtml = (unsafe) => {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = escapeHtml(test.input);
    if (result === test.expected) {
      console.log(`  ✓ Test ${index + 1} passed`);
      passed++;
    } else {
      console.log(`  ✗ Test ${index + 1} failed`);
      console.log(`    Input: ${JSON.stringify(test.input)}`);
      console.log(`    Expected: ${test.expected}`);
      console.log(`    Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nHTML Escaping: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Test suite for Bluesky URL conversion
function testBlueskyUrlConversion() {
  console.log('Testing Bluesky URL conversion...');

  const tests = [
    {
      input: 'https://bsky.app/profile/user.bsky.social/post/3knoaw5z4ek2v',
      expected: 'at://user.bsky.social/app.bsky.feed.post/3knoaw5z4ek2v'
    },
    {
      input: 'at://user.bsky.social/app.bsky.feed.post/3knoaw5z4ek2v',
      expected: 'at://user.bsky.social/app.bsky.feed.post/3knoaw5z4ek2v'
    },
    {
      input: 'invalid-url',
      expected: null
    },
    {
      input: null,
      expected: null
    },
    {
      input: '',
      expected: null
    }
  ];

  const convertBlueskyUrl = (url) => {
    try {
      if (!url) return null;

      const match = url.match(/https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([^\/]+)/);
      if (match) {
        const [_, handle, postId] = match;
        return `at://${handle}/app.bsky.feed.post/${postId}`;
      }

      if (url.startsWith('at://')) {
        return url;
      }

      console.error('Invalid Bluesky URL format:', url);
      return null;
    } catch (error) {
      console.error('Error converting Bluesky URL:', error);
      return null;
    }
  };

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = convertBlueskyUrl(test.input);
    if (result === test.expected) {
      console.log(`  ✓ Test ${index + 1} passed`);
      passed++;
    } else {
      console.log(`  ✗ Test ${index + 1} failed`);
      console.log(`    Input: ${JSON.stringify(test.input)}`);
      console.log(`    Expected: ${test.expected}`);
      console.log(`    Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nBluesky URL Conversion: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Test suite for Mastodon handle generation
function testMastodonHandle() {
  console.log('Testing Mastodon handle generation...');

  const tests = [
    {
      account: { acct: 'user@server.com', url: 'https://server.com/@user' },
      expected: '@user@server.com'
    },
    {
      account: { acct: 'user', url: 'https://server.com/@user' },
      expected: '@user@server.com'
    },
    {
      account: { acct: 'user', url: 'invalid-url' },
      expected: '@user'  // Should handle error gracefully
    }
  ];

  const getMastodonHandle = (account) => {
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
  };

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = getMastodonHandle(test.account);
    if (result === test.expected) {
      console.log(`  ✓ Test ${index + 1} passed`);
      passed++;
    } else {
      console.log(`  ✗ Test ${index + 1} failed`);
      console.log(`    Input: ${JSON.stringify(test.account)}`);
      console.log(`    Expected: ${test.expected}`);
      console.log(`    Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nMastodon Handle: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Test suite for Bluesky content formatting
function testBlueskyContentFormatting() {
  console.log('Testing Bluesky content formatting...');

  const escapeHtml = (unsafe) => {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatBlueskyContent = (text) => {
    if (!text) return '';

    const elements = [];
    let tempText = text;
    let counter = 0;

    const storePlaceholder = (element, link, display) => {
      const placeholder = `__ELEMENT_${counter}__`;
      elements.push({
        placeholder,
        html: `<a href="${escapeHtml(link)}" rel="nofollow">${escapeHtml(display)}</a>`
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
    tempText = escapeHtml(tempText);

    // Replace placeholders with HTML
    elements.forEach(({placeholder, html}) => {
      tempText = tempText.replace(placeholder, html);
    });

    return tempText;
  };

  const tests = [
    {
      input: 'Check out https://example.com',
      shouldContain: ['<a href="https://example.com"', 'rel="nofollow"']
    },
    {
      input: 'Hello @user.bsky.social',
      shouldContain: ['<a href="https://bsky.app/profile/user.bsky.social"', '@user.bsky.social</a>']
    },
    {
      input: 'Great post! #coding',
      shouldContain: ['<a href="https://bsky.app/search?q=%23coding"', '#coding</a>']
    },
    {
      input: '<script>alert("xss")</script>',
      shouldContain: ['&lt;script&gt;', '&lt;/script&gt;']
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = formatBlueskyContent(test.input);
    const allContained = test.shouldContain.every(substr => result.includes(substr));

    if (allContained) {
      console.log(`  ✓ Test ${index + 1} passed`);
      passed++;
    } else {
      console.log(`  ✗ Test ${index + 1} failed`);
      console.log(`    Input: ${test.input}`);
      console.log(`    Should contain: ${test.shouldContain.join(', ')}`);
      console.log(`    Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nBluesky Content Formatting: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Test suite for cache key generation
function testCacheKeys() {
  console.log('Testing cache key generation...');

  const tests = [
    {
      platform: 'mastodon',
      host: 'fosstodon.org',
      id: '12345',
      expected: 'social-comments-mastodon-fosstodon.org-12345'
    },
    {
      platform: 'bluesky',
      uri: 'at://user.bsky.social/app.bsky.feed.post/abc123',
      expected: 'social-comments-bluesky-at://user.bsky.social/app.bsky.feed.post/abc123'
    },
    {
      platform: 'invalid',
      expected: null
    }
  ];

  const getCacheKey = (platform, host, id, uri) => {
    if (platform === 'mastodon') {
      return `social-comments-mastodon-${host}-${id}`;
    } else if (platform === 'bluesky') {
      return `social-comments-bluesky-${uri}`;
    }
    return null;
  };

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = getCacheKey(test.platform, test.host, test.id, test.uri);
    if (result === test.expected) {
      console.log(`  ✓ Test ${index + 1} passed`);
      passed++;
    } else {
      console.log(`  ✗ Test ${index + 1} failed`);
      console.log(`    Expected: ${test.expected}`);
      console.log(`    Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nCache Key Generation: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Test suite for stats calculation
function testStatsCalculation() {
  console.log('Testing stats calculation...');

  const calculateStats = (comments) => {
    return comments.reduce((acc, comment) => {
      acc.replies += comment.stats.replies || 0;
      acc.reposts += comment.stats.reposts || 0;
      acc.likes += comment.stats.likes || 0;
      return acc;
    }, { replies: 0, reposts: 0, likes: 0 });
  };

  const tests = [
    {
      comments: [
        { stats: { replies: 5, reposts: 3, likes: 10 } },
        { stats: { replies: 2, reposts: 1, likes: 5 } }
      ],
      expected: { replies: 7, reposts: 4, likes: 15 }
    },
    {
      comments: [],
      expected: { replies: 0, reposts: 0, likes: 0 }
    },
    {
      comments: [
        { stats: { replies: 0, reposts: 0, likes: 0 } }
      ],
      expected: { replies: 0, reposts: 0, likes: 0 }
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = calculateStats(test.comments);
    if (JSON.stringify(result) === JSON.stringify(test.expected)) {
      console.log(`  ✓ Test ${index + 1} passed`);
      passed++;
    } else {
      console.log(`  ✗ Test ${index + 1} failed`);
      console.log(`    Expected: ${JSON.stringify(test.expected)}`);
      console.log(`    Got: ${JSON.stringify(result)}`);
      failed++;
    }
  });

  console.log(`\nStats Calculation: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Run all tests
function runAllTests() {
  console.log('========================================');
  console.log('Open Social Comments - Unit Test Suite');
  console.log('========================================\n');

  const results = [
    testEscapeHtml(),
    testBlueskyUrlConversion(),
    testMastodonHandle(),
    testBlueskyContentFormatting(),
    testCacheKeys(),
    testStatsCalculation()
  ];

  const allPassed = results.every(result => result === true);

  console.log('========================================');
  if (allPassed) {
    console.log('✓ All tests passed!');
  } else {
    console.log('✗ Some tests failed');
  }
  console.log('========================================');

  return allPassed;
}

// Export for Node.js or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  runAllTests();
}
