import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { assetPath, SITE_ORIGIN } from '@/lib/asset-path'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

const title = 'Harness AI Prompt Library'
const description = 'Curated AI prompts for every Harness module — search, customize, and copy in seconds.'
const logo = assetPath('/harness-mark.png')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title,
  description,
  icons: {
    icon: { url: logo, type: 'image/png' },
    apple: logo,
  },
  openGraph: {
    type: 'website',
    url: assetPath('/'),
    siteName: 'Harness',
    title,
    description,
    images: [{ url: logo, width: 341, height: 345, alt: 'Harness logo' }],
  },
  twitter: {
    card: 'summary',
    title,
    description,
    images: [logo],
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
