import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import "mapbox-gl/dist/mapbox-gl.css"

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
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
