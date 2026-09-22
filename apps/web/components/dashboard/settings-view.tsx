"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  User,
  Shield,
  Building2,
  CreditCard,
  Globe,
  Plus,
  Code2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Download,
  Users,
  UserPlus,
  Mail,
  ExternalLink,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@workspace/ui/lib/utils"
import { fetchSites, createSite, deleteSite, Site, API_BASE } from "@/lib/api"
import { useDomain } from "@/lib/domain-context"
import { useWorkspace, Workspace } from "@/lib/workspace-context"
import { useSession, authClient } from "@/lib/auth-client"

type TabType = "profile" | "workspace" | "billing" | "sites"

export function SettingsView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: isSessionLoading } = useSession()
  const { refreshSites: refreshContextSites } = useDomain()
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
  } = useWorkspace()

  // Active Tab State
  const initialTab = (searchParams.get("tab") as TabType) || "profile"
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Listen to hash or param changes
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash === "two-factor" || hash === "security") {
      setActiveTab("profile")
    } else if (hash === "workspace" || hash === "team") {
      setActiveTab("workspace")
    } else if (hash === "billing" || hash === "plans") {
      setActiveTab("billing")
    } else if (hash === "sites") {
      setActiveTab("sites")
    }
  }, [])

  // ==========================================
  // 1. PROFILE & SECURITY STATE
  // ==========================================
  const [profileName, setProfileName] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Two-Factor Authentication (2FA) State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)
  const [setup2FAStep, setSetup2FAStep] = useState<"password" | "qr" | "backup">("password")
  const [setup2FAPassword, setSetup2FAPassword] = useState("")
  const [is2FADisabling, setIs2FADisabling] = useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = useState("")
  const [is2FASetupLoading, setIs2FASetupLoading] = useState(false)
  const [totpURI, setTotpURI] = useState("")
  const [totpSecret, setTotpSecret] = useState("")
  const [totpVerificationCode, setTotpVerificationCode] = useState("")
  const [isVerifyingTOTP, setIsVerifyingTOTP] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState("")

  // Delete Account State
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState("")

  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || "")
      setIs2FAEnabled(Boolean((session.user as any)?.twoFactorEnabled))
    }
  }, [session])

  // ==========================================
  // 2. WORKSPACE & TEAM STATE
  // ==========================================
  const [workspaceNameInput, setWorkspaceNameInput] = useState("")
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false)
  const [workspaceMessage, setWorkspaceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Team Members
  const [members, setMembers] = useState<any[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isInvitingMember, setIsInvitingMember] = useState(false)
  const [inviteError, setInviteError] = useState("")

  // Create New Workspace Modal
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [isCreatingNewWorkspace, setIsCreatingNewWorkspace] = useState(false)
  const [newWorkspaceError, setNewWorkspaceError] = useState("")

  // Delete Workspace Modal
  const [isDeleteWorkspaceModalOpen, setIsDeleteWorkspaceModalOpen] = useState(false)
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)
  const [deleteWorkspaceError, setDeleteWorkspaceError] = useState("")

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceNameInput(activeWorkspace.name)
      loadMembers(activeWorkspace.id)
    }
  }, [activeWorkspace?.id])

  const loadMembers = async (wsId: string) => {
    setIsLoadingMembers(true)
    try {
      const res = await fetch(`/api/v1/workspaces/${wsId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (err) {
      console.error("Failed to load members:", err)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // ==========================================
  // 3. SITES & TRACKING STATE
  // ==========================================
  const [sites, setSites] = useState<Site[]>([])
  const [isLoadingSites, setIsLoadingSites] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedSiteForSnippet, setSelectedSiteForSnippet] = useState<Site | null>(null)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [newTimezone, setNewTimezone] = useState("UTC")
  const [modalStep, setModalStep] = useState<"input" | "snippet">("input")
  const [createdSite, setCreatedSite] = useState<Site | null>(null)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [siteErrorMessage, setSiteErrorMessage] = useState("")
  const [isSubmittingSite, setIsSubmittingSite] = useState(false)
  const [isDeletingSite, setIsDeletingSite] = useState(false)
  const [deleteSiteError, setDeleteSiteError] = useState<string | null>(null)

  const loadSites = async () => {
    setIsLoadingSites(true)
    try {
      const data = await fetchSites()
      setSites(data)
    } catch (err) {
      console.error("Failed to load sites:", err)
    } finally {
      setIsLoadingSites(false)
    }
  }

  useEffect(() => {
    loadSites()
  }, [])

  // ==========================================
  // HANDLERS: PROFILE & SECURITY
  // ==========================================
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileMessage(null)

    try {
      const { error } = await authClient.updateUser({
        name: profileName,
      })
      if (error) {
        setProfileMessage({ type: "error", text: error.message || "Failed to update profile." })
      } else {
        setProfileMessage({ type: "success", text: "Profile updated successfully!" })
      }
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "An unexpected error occurred." })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters long." })
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        setPasswordMessage({ type: "error", text: error.message || "Failed to change password." })
      } else {
        setPasswordMessage({ type: "success", text: "Password changed successfully! Other sessions were revoked." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Failed to change password." })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleOpen2FASetupModal = () => {
    setSetup2FAStep("password")
    setSetup2FAPassword("")
    setTwoFactorError("")
    setTotpURI("")
    setTotpSecret("")
    setTotpVerificationCode("")
    setBackupCodes([])
    setIs2FAModalOpen(true)
  }

  const handleVerifyPasswordFor2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setup2FAPassword.trim()) return

    setIs2FASetupLoading(true)
    setTwoFactorError("")

    try {
      const res = await authClient.twoFactor.enable({
        password: setup2FAPassword.trim(),
      })

      if (res?.error) {
        setTwoFactorError(res.error.message || "Invalid password. Please check your password and try again.")
        return
      }

      if (res?.data?.totpURI) {
        setTotpURI(res.data.totpURI)
        try {
          const url = new URL(res.data.totpURI)
          const secret = url.searchParams.get("secret") || ""
          setTotpSecret(secret)
        } catch {
          setTotpSecret("")
        }
      }

      if (res?.data?.backupCodes) {
        setBackupCodes(res.data.backupCodes)
      }

      setSetup2FAStep("qr")
    } catch (err: any) {
      setTwoFactorError(err.message || "Failed to initialize Two-Factor Authentication.")
    } finally {
      setIs2FASetupLoading(false)
    }
  }

  const handleVerify2FACode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpVerificationCode.trim()) return

    setIsVerifyingTOTP(true)
    setTwoFactorError("")

    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: totpVerificationCode.trim(),
      })

      if (error) {
        setTwoFactorError(error.message || "Invalid 6-digit code. Please try again.")
      } else {
        if (data?.backupCodes) {
          setBackupCodes(data.backupCodes)
        }
        setIs2FAEnabled(true)
        setSetup2FAStep("backup")
      }
    } catch (err: any) {
      setTwoFactorError(err.message || "Failed to verify 2FA code.")
    } finally {
      setIsVerifyingTOTP(false)
    }
  }

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disable2FAPassword) return

    setIs2FADisabling(true)
    setTwoFactorError("")

    try {
      const { error } = await authClient.twoFactor.disable({
        password: disable2FAPassword,
      })

      if (error) {
        setTwoFactorError(error.message || "Incorrect password.")
      } else {
        setIs2FAEnabled(false)
        setDisable2FAPassword("")
        setIs2FAModalOpen(false)
      }
    } catch (err: any) {
      setTwoFactorError(err.message || "Failed to disable 2FA.")
    } finally {
      setIs2FADisabling(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteAccountError("")

    try {
      const res = await fetch("/api/v1/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteAccountConfirmation.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to delete account")
      }

      // Sign out and redirect to home
      await authClient.signOut()
      window.location.href = "/login"
    } catch (err: any) {
      setDeleteAccountError(err.message || "An error occurred while deleting account.")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  // ==========================================
  // HANDLERS: WORKSPACE & TEAM
  // ==========================================
  const handleUpdateWorkspaceName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace) return
    setIsUpdatingWorkspace(true)
    setWorkspaceMessage(null)

    try {
      await updateWorkspace(activeWorkspace.id, workspaceNameInput.trim())
      setWorkspaceMessage({ type: "success", text: "Workspace name updated successfully!" })
    } catch (err: any) {
      setWorkspaceMessage({ type: "error", text: err.message || "Failed to update workspace." })
    } finally {
      setIsUpdatingWorkspace(false)
    }
  }

  const handleCreateNewWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    setIsCreatingNewWorkspace(true)
    setNewWorkspaceError("")

    try {
      await createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName("")
      setIsNewWorkspaceModalOpen(false)
    } catch (err: any) {
      setNewWorkspaceError(err.message || "Failed to create workspace.")
    } finally {
      setIsCreatingNewWorkspace(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !inviteEmail.trim()) return

    setIsInvitingMember(true)
    setInviteError("")

    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to invite member")
      }

      const created = await res.json()
      setMembers((prev) => [...prev, created])
      setInviteEmail("")
      setIsInviteModalOpen(false)
    } catch (err: any) {
      setInviteError(err.message || "Failed to invite member.")
    } finally {
      setIsInvitingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!activeWorkspace) return
    try {
      const res = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/members?userId=${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId))
      }
    } catch (err) {
      console.error("Failed to remove member:", err)
    }
  }

  const handleDeleteActiveWorkspace = async () => {
    if (!activeWorkspace) return
    setIsDeletingWorkspace(true)
    setDeleteWorkspaceError("")

    try {
      await deleteWorkspace(activeWorkspace.id)
      setIsDeleteWorkspaceModalOpen(false)
      await refreshWorkspaces()
    } catch (err: any) {
      setDeleteWorkspaceError(err.message || "Failed to delete workspace.")
    } finally {
      setIsDeletingWorkspace(false)
    }
  }

  // ==========================================
  // HANDLERS: SITES
  // ==========================================
  const handleOpenAddSiteModal = () => {
    setNewDomain("")
    setNewTimezone("UTC")
    setSiteErrorMessage("")
    setModalStep("input")
    setCreatedSite(null)
    setAddModalOpen(true)
  }

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiteErrorMessage("")

    const cleanDomain = (newDomain
      .replace("https://", "")
      .replace("http://", "")
      .split("/")[0] || "")
      .trim()

    if (!cleanDomain) {
      setSiteErrorMessage("Please enter a valid domain name")
      return
    }

    setIsSubmittingSite(true)
    try {
      const created = await createSite(cleanDomain, newTimezone)
      setCreatedSite(created)
      setSites((prev) => [created, ...prev])
      await refreshContextSites()
      setModalStep("snippet")
    } catch (err: any) {
      setSiteErrorMessage(err.message || "Failed to create site.")
    } finally {
      setIsSubmittingSite(false)
    }
  }

  const handleConfirmDeleteSite = async () => {
    if (!siteToDelete) return
    setIsDeletingSite(true)
    setDeleteSiteError(null)
    try {
      await deleteSite(siteToDelete.id)
      setSites((prev) => prev.filter((s) => s.id !== siteToDelete.id))
      await refreshContextSites()
      setSiteToDelete(null)
    } catch (err: any) {
      setDeleteSiteError(err?.message || "Failed to delete website.")
    } finally {
      setIsDeletingSite(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Settings Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Account & Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your profile, two-factor authentication, workspaces, team members, and billing
        </p>
      </div>

      {/* Tabs Header Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-lg px-2 shadow-2xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
          {[
            { id: "profile", label: "Profile & Security", icon: User },
            { id: "workspace", label: "Workspace & Team", icon: Building2 },
            { id: "billing", label: "Billing & Plans", icon: CreditCard },
            { id: "sites", label: "Sites & Domains", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-[#1868db] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE & SECURITY                                                 */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 1. Profile Information Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="size-10 rounded-full bg-blue-100 text-[#1868db] font-bold text-sm flex items-center justify-center border border-blue-200">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Profile Information</h2>
                <p className="text-xs text-slate-500">Update your account name and identity</p>
              </div>
            </div>

            {profileMessage && (
              <div
                className={cn(
                  "p-3 rounded-md text-xs font-medium border",
                  profileMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                )}
              >
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name</label>
                <Input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Email Address</label>
                <Input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="h-9 text-xs bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">Email changes are managed through verified security requests.</p>
              </div>

              <Button
                type="submit"
                disabled={isUpdatingProfile || profileName === session?.user?.name}
                className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white px-4 cursor-pointer"
              >
                {isUpdatingProfile ? <Loader2 className="size-3.5 animate-spin" /> : "Save Profile"}
              </Button>
            </form>
          </div>

          {/* 2. Change Password Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="size-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Lock className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500">Ensure your account is using a long, random password</p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={cn(
                  "p-3 rounded-md text-xs font-medium border",
                  passwordMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                )}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white px-4 cursor-pointer"
              >
                {isChangingPassword ? <Loader2 className="size-3.5 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          </div>

          {/* 3. Two-Factor Authentication (2FA) Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-9 rounded-md flex items-center justify-center border",
                    is2FAEnabled
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  <ShieldCheck className="size-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h2>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        is2FAEnabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      )}
                    >
                      {is2FAEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add an extra layer of security using Google Authenticator, Authy, or 1Password
                  </p>
                </div>
              </div>

              {is2FAEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIs2FAModalOpen(true)}
                  className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleOpen2FASetupModal}
                  className="h-8 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white cursor-pointer"
                >
                  Set up 2FA
                </Button>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-slate-50 p-3.5 rounded-md border border-slate-200/80">
              <p>
                When 2FA is active, you will be prompted for a secure 6-digit one-time password (TOTP) from your mobile authenticator app whenever you sign in.
              </p>
            </div>
          </div>

          {/* 4. Danger Zone: Delete Account */}
          <div className="bg-white rounded-lg border border-rose-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="size-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-rose-900">Danger Zone: Delete Account</h2>
                <p className="text-xs text-rose-600/90">
                  Permanently delete your user account, workspaces, sites, pageviews, and consent audit vault
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-600 max-w-lg">
                Once deleted, your account and all associated data cannot be recovered. Please export any audit receipts before proceeding.
              </p>
              <Button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(true)}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKSPACE & TEAM                                                   */}
      {/* ========================================================================= */}
      {activeTab === "workspace" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Workspace Selector Bar */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-blue-50 border border-blue-200 text-[#1868db] flex items-center justify-center">
                <Building2 className="size-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Workspace</div>
                <div className="text-sm font-bold text-slate-900">{activeWorkspace?.name || "No Workspace Selected"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeWorkspace?.id || ""}
                onChange={(e) => {
                  const found = workspaces.find((w) => w.id === e.target.value)
                  if (found) setActiveWorkspace(found)
                }}
                className="h-8.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 text-slate-800 cursor-pointer"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>

              <Button
                type="button"
                onClick={() => setIsNewWorkspaceModalOpen(true)}
                className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5" />
                New Workspace
              </Button>
            </div>
          </div>

          {activeWorkspace && (
            <>
              {/* Workspace General Settings Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Workspace Settings
                </h2>

                {workspaceMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-md text-xs font-medium border",
                      workspaceMessage.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                    )}
                  >
                    {workspaceMessage.text}
                  </div>
                )}

                <form onSubmit={handleUpdateWorkspaceName} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Workspace Name</label>
                    <Input
                      type="text"
                      value={workspaceNameInput}
                      onChange={(e) => setWorkspaceNameInput(e.target.value)}
                      required
                      className="h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Workspace Slug</label>
                    <Input
                      type="text"
                      value={activeWorkspace.slug}
                      disabled
                      className="h-9 text-xs bg-slate-100 border-slate-200 text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingWorkspace || workspaceNameInput === activeWorkspace.name}
                    className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white px-4 cursor-pointer"
                  >
                    {isUpdatingWorkspace ? <Loader2 className="size-3.5 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              </div>

              {/* Team Members Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Team Members</h2>
                    <p className="text-xs text-slate-500">Collaborate with engineers, analysts, and compliance managers</p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="h-8 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="size-3.5" />
                    Invite Member
                  </Button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Joined</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="size-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                                {m.name ? m.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{m.name || "User"}</div>
                                <div className="text-slate-500 text-[11px] font-mono">{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                                m.role === "owner"
                                  ? "bg-purple-100 text-purple-800"
                                  : m.role === "admin"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(m.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            {m.role !== "owner" && m.user_id !== session?.user?.id && (
                              <button
                                onClick={() => handleRemoveMember(m.user_id)}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delete Workspace Card */}
              {activeWorkspace.role === "owner" && workspaces.length > 1 && (
                <div className="bg-white rounded-lg border border-rose-200 p-5 shadow-2xs flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-rose-900">Delete Workspace</h3>
                    <p className="text-[11px] text-slate-500">Permanently delete "{activeWorkspace.name}" and its associated sites</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDeleteWorkspaceModalOpen(true)}
                    className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                  >
                    Delete Workspace
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BILLING & PLANS                                                    */}
      {/* ========================================================================= */}
      {activeTab === "billing" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Active Plan Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Current Plan</span>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400/30">
                  Active
                </span>
              </div>
              <h2 className="text-2xl font-bold mt-1">Starter Free Plan</h2>
              <p className="text-xs text-slate-300 mt-1">Ideal for personal sites, early-stage testing, and open-source projects</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="h-9 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white shadow-sm cursor-pointer"
                onClick={() => alert("Billing upgrade integration is coming soon! You are currently on the unlimited Starter Tier during preview.")}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Monthly Pageviews</span>
                <span className="font-mono text-slate-500">12,480 / 50,000</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1868db] rounded-full" style={{ width: "25%" }} />
              </div>
              <p className="text-[11px] text-slate-400">Resets in 14 days</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tracked Domains</span>
                <span className="font-mono text-slate-500">{sites.length} / 5 Sites</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (sites.length / 5) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Unlimited on Pro</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Consent Audit Receipts</span>
                <span className="font-mono text-slate-500">8,200 / 25,000</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "32%" }} />
              </div>
              <p className="text-[11px] text-slate-400">30-day vault retention</p>
            </div>
          </div>

          {/* Pricing Tier Comparison Cards */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Available Subscription Plans</h2>
              <p className="text-xs text-slate-500">Scale your privacy compliance and analytics seamlessly</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Starter */}
              <div className="p-5 rounded-lg border-2 border-[#1868db] bg-blue-50/20 flex flex-col justify-between relative">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold bg-[#1868db] text-white px-2 py-0.5 rounded uppercase">Current Plan</span>
                  <div className="text-base font-bold text-slate-900">Starter</div>
                  <div className="text-2xl font-black text-slate-900">$0 <span className="text-xs font-normal text-slate-500">/month</span></div>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Up to 50,000 pageviews/mo</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Up to 5 tracked domains</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Full IAB TCF & GCM v2 CMP</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> 30-day consent vault</li>
                  </ul>
                </div>
                <div className="pt-5">
                  <Button disabled className="w-full h-8.5 text-xs font-bold bg-slate-200 text-slate-600 cursor-not-allowed">
                    Active
                  </Button>
                </div>
              </div>

              {/* Pro */}
              <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">Most Popular</span>
                  <div className="text-base font-bold text-slate-900">Pro</div>
                  <div className="text-2xl font-black text-slate-900">$29 <span className="text-xs font-normal text-slate-500">/month</span></div>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Up to 500,000 pageviews/mo</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Unlimited tracked domains</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Remove UpFront branding</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> 1-year audit vault retention</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Unlimited team members</li>
                  </ul>
                </div>
                <div className="pt-5">
                  <Button
                    onClick={() => alert("Pro subscription checkout will be available with live Stripe integration.")}
                    className="w-full h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white cursor-pointer"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>

              {/* Enterprise */}
              <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">Custom Scale</span>
                  <div className="text-base font-bold text-slate-900">Enterprise</div>
                  <div className="text-2xl font-black text-slate-900">$199 <span className="text-xs font-normal text-slate-500">/month</span></div>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> 10M+ pageviews / month</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> 99.99% Uptime SLA</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Custom legal review & DPA</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /> Dedicated compliance engineer</li>
                  </ul>
                </div>
                <div className="pt-5">
                  <Button
                    variant="outline"
                    onClick={() => alert("Please contact enterprise@upfront.io for custom volume inquiries.")}
                    className="w-full h-8.5 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    Contact Enterprise
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Billing History & Invoices</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-slate-900">INV-2026-001</td>
                    <td className="p-3 text-slate-500">Sep 01, 2026</td>
                    <td className="p-3 font-mono text-slate-800">$0.00</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Paid
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => alert("Sample invoice receipt downloaded.")}
                        className="text-[#1868db] hover:underline font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Download className="size-3" /> PDF
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SITES & DOMAINS (EXISTING SITE MANAGER)                             */}
      {/* ========================================================================= */}
      {activeTab === "sites" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Registered Websites & Domains</h2>
              <p className="text-xs text-slate-500">Manage tracked websites, embed snippets, and configure domains</p>
            </div>

            <Button
              type="button"
              onClick={handleOpenAddSiteModal}
              className="inline-flex items-center gap-1.5 bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 h-8.5 rounded-md shadow-xs cursor-pointer"
            >
              <Plus className="size-4" />
              Add Site
            </Button>
          </div>

          {isLoadingSites ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs animate-pulse h-32" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <Globe className="size-10 text-slate-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No sites registered yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Add your first domain to begin tracking privacy analytics and cookie compliance
              </p>
              <Button
                type="button"
                onClick={handleOpenAddSiteModal}
                className="mt-4 bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold h-8.5 px-4 cursor-pointer"
              >
                Add Your First Site
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1868db]/50 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-md bg-blue-50 text-[#1868db] flex items-center justify-center border border-blue-100 font-bold text-xs">
                          <Globe className="size-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{site.domain}</div>
                          <div className="text-[11px] text-slate-500">{site.timezone || "UTC"}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSiteToDelete(site)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Site"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedSiteForSnippet(site)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1868db] hover:underline cursor-pointer"
                    >
                      <Code2 className="size-3.5" />
                      View Tracking Code
                    </button>

                    <a
                      href={`/analytics?domain=${encodeURIComponent(site.domain)}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900"
                    >
                      Analytics <ChevronRight className="size-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2FA SETUP / DISABLE MODAL                                                 */}
      {/* ========================================================================= */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            {is2FAEnabled ? (
              // DISABLE 2FA FORM
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
                  <ShieldAlert className="size-5" />
                  Disable Two-Factor Authentication
                </div>
                <p className="text-xs text-slate-600">
                  Please enter your account password to confirm disabling Two-Factor Authentication.
                </p>

                {twoFactorError && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                    {twoFactorError}
                  </div>
                )}

                <Input
                  type="password"
                  value={disable2FAPassword}
                  onChange={(e) => setDisable2FAPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  autoFocus
                  className="h-9 text-xs"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="h-8.5 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={is2FADisabling || !disable2FAPassword}
                    className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {is2FADisabling ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm Disable"}
                  </Button>
                </div>
              </form>
            ) : setup2FAStep === "password" ? (
              // STEP 1: PASSWORD VERIFICATION BEFORE GENERATING QR
              <form onSubmit={handleVerifyPasswordFor2FA} className="space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="size-5 text-[#1868db]" />
                  Verify Password to Set Up 2FA
                </div>
                <p className="text-xs text-slate-600">
                  Please enter your account password to generate your secure authenticator app QR code:
                </p>

                {twoFactorError && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                    {twoFactorError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Account Password</label>
                  <Input
                    type="password"
                    value={setup2FAPassword}
                    onChange={(e) => setSetup2FAPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    autoFocus
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="h-8.5 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={is2FASetupLoading || !setup2FAPassword.trim()}
                    className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white flex items-center gap-1.5"
                  >
                    {is2FASetupLoading ? <Loader2 className="size-3.5 animate-spin" /> : <>Continue <ArrowRight className="size-3.5" /></>}
                  </Button>
                </div>
              </form>
            ) : setup2FAStep === "backup" ? (
              // STEP 3: BACKUP RECOVERY CODES
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="size-5" />
                  2FA Activated Successfully!
                </div>
                <p className="text-xs text-slate-600">
                  Save these emergency backup codes in a safe place. You can use them to log in if you lose access to your authenticator app:
                </p>

                <div className="grid grid-cols-2 gap-1.5 p-3 rounded-lg bg-slate-900 font-mono text-emerald-400 text-xs select-all">
                  {backupCodes.map((c, i) => (
                    <div key={i}>{c}</div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join("\n"))
                      setCopiedBackupCodes(true)
                      setTimeout(() => setCopiedBackupCodes(false), 2000)
                    }}
                    className="h-8.5 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedBackupCodes ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copiedBackupCodes ? "Copied!" : "Copy Codes"}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              // STEP 2: SCAN QR CODE & ENTER 6-DIGIT CODE
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <QrCode className="size-5 text-[#1868db]" />
                  Scan with Authenticator App
                </div>
                <p className="text-xs text-slate-600">
                  Open Google Authenticator, Authy, or 1Password and scan this QR code:
                </p>

                {totpURI && (
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(totpURI)}`}
                      alt="2FA QR Code"
                      className="size-40 rounded shadow-xs"
                    />
                  </div>
                )}

                {totpSecret && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-500">Or enter secret key manually:</div>
                    <div className="flex items-center gap-2">
                      <code className="px-2.5 py-1 text-xs font-mono bg-slate-100 text-slate-800 rounded border border-slate-200 flex-1 truncate">
                        {totpSecret}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(totpSecret)
                          setCopiedSecret(true)
                          setTimeout(() => setCopiedSecret(false), 2000)
                        }}
                        className="h-7 text-[11px] font-bold"
                      >
                        {copiedSecret ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                )}

                {twoFactorError && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                    {twoFactorError}
                  </div>
                )}

                <form onSubmit={handleVerify2FACode} className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <Input
                      type="text"
                      value={totpVerificationCode}
                      onChange={(e) => setTotpVerificationCode(e.target.value.trim())}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      required
                      className="h-9 text-center font-mono tracking-widest text-base bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIs2FAModalOpen(false)}
                      className="h-8.5 text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isVerifyingTOTP || totpVerificationCode.length < 6}
                      className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
                    >
                      {isVerifyingTOTP ? <Loader2 className="size-3.5 animate-spin" /> : "Verify & Enable"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ACCOUNT MODAL                                                      */}
      {/* ========================================================================= */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <AlertTriangle className="size-5" />
              Delete Account Permanently
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. All your registered domains, analytics data, consent records, and workspaces will be permanently erased.
            </p>

            {deleteAccountError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {deleteAccountError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Type <span className="font-mono text-rose-600">DELETE</span> or your email to confirm:
              </label>
              <Input
                type="text"
                value={deleteAccountConfirmation}
                onChange={(e) => setDeleteAccountConfirmation(e.target.value)}
                placeholder="DELETE"
                autoFocus
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || (deleteAccountConfirmation !== "DELETE" && deleteAccountConfirmation !== session?.user?.email)}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeletingAccount ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Everything"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVITE MEMBER MODAL                                                       */}
      {/* ========================================================================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleInviteMember} className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <UserPlus className="size-4.5 text-[#1868db]" />
              Invite Teammate to {activeWorkspace?.name}
            </div>

            {inviteError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {inviteError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                autoFocus
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded-md px-3 text-slate-800"
              >
                <option value="admin">Admin (Can manage sites, settings & invites)</option>
                <option value="member">Member (Can view analytics and edit consent)</option>
                <option value="viewer">Viewer (Read-only analytics access)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInvitingMember || !inviteEmail.trim()}
                className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
              >
                {isInvitingMember ? <Loader2 className="size-3.5 animate-spin" /> : "Send Invitation"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW WORKSPACE MODAL                                                       */}
      {/* ========================================================================= */}
      {isNewWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleCreateNewWorkspace} className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Building2 className="size-4.5 text-[#1868db]" />
              Create New Workspace
            </div>

            {newWorkspaceError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {newWorkspaceError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Workspace Name</label>
              <Input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Agency or Project Alpha"
                required
                autoFocus
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewWorkspaceModalOpen(false)}
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingNewWorkspace || !newWorkspaceName.trim()}
                className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
              >
                {isCreatingNewWorkspace ? <Loader2 className="size-3.5 animate-spin" /> : "Create Workspace"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE WORKSPACE MODAL                                                    */}
      {/* ========================================================================= */}
      {isDeleteWorkspaceModalOpen && activeWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="size-5" />
              Delete Workspace "{activeWorkspace.name}"?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All sites and compliance data in this workspace will be deleted. This action is irreversible.
            </p>

            {deleteWorkspaceError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {deleteWorkspaceError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteWorkspaceModalOpen(false)}
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteActiveWorkspace}
                disabled={isDeletingWorkspace}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeletingWorkspace ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD SITE MODAL                                                            */}
      {/* ========================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            {modalStep === "input" ? (
              <form onSubmit={handleCreateSite} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Globe className="size-4.5 text-[#1868db]" />
                  Add New Website
                </div>

                {siteErrorMessage && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                    {siteErrorMessage}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Domain Name</label>
                  <Input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                    required
                    autoFocus
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Timezone</label>
                  <Input
                    type="text"
                    value={newTimezone}
                    onChange={(e) => setNewTimezone(e.target.value)}
                    placeholder="UTC"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddModalOpen(false)}
                    className="h-8.5 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingSite || !newDomain.trim()}
                    className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
                  >
                    {isSubmittingSite ? <Loader2 className="size-3.5 animate-spin" /> : "Add Site"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="size-5" />
                  Site Added Successfully!
                </div>
                <p className="text-xs text-slate-600">
                  Copy and paste this unified tag into the <code className="text-[#1868db] bg-blue-50 px-1 py-0.5 rounded font-mono">&lt;head&gt;</code> of your website:
                </p>

                <div className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto select-all">
                  {`<script defer src="https://usrly-five.vercel.app/upfront.js" data-domain="${createdSite?.domain}"></script>`}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`<script defer src="https://usrly-five.vercel.app/upfront.js" data-domain="${createdSite?.domain}"></script>`)
                      setCopiedSnippet(true)
                      setTimeout(() => setCopiedSnippet(false), 2000)
                    }}
                    className="h-8.5 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedSnippet ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copiedSnippet ? "Copied!" : "Copy Code"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW SNIPPET MODAL                                                        */}
      {/* ========================================================================= */}
      {selectedSiteForSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Code2 className="size-4.5 text-[#1868db]" />
              Tracking Tag for {selectedSiteForSnippet.domain}
            </div>

            <p className="text-xs text-slate-600">
              Add this unified script tag into the <code className="text-[#1868db] bg-blue-50 px-1 py-0.5 rounded font-mono">&lt;head&gt;</code> of your website to enable both cookie consent compliance and privacy web analytics:
            </p>

            <div className="p-3.5 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto select-all">
              {`<script defer src="https://usrly-five.vercel.app/upfront.js" data-domain="${selectedSiteForSnippet.domain}"></script>`}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`<script defer src="https://usrly-five.vercel.app/upfront.js" data-domain="${selectedSiteForSnippet.domain}"></script>`)
                  setCopiedSnippet(true)
                  setTimeout(() => setCopiedSnippet(false), 2000)
                }}
                className="h-8.5 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedSnippet ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copiedSnippet ? "Copied!" : "Copy Code"}
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedSiteForSnippet(null)}
                className="h-8.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE SITE MODAL                                                         */}
      {/* ========================================================================= */}
      {siteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="size-5" />
              Delete {siteToDelete.domain}?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this website? All historical pageviews, sessions, and consent receipts will be permanently deleted.
            </p>

            {deleteSiteError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {deleteSiteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSiteToDelete(null)}
                className="h-8.5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteSite}
                disabled={isDeletingSite}
                className="h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeletingSite ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Website"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
