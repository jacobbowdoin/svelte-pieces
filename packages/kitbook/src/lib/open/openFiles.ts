import { rpc_client } from '../modules/rpc-client'
import { getFilenameAndExtension } from './get-filename-and-extension'
import { serializeIntersection } from './serialize'

export function openComponent(filepath: string) {
  rpc_client.functions.open_or_create_file({ filepath, template: '' })
}

export function openVariants(filepath: string, componentDetail?: SvelteComponentDetail) {
  if (!componentDetail?.options)
    return sendOpenVariantsRequest(filepath, {})

  const { props } = componentDetail.options
  const state = componentDetail.component.$capture_state()
  const serializedState = serializeIntersection(props, state)
  sendOpenVariantsRequest(filepath, serializedState)
}

export function sendOpenVariantsRequest(filepath: string, serializedState: Record<string, any>) {
  rpc_client.functions.open_or_create_variant({ filepath, props: serializedState || {} })
}

export function openMarkdown(filepath: string) {
  const markdownTemplate = 'You can write some documentation for your component here using markdown.'
  ensure_non_svelte_file_exists(filepath, markdownTemplate)
}

export function openComposition({ filepath, compositionName }: { filepath: string, compositionName?: string }) {
  const { filepathWithoutExtension, filenameWithoutExtensions, extension } = getFilenameAndExtension(filepath)

  const svelteCompositionTemplate = `<script context="module" lang="ts">
  import { defineComposition } from 'kitbook'
  
  export const config = defineComposition({
    // viewports: [{ height: 200 }],
  })
</script>

<script lang="ts">
  import ${filenameWithoutExtensions} from './${filenameWithoutExtensions}.svelte'
  // props will be added here automatically and also editable in the future, for the moment you need to add them and pass to your component.
</script>

<${filenameWithoutExtensions}>
  <!-- add slot code here if needed -->
</${filenameWithoutExtensions}>
`

  const markdownCompositionTemplate = `<script context="module" lang="ts">
  import { defineComposition } from 'kitbook'
  
  export const config = defineComposition({
    // viewports: [{ height: 200 }],
  })
</script>

<script lang="ts">

</script>

Place your Svelte composition here.
`

  const compositionExtension = (compositionName && compositionName !== 'default') ? `${compositionName}.composition` : 'composition'
  const template = extension === 'md' ? markdownCompositionTemplate : svelteCompositionTemplate
  ensure_non_svelte_file_exists(`${filepathWithoutExtension}.${compositionExtension}`, template)
}

function ensure_non_svelte_file_exists(filepath: string, template: string) {
  const pageProofPath = filepath
    .replace('+page', '_page')
    .replace('+layout', '_layout')

  rpc_client.functions.open_or_create_file({ filepath: pageProofPath, template })
}

export function createNewPage(filepath: string) {
  const template = `<script lang="ts">
  export let data
</script>

Hi {data.name}`
  rpc_client.functions.open_or_create_file({ filepath, template })

  const pageTemplate = `export const load = (() => {
  return { name: 'Bill' }
})`
  rpc_client.functions.open_or_create_file({ filepath: filepath.replace('+page.svelte', '+page.ts'), template: pageTemplate })

  rpc_client.functions.open_or_create_variant({ filepath, props: { data: { name: 'John' } } })
}

export function createNewServerEndpoint(filepath: string) {
  const template = `import type { RequestHandler } from './$types'
import { error, json } from '@sveltejs/kit'
import { ResponseCodes } from '$lib/response-codes'

// export const config: Config = { maxDuration: 300 }

// TODO: rename Operation to the name of this endpoint, i.e. SendEmailRequestBody
export interface OperationRequestBody {
  foo: string
}
export interface OperationResponseBody {
  baz: string
}

export const POST: RequestHandler = async ({ locals: { getSession }, request }) => {
  const { data: session_data, error: _error } = await getSession()
  if (_error || !session_data?.user)
    error(ResponseCodes.UNAUTHORIZED, { message: _error.message || 'Unauthorized' })

  const { foo } = await request.json() as OperationRequestBody
  if (!foo) error(ResponseCodes.BAD_REQUEST, 'No foo property found in request body')

  try {
    return json({baz: foo.replace('a', 'b')} satisfies OperationResponseBody)
  } catch (err) {
    console.error(err.message)
    error(ResponseCodes.INTERNAL_SERVER_ERROR, err.message)
  }
}
`
  rpc_client.functions.open_or_create_file({ filepath, template })
  const testTemplate = `import { POST, type OperationRequestBody, type OperationResponseBody } from './+server'
import { request } from '$lib/mocks/sveltekit-endpoint-helper'
import { ResponseCodes } from '$lib/response-codes'
import { authenticatedLocal } from '$lib/mocks/locals'

// vi.mock('$app/environment', () => {
//   return {
//     dev: true,
//   }
// })

describe(POST, () => {
  test('throws error if no foo', async () => {
    await expect(() => request(POST, { locals: authenticatedLocal, body: {} })).rejects.toThrowErrorMatchingInlineSnapshot(\`
      HttpError {
        "body": {
          "message": "No foo property found in request body",
        },
        "status": 400,
      }
    \`)
  })

  test('replaces a with b', async () => {
    const body: OperationRequestBody = {
      foo: 'Hi a!',
    }
    const response = await request(POST, { locals: authenticatedLocal, body })
    expect(response.status).toBe(ResponseCodes.OK)
    const { baz } = await response.json() as OperationResponseBody
    expect(baz).toBe('Hi b!')
  })
})
`
  rpc_client.functions.open_or_create_file({ filepath: filepath.replace('+server.ts', '_server.test.ts'), template: testTemplate })
}

export async function createNewComponent(filepath: string) {
  const template = `<script lang="ts">
  export let name = 'Bill'
</script>

<div>Hi {name}</div>`
  await rpc_client.functions.open_or_create_file({ filepath, template })
  await rpc_client.functions.open_or_create_variant({ filepath, props: { name: 'John' } })
}
