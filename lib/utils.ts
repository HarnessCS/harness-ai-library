import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BASE_PATH } from '@/lib/asset-path'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function apiPath(path: string) {
  return `${BASE_PATH}${path}`
}
