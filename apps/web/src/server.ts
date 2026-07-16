import startEntry from '@tanstack/react-start/server-entry'

const startFetch =
  typeof startEntry === 'function'
    ? startEntry
    : startEntry.fetch.bind(startEntry)

export default {
  fetch: startFetch,
  async scheduled(
    _controller: ScheduledController,
    env: Cloudflare.Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    if (!env.DEPLOY_HOOK_URL) {
      console.error('DEPLOY_HOOK_URL secret is not set; skipping scheduled rebuild')
      return
    }

    const response = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' })
    if (!response.ok) {
      const body = await response.text()
      console.error(`Deploy hook failed: ${response.status} ${body}`)
      return
    }

    console.log('Triggered scheduled rebuild via deploy hook')
  },
}
