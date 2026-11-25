// Webflow Cloud injects the mount path as Next's basePath at build time. Next inlines
// __NEXT_ROUTER_BASEPATH but does not prefix it onto fetch() calls, metadata URLs, or plain
// <img src> attributes, so those must go through apiPath()/assetPath().
export const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH || process.env.NEXT_PUBLIC_BASE_PATH || ''

export const SITE_ORIGIN = 'https://www.harness.io'

export function assetPath(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}
