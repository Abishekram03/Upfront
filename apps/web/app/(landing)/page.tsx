import { LandingNavbar } from "@/components/landing/navbar"
import { LandingHero } from "@/components/landing/hero"
import { LandingFooter } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />
      <div className="flex-1">
        <LandingHero />
      </div>
      <LandingFooter />
    </main>
  )
}
