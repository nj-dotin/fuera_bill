import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { getSession } from "@/lib/auth"
import { LayoutClientWrapper } from "@/components/layout-client-wrapper"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "FUERA ERP",
  description: "Enterprise Resource Planning for FUERA",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const showLayout = !!session

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {showLayout ? (
            <LayoutClientWrapper>{children}</LayoutClientWrapper>
          ) : (
            children
          )}
          <Toaster position="top-right" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  )
}
