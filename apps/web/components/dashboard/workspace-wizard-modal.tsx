"use client"

import { useState } from "react"
import { useWorkspace } from "@/lib/workspace-context"
import { useSession } from "@/lib/auth-client"
import { Building2, Sparkles, ArrowRight, Loader2, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function WorkspaceWizardModal() {
  const { hasNoWorkspace, createWorkspace } = useWorkspace()
  const { data: session } = useSession()

  const defaultName = session?.user?.name ? `${session.user.name.split(" ")[0]}'s Workspace` : "My Workspace"
  const [name, setName] = useState(defaultName)
  const [slug, setSlug] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!hasNoWorkspace) return null

  const handleSlugify = (val: string) => {
    return val
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!slug || slug === handleSlugify(name)) {
      setSlug(handleSlugify(val))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Please enter a workspace name")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      await createWorkspace(name.trim(), slug.trim() || undefined)
    } catch (err: any) {
      setError(err.message || "Failed to create workspace. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#1868db] to-[#1559be] px-6 py-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="size-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-blue-100 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="size-3.5 text-blue-200" />
                Welcome to UpFront
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">Create your Workspace</h2>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
            Workspaces organize your domains, privacy banners, team permissions, and analytics into isolated environments.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Acme Corp or Personal"
                required
                autoFocus
                className="h-9.5 text-sm bg-slate-50 border-slate-300 focus:bg-white focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Workspace Slug / URL Identifier
              </label>
              <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 overflow-hidden focus-within:border-[#1868db] focus-within:bg-white">
                <span className="px-3 text-xs text-slate-500 border-r border-slate-200 select-none">
                  app.upfront.io/
                </span>
                <input
                  type="text"
                  value={slug || handleSlugify(name)}
                  onChange={(e) => setSlug(handleSlugify(e.target.value))}
                  placeholder="workspace-slug"
                  className="w-full h-9 px-3 text-xs font-mono bg-transparent text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Feature preview checklist */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                What you get in your workspace:
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Isolated cookie compliance & privacy consent audit records</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time cookieless web analytics & live traffic monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Team collaboration and granular role-based access control</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full h-10 text-sm font-bold bg-[#1868db] hover:bg-[#1559be] text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Setting up your workspace...
                </>
              ) : (
                <>
                  Get Started with UpFront
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
