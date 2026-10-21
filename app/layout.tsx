import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Harness AI Library',
  description: 'Search Harness AI prompts and worker agents, then copy a prompt or pipeline YAML.',
  icons: {
    icon: 'https://cdn.prod.website-files.com/6222ca42ea87e1bd1aa1d10c/6897b6098fe3070c39218537_Harness%20AI.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
