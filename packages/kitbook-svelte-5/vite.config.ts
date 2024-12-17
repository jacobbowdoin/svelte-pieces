import path from 'node:path'
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
// import { kitbook } from './src/lib/plugins/vite'
// import kitbookConfig from './kitbook.config'

export default defineConfig({
  plugins: [
    // kitbook(kitbookConfig),
    sveltekit(),
  ],
  // define: {
  //   'import.meta.vitest': false,
  // },
  // server: {
  //   port: 3212,
  //   strictPort: true,
  // },
  // build: {
  //   target: 'es2015', // es6
  // },
})
