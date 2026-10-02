import type { Metadata } from "next"
import { Poppins, Geist_Mono, Ojuju, DM_Sans } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
})
const ojuju = Ojuju({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-ojuju",
})

export const metadata: Metadata = {
  title: "UpFront — Privacy Web Analytics & Consent Management",
  description: "Simple, privacy-friendly website analytics with integrated consent management. By Syft Technologies.",
  icons: {
    icon: [
      { url: "/tab-icon-logo.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/tab-icon-logo.svg",
    apple: "/tab-icon-logo.svg",
  },
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
        "antialiased font-sans",
        poppins.variable,
        fontMono.variable,
        ojuju.variable,
        dmSans.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
