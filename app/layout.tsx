import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'

export const metadata: Metadata = {
  title: 'IndianTester',
  description: '..',
  generator: 'Minku Singh',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex min-h-screen flex-col w-full">
              {children}
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
