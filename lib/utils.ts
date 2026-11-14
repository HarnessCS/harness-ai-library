import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Webflow Cloud injects the mount path as Next's basePath at build time, which
// fetch() does not apply automatically. Next inlines __NEXT_ROUTER_BASEPATH.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH || process.env.NEXT_PUBLIC_BASE_PATH || ''

export function apiPath(path: string) {
  return `${BASE_PATH}${path}`
}
