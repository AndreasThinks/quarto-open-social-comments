const { copyFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const root = dirname(dirname(require.resolve('dompurify')));
const target = resolve(__dirname, '../_extensions/open-social-comments/vendor');
copyFileSync(resolve(root, 'dist/purify.min.js'), resolve(target, 'purify.min.js'));
copyFileSync(resolve(root, 'LICENSE'), resolve(target, 'DOMPurify-LICENSE'));
