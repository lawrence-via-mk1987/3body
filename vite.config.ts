import { defineConfig } from 'vite';

const githubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: githubPages ? '/3body/' : './',
  server: {
    host: true,
  },
});
