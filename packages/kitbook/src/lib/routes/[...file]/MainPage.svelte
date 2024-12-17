<script lang="ts">
  import './kb-prose.css'
  import { Button } from 'svelte-pieces'
  import EditInGithub from '../../components/EditInGithub.svelte'
  import { createNewComponent, openComponent, openComposition, openMarkdown, openVariants } from '../../open/openFiles'
  import type { LayoutLoadResult } from '../layoutLoad'
  import Layout from './frame/Frame.svelte'
  import { findKitbookPath } from './kitbookPath'
  import Variants from './Variants.svelte'
  import Compositions from './Compositions.svelte'
  import type { MainPageLoadResult } from './mainPageLoad'
  import { splitMarkdownHtmlIntoSections } from './split-markdown-into-sections'
  import { friendly_relative_name } from './relative-names'
  import Routes from './Routes.svelte'
  import { browser, dev } from '$app/environment'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'

  export let data: MainPageLoadResult & LayoutLoadResult

  $: ({
    pagesStore,
    loadedModules: { variantsModule: initialVariantsModule, compositionsModules: initialCompositionsModules, markdown: initialMarkdown },
    pageKey,
    kitbook_settings: settings,
    rpc_client,
  } = data)
  $: ({ viewports: projectViewports, addLanguageToUrl, githubURL, title: kitbookTitle, darkMode } = settings)
  $: ({ svelte_modules, latest_edited_filepath } = rpc_client)

  $: pageFromHMR = $pagesStore?.[pageKey]

  $: variantsModule = initialVariantsModule
  $: if (pageFromHMR?.loadVariants?.loadModule)
    updateVariantsModule()
  function updateVariantsModule() {
    pageFromHMR.loadVariants.loadModule().then((module) => {
      variantsModule = module
    }).catch((error) => {
      console.error(error)
    })
  }

  $: compositionsModules = initialCompositionsModules
  $: if (pageFromHMR?.loadCompositions)
    updateCompositions()
  function updateCompositions() {
    if (!compositionsModules)
      compositionsModules = {}
    Object.entries(pageFromHMR.loadCompositions).forEach(async ([compositionName, loadComposition]) => {
      const module = await loadComposition.loadModule()
      const code = await loadComposition.loadRaw()
      compositionsModules[compositionName] = { ...module, code }
    })
  }

  $: markdown = initialMarkdown
  $: if (pageFromHMR?.loadMarkdown)
    updateMarkdown()
  function updateMarkdown() {
    pageFromHMR.loadMarkdown.loadModule().then((module) => {
      markdown = module
    }).catch((error) => {
      console.error(error)
    })
  }

  $: ({ sectionedMarkdown, compositionsModulesAfterInlined } = splitMarkdownHtmlIntoSections({
    html: markdown?.html,
    pageName: pageKey.split('/').pop(),
    compositionsModules,
  }))

  $: pathWithoutExtension = `.${data.page?.path.replace(/.\w+$/, '')}`
  $: title = ['+page', '+layout'].includes(data.page?.name) ? data.page?.path.replace(/.*routes\//, '').replace('.svelte', '') : data.page?.name
  $: shortenedTitle = title.length > 40 ? `...${title.slice(-38)}` : title

  $: pageTitle = title === 'index' ? kitbookTitle : `${title} | ${kitbookTitle}`

  $: if (pageKey === '/' && browser)
    goto(`${$page.url.pathname.replace(/\/$/, '')}/index`, { replaceState: true })

  function addComposition() {
    const filepath = `.${data.page.path}`
    if (compositionsModules) {
      const compositionName = prompt('What do you want to name this composition? (lowercase, no spaces or periods)')
      if (compositionName)
        openComposition({ filepath, compositionName })
      return
    }
    openComposition({ filepath })
  }

  $: ({ kitbookPath, activePath } = findKitbookPath($page.url.pathname))

  async function add_child_component() {
    const folder = data.page.path.replace(/\/[^/]+$/, '')
    const child_name = prompt('What do you want to name this component? (ie. Button, MyComponent)')
    if (!child_name)
      return
    await createNewComponent(`.${folder}/${child_name}.svelte`)
    await rpc_client.functions.insert_child_into_component({ parent_filepath: `${pathWithoutExtension}.svelte`, child_name })
    location.reload() // hack to get the new child to show up because the updated svelte_modules doesn't show it immediately.
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Layout {settings} pages={data.pages} {kitbookPath} {activePath} let:activeLanguages latest_edited_filepath={$latest_edited_filepath}>
  {#key $page.url.pathname}
    <main style="flex: 1" class="overflow-y-auto bg-white pt-2 px-2">
      {#if data.error}
        <div class="text-red">
          Error: {data.error}
        </div>
      {:else}
        {#if data.loadedModules.componentRaw}
          <div class="flex items-center font-semibold text-2xl mb-2">
            {#if !dev}
              {title}
            {:else}
              <Button class="!text-lg flex items-center !py-1.5 !px-2 -ml-2" onclick={() => openComponent(`${pathWithoutExtension}.svelte`)} form="menu" color="black" title="Edit Component, {title}">
                <span class="i-vscode-icons-file-type-svelte text-2xl align--2px mr-1" /> {shortenedTitle}
              </Button>

              <Button onclick={() => openMarkdown(`${pathWithoutExtension}.md`)} size="sm" form="menu">
                <span class="i-vscode-icons-file-type-markdown align--6px text-2xl" /> {markdown ? 'Edit' : 'Add'} Docs
              </Button>

              <Button onclick={addComposition} size="sm" form="menu"><span class="i-carbon-chart-treemap text-lg align--4px" /> Add Composition</Button>

              {#if !variantsModule}
                <Button onclick={() => openVariants(`${pathWithoutExtension}.svelte`)} size="sm" form="menu"><span class="i-system-uicons-versions align--4px text-xl" /> Add Variant</Button>
              {/if}

              <Button size="sm" form="menu" href="/en/zh-TW/bible">Go to sample page</Button>
            {/if}
          </div>

          {#if dev && $svelte_modules[pageKey]}
            <div class="mb-2 flex flex-wrap">
              {#each $svelte_modules[pageKey].parents as parent}
                <a title="Parent Component: {parent}" class="child bg-blue text-blue-8" href="{kitbookPath}/{parent}"><span class="i-material-symbols-arrow-upward -mt-.5 mr-1"></span>{friendly_relative_name(parent)}</a>
              {:else}
                <a class="child bg-blue text-blue-8" href="{kitbookPath.replace(/\/$/, '') || ''}/index#routes"><span class="i-material-symbols-arrow-upward -mt-.5 mr-1"></span>Routes</a>
              {/each}

              {#each $svelte_modules[pageKey].children as child}
                <a title="Child Component: {child}" class="child bg-gray text-gray-8" href="{kitbookPath}/{child}"><span class="i-material-symbols-arrow-downward -mt-.5 mr-1"></span>{friendly_relative_name(child)}</a>
              {/each}

              <button type="button" class="child bg-green text-green-8" on:click={add_child_component}><span class="i-material-symbols-add -mt-.5 mr-1"></span>Add Child</button>
            </div>
          {/if}
        {/if}

        {#if markdown}
          {#if dev && !data.loadedModules.componentRaw}
            <div class="fixed top-0 right-0 bg-white flex flex-col items-end">
              <Button onclick={addComposition} form="menu" color="black">
                <span class="i-carbon-chart-treemap text-lg align--4px" /> Add Composition
              </Button>
              <Button class="mb-1" onclick={() => openMarkdown(`${pathWithoutExtension}.md`)} form="menu" color="black">
                <span class="i-vscode-icons-file-type-markdown align--6px text-2xl" /> Edit
              </Button>
            </div>
          {/if}

          <div class="kb-prose mb-8 max-w-1000px">
            {#each sectionedMarkdown.sections as { html, compositionName }}
              {#if html}
                {@html html}
              {:else if compositionName}
                <Compositions compositionsModules={{ [compositionName]: compositionsModulesAfterInlined[compositionName] }} {pathWithoutExtension} {activeLanguages} {addLanguageToUrl} {darkMode} show_inlined />
              {/if}
            {/each}
          </div>
        {/if}

        {#if dev && pageKey.endsWith('/index')}
          <Routes {kitbookPath} svelte_modules={$svelte_modules} />
        {/if}

        {#if compositionsModulesAfterInlined}
          <Compositions compositionsModules={compositionsModulesAfterInlined} {pathWithoutExtension} {activeLanguages} {addLanguageToUrl} {darkMode} />
        {/if}

        {#if variantsModule}
          <Variants {variantsModule} {pathWithoutExtension} {projectViewports} {activeLanguages} {addLanguageToUrl} {darkMode} />
        {/if}

        <EditInGithub path={data?.page?.path} {githubURL} />
      {/if}
    </main>
  {/key}
</Layout>

<style>
  .child {
    --at-apply: px-1.5 py-1 rounded bg-op-20 hover:bg-op-35 text-xs font-semibold mr-1 mb-1;
  }
</style>
