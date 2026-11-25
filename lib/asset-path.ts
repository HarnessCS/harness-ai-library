export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const SITE_ORIGIN = 'https://www.harness.io'

// Next.js does not prefix basePath onto public/ asset URLs used in metadata or plain src attributes.
export function assetPath(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}
