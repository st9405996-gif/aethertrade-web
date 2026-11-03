// SERVER-ONLY. Reads the runtime environment. In Cloudflare Workers this depends on the
// nodejs_compat environment population; the staging test must confirm secrets are visible.
export function readServerEnv(): Record<string, string | undefined> {
  return typeof process !== "undefined" && process.env ? process.env : {};
}
