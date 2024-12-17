// @ts-check
import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import UnoCSS from '@unocss/svelte-scoped/preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.composition'],
  preprocess: [
    UnoCSS({
      classPrefix: 'kb-',
    }),
    vitePreprocess(),
  ],

  kit: {
    adapter: adapter(),
    files: {
      routes: 'src/lib/routes',
    },
    alias: {
      kitbook: 'src/lib',
    },
  },
  // https://github.com/sveltejs/language-tools/issues/650#issuecomment-1337317336
  compilerOptions: {
    // disable all warnings coming from node_modules and all accessibility warnings
    warningFilter: (warning) => {
      if (warning.filename?.includes('node_modules'))
        return false
      if (warning.code.startsWith('a11y'))
        return false
      if (warning.message.includes('Self-closing HTML tags'))
        return false
      return true
    },
  },
}

export default config
