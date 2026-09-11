import type { Metadata } from "next"
import { Geist, Geist_Mono, Ojuju } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const ojuju = Ojuju({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-ojuju",
})

export const metadata: Metadata = {
  title: "Userly — Privacy Web Analytics & Consent Management",
  description: "Simple, privacy-friendly website analytics with integrated consent management. By Syft Technologies.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        ojuju.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
