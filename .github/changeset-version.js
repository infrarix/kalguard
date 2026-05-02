// Based on Cloudflare Wrangler: https://github.com/cloudflare/wrangler2/blob/main/.github/changeset-version.js
// Runs `changeset version` then `pnpm install` to update the lockfile.
const { exec } = require('child_process');

exec('npx changeset version');
exec('pnpm install --no-frozen-lockfile');
