import type { ComponentProps, SvelteComponent } from 'svelte'
import type { Expect, Page } from '@playwright/test'

export interface Variant<T extends SvelteComponent> {
  name?: string
  description?: string
  viewports?: Viewport[]
  languages?: Language[]
  props?: ComponentProps<T>
  contexts?: MockedContext[]
  /**
   * Presently only the 'default' slot is supported
   */
  slots?: Record<string, string | any>
  tests?: Record<string, Test>
}

type Test = ({ page, expect, filepathWithoutExtension, name }: {
  page: Page
  expect: Expect
  filepathWithoutExtension: string
  name: string
}) => Promise<void>

export interface MockedContext {
  key: any
  context: any
}

export interface Folder {
  name: string
  url: string
  depth: number
  folders?: Folder[]
  pages?: GroupedPage[]
}

interface PageMetadata {
  path: string // allows adding easy link to Github
  url: string // used as the key in GroupedPageMap
  name: string
}

export type UngroupedPage<T> = PageMetadata & {
  ext: string
  load: LoadFunctions<T>
}

export type GroupedPage = PageMetadata & {
  extensions: string[]
  loadMarkdown?: LoadFunctions<MarkdownModule>
  loadComponent?: LoadFunctions<{ default: typeof SvelteComponent }>
  loadCompositions?: Record<string, LoadFunctions<CompositionModule>>
  loadVariants?: LoadFunctions<VariantsModule>
}
export type GroupedPageMap = Record<string, GroupedPage>

interface LoadFunctions<T> {
  loadModule: () => Promise<T>
  loadRaw: RawModule
}

export type Modules = Record<string, Module>
export type RawModules = Record<string, RawModule>
type Module = () => Promise<{ [key: string]: any }>
type RawModule = () => Promise<string>

export interface MarkdownModule {
  html: string
}

export interface VariantsModule {
  variants: Variant<any>[]
  viewports?: Viewport[]
  languages?: Language[]
}

export interface CompositionModule {
  default: typeof SvelteComponent
  viewports?: Viewport[]
  languages?: Language[]
}

export interface LoadedModules {
  markdown?: MarkdownModule
  markdownRaw?: string
  component?: typeof SvelteComponent
  componentRaw?: string
  variantsModule?: VariantsModule
  variantsRaw?: string
  compositionsModules?: Record<string, CompositionModule>
  compositionsRaw?: Record<string, string>
}

export interface KitbookSettings {
  title: string
  description: string
  /** Kitbook provides mobile and desktop sizes by default, but you can set your own. These will apply to every variant unless overriden by a `viewports` export from that file or from the `viewports` prop within a specific variant. */
  viewports: Viewport[]
  languages: Language[]
  /**
   * Function instructing Kitbook how to apply your language codes to each URL. For example, if your route is `[lang=locale]/(app)/+page.svelte`, you would pass in:
   * ```
   * ({code, url}) => url.replace('[lang=locale]', code)
   * ```
   * If you use query params to set the language then you need a little more complex function to add `lang=${code}` to the query string or start a new query string if none exists. For example:
   * ```
   * ({code, url}) => {
   *   const [path, search] = url.split('?')
   *   const params = new URLSearchParams(search)
   *   params.set('lang', code)
   *   return `${path}?${params.toString()}`
   * }
   * ```
   */
  addLanguageToUrl?: ({ code, url }: { code: string; url: string }) => string
  /** `false` by default */
  expandTree?: boolean
  githubURL?: string
  /**
   * An array of Vite glob patterns for building your Kitbook. See https://vitejs.dev/guide/features.html#multiple-patterns. Defaults to
   * ```
   * ['/src/**\/*.{svelte,md,variants.ts,composition}', '/README.md']
   * ```
   * Adjust this to be able to incrementally adopt Kitbook into your project.
   * IGNORE the backslash in the glob pattern, it's just there to make the JSDoc comment work.
   */
  importModuleGlobs?: string[]
  viewer?: ViewerOptions
  /** `src/routes` by default - if you have changed the default SvelteKit routes directory, you must specify it here also */
  routesDirectory?: string
  /**
   * `/kitbook` by default
   *
   * Pass an empty string `""` to indicate the root `/` route
   */
  kitbookRoute?: string
}

export interface Viewport {
  name?: string
  width: number
  height: number
}

export interface Language {
  name: string
  code: string
}

export interface ViewerOptions {
  /**
   * define a key combo to toggle inspector,
   * @default 'alt-shift'
   *
   * any number of modifiers `control` `shift` `alt` `meta` followed by zero or one regular key, separated by -
   * examples: control-shift, control-o, control-alt-s  meta-x control-meta
   * Some keys have native behavior (e.g. alt-s opens history menu on firefox).
   * To avoid conflicts or accidentally typing into inputs, modifier only combinations are recommended.
   */
  // toggleKeyCombo?: string

  /**
   * define keys to select elements with via keyboard
   * @default {parent: 'ArrowUp', child: 'ArrowDown', next: 'ArrowRight', prev: 'ArrowLeft' }
   *
   * improves accessibility and also helps when you want to select elements that do not have a hoverable surface area
   * due to tight wrapping
   *
   * A note for users of screen-readers:
   * If you are using arrow keys to navigate the page itself, change the navKeys to avoid conflicts.
   * e.g. navKeys: {parent: 'w', prev: 'a', child: 's', next: 'd'}
   *
   *
   * parent: select closest parent
   * child: select first child (or grandchild)
   * next: next sibling (or parent if no next sibling exists)
   * prev: previous sibling (or parent if no prev sibling exists)
   */
  // navKeys?: { parent: string; child: string; next: string; prev: string }

  /**
   * define key to open the editor for the currently selected dom node
   *
   * @default 'Enter'
   */
  // openKey?: string

  /**
   * inspector is automatically disabled when releasing toggleKeyCombo after holding it for a longpress
   * @default true
   */
  // holdMode?: boolean

  /**
   * when to show the toggle button
   * @default 'active'
   */
  // showToggleButton?: 'always' | 'active' | 'never'

  /**
   * internal options that are automatically set, not to be set or used by users
   */
  __internal?: {
    /** empty string by default */
    viteBase: string
  }
}
