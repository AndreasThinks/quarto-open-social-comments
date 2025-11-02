# Tests for Open Social Comments

This directory contains tests for the Open Social Comments Quarto extension.

## Running Tests

### Unit Tests

Run the automated unit tests:

```bash
node tests/unit-tests.js
```

These tests verify:
- HTML escaping and XSS protection
- Bluesky URL conversion
- Mastodon handle generation
- Content formatting
- Cache key generation
- Stats calculation

### Manual Testing

Open `test.html` in a web browser to manually test:

```bash
# If you have Python installed:
python3 -m http.server 8000
# Then navigate to: http://localhost:8000/tests/test.html

# Or with Node.js:
npx http-server
# Then navigate to the provided URL
```

The test page includes:
1. **Test 1**: Mastodon comments only
2. **Test 2**: Custom configuration options (cache duration, max comments, stats disabled)
3. **Test 3**: Error handling with invalid host
4. **Test 4**: XSS protection verification

## Test Coverage

The test suite covers:

### Security
- ✅ HTML escaping prevents XSS attacks
- ✅ DOMPurify sanitization is mandatory
- ✅ All user input is properly escaped

### Functionality
- ✅ Mastodon API integration
- ✅ Bluesky API integration
- ✅ URL parsing and conversion
- ✅ Comment threading and indentation
- ✅ Stats aggregation

### Performance
- ✅ Parallel API calls
- ✅ Client-side caching
- ✅ DOM manipulation with DocumentFragment

### Accessibility
- ✅ ARIA labels for interactive elements
- ✅ Semantic HTML with time elements
- ✅ Keyboard navigation support
- ✅ Alt text for images

### Error Handling
- ✅ Network failures
- ✅ Invalid configuration
- ✅ Missing DOMPurify library
- ✅ Malformed URLs

## Expected Test Results

All unit tests should pass:
```
========================================
Open Social Comments - Unit Test Suite
========================================

Testing HTML escaping...
  ✓ All tests passed

Testing Bluesky URL conversion...
  ✓ All tests passed

Testing Mastodon handle generation...
  ✓ All tests passed

Testing Bluesky content formatting...
  ✓ All tests passed

Testing cache key generation...
  ✓ All tests passed

Testing stats calculation...
  ✓ All tests passed

========================================
✓ All tests passed!
========================================
```

Note: Error messages about "Invalid Bluesky URL" or "Error parsing account URL" in the console are expected - they verify that error handling works correctly.
