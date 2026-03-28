import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Build & Launch Your Profitable App Using Claude & Top AI Tools | Night Vibe Workshop',
  description: 'Live 2-day workshop: Turn a real business problem into a working AI app that saves time or generates revenue. 20 seats only. April 7-8, 2026.',
  keywords: 'AI app workshop, build an AI app without coding, Claude app workshop, build and launch app with AI, AI tools for business owners, profitable AI app, live AI workshop',
  openGraph: {
    title: 'Build & Launch Your Profitable App Using Claude & Top AI Tools',
    description: 'Live 2-day workshop. 20 seats only. Build a working AI app even if you are not a developer.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
