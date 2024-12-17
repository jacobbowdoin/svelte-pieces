import { createRawSnippet, hydrate } from 'svelte'
import { render } from 'svelte/server'
import { browser } from '$app/environment'

export function as_snippet(component: Component) {
 	return createRawSnippet((props_function) => {
    const props = props_function ? props_function() : {}
    return {
      render: () => ` 
        <div>${browser ? '' : render(component, { props }).body}</div> 
      `,
      setup(target) {
        hydrate(component, { target, props })
      },
    }
  })
}
