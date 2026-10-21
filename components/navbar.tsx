'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LibraryView = 'prompts' | 'agents'

export function Navbar({
  library = 'prompts',
  onLibraryChange,
}: {
  library?: LibraryView
  onLibraryChange?: (next: LibraryView) => void
}) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e6e8ee] bg-white">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">
        {/* Logo + title */}
        <Link href="/" onClick={() => onLibraryChange?.('prompts')} className="flex items-center gap-3 shrink-0">
          <img src="/harness-wordmark.svg" alt="Harness" width={100} height={22} />
          <span className="text-[13px] text-[#5a5a62] font-medium border-l border-[#d9dae5] pl-3">
            AI Library
          </span>
        </Link>

        <div className="flex-1" />

        {/* Nav actions */}
        <nav className="flex items-center gap-2">
          {onLibraryChange && (
            <div className="flex bg-[#f4f4f5] rounded-[10px] p-0.5" role="tablist" aria-label="Library">
              {([
                ['prompts', 'Prompts'],
                ['agents', 'Worker Agents'],
              ] as const).map(([id, label]) => {
                const selected = library === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onLibraryChange(id)}
                    className={cn(
                      'px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-[#5a5a62] transition-colors',
                      selected && 'bg-white text-[#202020] font-semibold shadow-sm',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
          {!onLibraryChange && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
            >
              <Link href="/">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Browse</span>
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant={isAdmin ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-1.5 rounded-[10px] border-[#d9dae5]', isAdmin && 'bg-[#111111] hover:bg-black text-white border-0')}
          >
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
