import { LandingNavbar } from "@/components/landing/navbar"
import { LandingHero } from "@/components/landing/hero"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />
      <LandingHero />
    </main>
  )
}
