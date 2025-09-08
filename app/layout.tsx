import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import AppHeader from "@/components/AppHeader"
import { Toaster } from "sonner"
import "mapbox-gl/dist/mapbox-gl.css"
import NetStatus from "@/src/components/NetStatus"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "1MI Members' Club",
  description: "A premium member map for discovering nice places",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AppHeader />
          {children}
        </ErrorBoundary>
        <Toaster richColors position="top-right" />
        <NetStatus />
      </body>
    </html>
  )
}
