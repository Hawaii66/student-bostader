declare namespace Cloudflare {
  interface Env {
    /** Workers Builds deploy hook URL (wrangler secret put DEPLOY_HOOK_URL) */
    DEPLOY_HOOK_URL?: string
  }
}
