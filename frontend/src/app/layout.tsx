import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fontBody = Inter({ subsets: ['latin'], variable: '--font-body' })
const fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'CodeScan AI - Intelligent Code Analysis',
  description: 'Deep code analysis powered by Claude Sonnet 4 + static analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${fontBody.className} ${fontBody.variable} ${fontMono.variable}`}>{children}</body>
    </html>
  )
}
