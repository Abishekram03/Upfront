import Link from "next/link"
import Image from "next/image"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/UpFront-Logo-Blue-600.svg"
            alt="UpFront Logo"
            width={130}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
          <a href="#features" className="hover:text-neutral-900 transition-colors">Features</a>
          <a href="#consent" className="hover:text-neutral-900 transition-colors">Consent Tool</a>
          <a href="#pricing" className="hover:text-neutral-900 transition-colors">Pricing</a>
          <a href="#docs" className="hover:text-neutral-900 transition-colors">Docs</a>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg px-4 shadow-sm"
            )}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
