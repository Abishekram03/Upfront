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
  Ban,
  Languages,
  Sliders,
  CheckSquare,
  Square,
  FileText,
  Eye,
  Info,
  Receipt,
  Zap,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@workspace/ui/lib/utils"
import { fetchSites, createSite, deleteSite, Site, API_BASE } from "@/lib/api"
import { useDomain } from "@/lib/domain-context"
import { useWorkspace, Workspace } from "@/lib/workspace-context"
import { useSession, authClient } from "@/lib/auth-client"
import { useEntitlements } from "@/lib/entitlements-context"
import { PLANS, type PlanId } from "@/lib/billing/plans"
import { openPaddleCustomerPortal } from "@/lib/billing/paddle-client"
import {
  SUPPORTED_LANGUAGES,
  CMP_TRANSLATIONS,
  resolveCMPText,
  POLICY_TRANSLATIONS,
  resolvePolicyText,
} from "@/lib/i18n/translations"

type TabType = "profile" | "workspace" | "billing" | "sites" | "languages"

export function SettingsView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: isSessionLoading } = useSession()
  const { refreshSites: refreshContextSites } = useDomain()
  const {
    entitlements,
    usage,
    plan: currentPlan,
    isPaid,
    isPastDue,
    isCheckingOut,
    startCheckout,
    openUpgradeModal,
    refreshEntitlements,
  } = useEntitlements()
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
  const [billingToast, setBillingToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Cancel Subscription Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Invoices & Billing History State
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

  const loadInvoices = async (wsId: string) => {
    if (!wsId) return
    setIsLoadingInvoices(true)
    try {
      const res = await fetch(`/api/v1/billing/invoices?workspaceId=${encodeURIComponent(wsId)}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (err) {
      console.warn("Failed to load invoices:", err)
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  useEffect(() => {
    if (activeWorkspace?.id && activeTab === "billing") {
      loadInvoices(activeWorkspace.id)
    }
  }, [activeWorkspace?.id, activeTab])

  const handleConfirmCancel = async () => {
    if (!activeWorkspace?.id) return
    try {
      setIsCancelling(true)
      setCancelError(null)
      const res = await fetch("/api/v1/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          cancelImmediately,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to cancel subscription")
      }
      await refreshEntitlements()
      await refreshWorkspaces()
      setIsCancelModalOpen(false)
      setBillingToast({
        type: "success",
        message: data.message || "Subscription updated successfully.",
      })
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel subscription. Please try again.")
    } finally {
      setIsCancelling(false)
    }
  }

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

  // Listen to checkout query param on return from Paddle
  useEffect(() => {
    const checkoutParam = searchParams.get("checkout")
    if (checkoutParam === "success") {
      setActiveTab("billing")
      const planFromUrl = searchParams.get("plan") || "growth"
      const targetWsId = searchParams.get("workspaceId") || activeWorkspace?.id

      const runSyncAndRefresh = async () => {
        if (targetWsId) {
          try {
            await fetch("/api/v1/billing/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workspaceId: targetWsId,
                plan: planFromUrl === "addon_100k" ? "addon_100k" : planFromUrl === "business" ? "business" : "growth",
              }),
            })
          } catch (e) {
            console.error("Failed to sync billing on checkout return:", e)
          }
        }
        await refreshEntitlements()
        await refreshWorkspaces()
        if (targetWsId) {
          loadInvoices(targetWsId)
        }
      }

      runSyncAndRefresh()

      setBillingToast({
        type: "success",
        message: "🎉 Payment received! Your workspace plan and capabilities have been updated successfully.",
      })
      if (typeof window !== "undefined" && window.history?.replaceState) {
        const url = new URL(window.location.href)
        url.searchParams.delete("checkout")
        url.searchParams.delete("plan")
        url.searchParams.delete("workspaceId")
        window.history.replaceState({}, "", url.toString())
      }
    } else if (checkoutParam === "cancel" || checkoutParam === "error") {
      setActiveTab("billing")
      setBillingToast({
        type: "error",
        message: "Checkout was cancelled or could not be completed. No charges were made.",
      })
      if (typeof window !== "undefined" && window.history?.replaceState) {
        const url = new URL(window.location.href)
        url.searchParams.delete("checkout")
        url.searchParams.delete("plan")
        url.searchParams.delete("workspaceId")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [searchParams, activeWorkspace?.id, refreshEntitlements, refreshWorkspaces])

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
  // 4. LANGUAGES & LOCALIZATION STATE
  // ==========================================
  const { activeDomain } = useDomain()
  const [selectedDomainForLang, setSelectedDomainForLang] = useState<string>("")
  const [enableAutoLanguage, setEnableAutoLanguage] = useState(true)
  const [defaultLanguage, setDefaultLanguage] = useState("en")
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([
    "en", "de", "fr", "es", "pt", "it", "nl", "hi", "ja"
  ])
  const [isLoadingLangConfig, setIsLoadingLangConfig] = useState(false)
  const [isSavingLangConfig, setIsSavingLangConfig] = useState(false)
  const [langConfigMessage, setLangConfigMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [previewLangSimulator, setPreviewLangSimulator] = useState("en")
  const [previewPillarTab, setPreviewPillarTab] = useState<"banner" | "preference" | "policy">("banner")

  useEffect(() => {
    if (!selectedDomainForLang && (activeDomain || sites.length > 0)) {
      setSelectedDomainForLang(activeDomain || sites[0]?.domain || "")
    }
  }, [activeDomain, sites, selectedDomainForLang])

  useEffect(() => {
    if (!selectedDomainForLang) return
    let isMounted = true
    const fetchConfig = async () => {
      try {
        setIsLoadingLangConfig(true)
        const res = await fetch(`/api/v1/consent/config?domain=${encodeURIComponent(selectedDomainForLang)}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data) {
            setEnableAutoLanguage(data.enable_auto_language !== false)
            setDefaultLanguage(data.default_language || "en")
            if (Array.isArray(data.supported_languages) && data.supported_languages.length > 0) {
              setSupportedLanguages(data.supported_languages)
            } else {
              setSupportedLanguages(["en", "de", "fr", "es", "pt", "it", "nl", "hi", "ja"])
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load localization config:", e)
      } finally {
        if (isMounted) setIsLoadingLangConfig(false)
      }
    }
    fetchConfig()
    return () => { isMounted = false }
  }, [selectedDomainForLang])

  const hasMultilingual = Boolean(entitlements?.capabilities?.["cmp.multilingual"])

  const handleSaveLangConfig = async () => {
    if (!selectedDomainForLang) return
    if (!hasMultilingual) {
      openUpgradeModal("business", "Multi-Language Translations Suite")
      return
    }
    try {
      setIsSavingLangConfig(true)
      setLangConfigMessage(null)
      const res = await fetch("/api/v1/consent/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomainForLang,
          enable_auto_language: enableAutoLanguage,
          default_language: defaultLanguage,
          supported_languages: supportedLanguages,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to save language settings")
      setLangConfigMessage({
        type: "success",
        text: `Language & localization settings saved and deployed for ${selectedDomainForLang}!`,
      })
      setTimeout(() => setLangConfigMessage(null), 4500)
    } catch (err: any) {
      setLangConfigMessage({
        type: "error",
        text: err.message || "Failed to update language settings.",
      })
    } finally {
      setIsSavingLangConfig(false)
    }
  }

  const toggleLanguage = (code: string) => {
    if (!hasMultilingual && code !== "en") {
      openUpgradeModal("business", "Multi-Language Translations Suite")
      return
    }
    setSupportedLanguages((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 1) {
          return prev
        }
        if (code === defaultLanguage) {
          const remaining = prev.filter((c) => c !== code)
          setDefaultLanguage(remaining[0] || "en")
          return remaining
        }
        return prev.filter((c) => c !== code)
      } else {
        return [...prev, code]
      }
    })
  }

  const selectAllLanguages = () => {
    if (!hasMultilingual) {
      openUpgradeModal("business", "Multi-Language Translations Suite")
      return
    }
    setSupportedLanguages(SUPPORTED_LANGUAGES.map((l) => l.code))
  }

  const resetToDefaultLanguages = () => {
    if (!hasMultilingual) {
      openUpgradeModal("business", "Multi-Language Translations Suite")
      return
    }
    setSupportedLanguages(["en", "de", "fr", "es", "pt", "it", "nl", "hi", "ja"])
    setDefaultLanguage("en")
    setEnableAutoLanguage(true)
  }

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
      const created = await createSite(cleanDomain, newTimezone, activeWorkspace?.id)
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
            { id: "languages", label: "Languages & Localization", icon: Languages, isBusiness: true },
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
                <span>{tab.label}</span>
                {tab.isBusiness && !hasMultilingual && (
                  <span className={cn(
                    "text-[9px] font-extrabold px-1.5 py-0.2 rounded border",
                    isActive
                      ? "bg-white/20 text-white border-white/40"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  )}>
                    Business
                  </span>
                )}
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
          {/* Toast / Notification Alert */}
          {billingToast && (
            <div
              className={cn(
                "p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-200",
                billingToast.type === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              )}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                {billingToast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{billingToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setBillingToast(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Past Due Warning Alert */}
          {isPastDue && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm">Payment Past Due</p>
                <p>
                  Your last subscription renewal payment failed. Please update your payment method in the customer portal to maintain uninterrupted Growth/Business access.
                </p>
                {entitlements?.paddleCustomerId && (
                  <button
                    type="button"
                    onClick={() => openPaddleCustomerPortal(entitlements.paddleCustomerId!)}
                    className="mt-2 font-bold text-amber-900 underline hover:text-amber-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Update Payment Method in Paddle</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Plan Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Current Workspace Plan</span>
                <span
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                    currentPlan === "business"
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                      : currentPlan === "growth"
                      ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
                      : "bg-slate-700/60 text-slate-300 border-slate-600"
                  )}
                >
                  {entitlements?.status ? entitlements.status.toUpperCase() : "ACTIVE"}
                </span>
                {entitlements?.cancelAtPeriodEnd && (
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-400/30">
                    Cancels at end of period
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-extrabold mt-1.5 flex items-center gap-2">
                <span>{PLANS[currentPlan].name}</span>
                <span className="text-lg font-normal text-slate-400">
                  ({PLANS[currentPlan].priceMonthly === 0 ? "Free forever" : `$${PLANS[currentPlan].priceMonthly}/month`})
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                {PLANS[currentPlan].positioning || PLANS[currentPlan].description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {entitlements?.paddleCustomerId && (
                <Button
                  type="button"
                  onClick={() => openPaddleCustomerPortal(entitlements.paddleCustomerId!)}
                  className="h-10 text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <span>Manage in Paddle</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentPlan === "free" ? (
                <Button
                  type="button"
                  disabled={isCheckingOut !== null}
                  onClick={() => startCheckout("growth")}
                  className="h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {isCheckingOut === "growth" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Upgrade Plan</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setCancelError(null)
                    setCancelImmediately(false)
                    setIsCancelModalOpen(true)
                  }}
                  className={cn(
                    "h-10 text-xs font-bold px-3.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2 shadow-xs",
                    entitlements?.cancelAtPeriodEnd
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50"
                      : "bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/60 hover:text-white"
                  )}
                >
                  <Ban className="size-3.5" />
                  <span>{entitlements?.cancelAtPeriodEnd ? "Cancellation Scheduled" : "Cancel Subscription"}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Usage & Limits Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Monthly Pageviews */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Monthly Pageviews</span>
                <span className="font-mono text-slate-900 font-bold">
                  {(usage?.pageviewsThisMonth || 0).toLocaleString()} / {(usage?.pageviewLimit || entitlements?.limits.monthlyPageviews || 50000).toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, usage?.pageviewPercent || 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <p className="text-slate-400">
                  {usage?.pageviewPercent ? `${usage.pageviewPercent}% used this month` : "0% used this month"}
                </p>
                {Boolean(usage?.extraPageviewsBalance) && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    +{usage?.extraPageviewsBalance?.toLocaleString()} Rollover Active
                  </span>
                )}
              </div>
            </div>

            {/* 2. Tracked Websites */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Websites & Domains</span>
                <span className="font-mono text-slate-900 font-bold">{sites.length} Active</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">
                ✓ Unlimited websites on all plans
              </p>
            </div>

            {/* 3. Scanner Page Limit */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Scanner Depth</span>
                <span className="font-mono text-slate-900 font-bold">
                  {(entitlements?.limits.pagesPerScan || 100).toLocaleString()} pages/scan
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: currentPlan === "business" ? "100%" : currentPlan === "growth" ? "60%" : "20%",
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {currentPlan === "business" ? "5,000 pages per scan" : currentPlan === "growth" ? "1,000 pages per scan" : "100 pages per scan"}
              </p>
            </div>

            {/* 4. Consent History Retention */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Consent History</span>
                <span className="font-mono text-slate-900 font-bold">
                  {entitlements?.limits.consentHistoryDays === 30
                    ? "30 Days"
                    : `${(entitlements?.limits.consentHistoryDays || 30) / 30} Months`}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: currentPlan === "business" ? "100%" : currentPlan === "growth" ? "50%" : "15%",
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {currentPlan === "business" ? "24 months legal proof" : currentPlan === "growth" ? "12 months legal proof" : "30-day proof history"}
              </p>
            </div>
          </div>

          {/* Pricing Tier Comparison Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Choose Your Plan</h2>
              <p className="text-xs text-slate-500">
                Switch or upgrade anytime. Changes take effect immediately via Paddle billing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan 1: Free */}
              <div
                className={cn(
                  "p-6 rounded-2xl border flex flex-col justify-between transition-all",
                  currentPlan === "free"
                    ? "border-slate-400 ring-2 ring-slate-400/20 bg-slate-50/50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Free</span>
                    {currentPlan === "free" && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">$0</span>
                    <span className="text-xs text-slate-500 ml-1">/month</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Analytics + essential consent management.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>Unlimited</strong> websites</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>50,000</strong> pageviews/month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>3 months analytics history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Essential Cookie Scanner (100 pages)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Consent Banner & Cookie Policy</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>30-day Consent Proof Vault</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6">
                  <Button
                    disabled
                    variant="outline"
                    className="w-full text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    {currentPlan === "free" ? "Active Plan" : "Included"}
                  </Button>
                </div>
              </div>

              {/* Plan 2: Growth */}
              <div
                onClick={() => currentPlan !== "growth" && !isCheckingOut && startCheckout("growth")}
                className={cn(
                  "p-6 rounded-2xl border flex flex-col justify-between transition-all relative",
                  currentPlan === "growth"
                    ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer group"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Growth</span>
                    {currentPlan === "growth" ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Current Plan
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">$19</span>
                    <span className="text-xs text-slate-500 ml-1">/month</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Full consent management for growing websites.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>Unlimited</strong> websites</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>250,000</strong> pageviews/month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>12 months analytics retention</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Full Scanner (1,000 pages/scan)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Global Privacy Control (GPC)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Geo-targeting (EU / UK / Global)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Google Consent Mode v2</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Monthly Scheduled Scans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Version History & Rollback</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Remove Upfront Branding</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6">
                  <Button
                    disabled={currentPlan === "growth" || isCheckingOut !== null}
                    onClick={(e) => {
                      e.stopPropagation()
                      startCheckout("growth")
                    }}
                    className={cn(
                      "w-full text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2",
                      currentPlan === "growth"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    )}
                  >
                    {isCheckingOut === "growth" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : currentPlan === "growth" ? (
                      "Active Plan"
                    ) : (
                      "Upgrade to Growth"
                    )}
                  </Button>
                </div>
              </div>

              {/* Plan 3: Business */}
              <div
                onClick={() => currentPlan !== "business" && !isCheckingOut && startCheckout("business")}
                className={cn(
                  "p-6 rounded-2xl border flex flex-col justify-between transition-all relative",
                  currentPlan === "business"
                    ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 shadow-sm"
                    : "border-slate-200 bg-white hover:border-amber-400 hover:shadow-md cursor-pointer group"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Business</span>
                    {currentPlan === "business" ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Current Plan
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Enterprise
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">$49</span>
                    <span className="text-xs text-slate-500 ml-1">/month</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Advanced compliance and enterprise customization.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>Unlimited</strong> websites</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>1,000,000</strong> pageviews/month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>24 months analytics retention</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Full Scanner (5,000 pages/scan)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>Multi-Language Translations Suite</strong> (9+ Languages & Auto-detect)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>Disable Banner</strong> (CMP Killswitch / Headless Mode)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>IAB TCF v2.3</strong> Framework</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>Custom CSS</strong> Injection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Weekly & Daily Scheduled Scans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>24-month Consent Audit Vault</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Everything in Growth included</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6">
                  <Button
                    disabled={currentPlan === "business" || isCheckingOut !== null}
                    onClick={(e) => {
                      e.stopPropagation()
                      startCheckout("business")
                    }}
                    className={cn(
                      "w-full text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2",
                      currentPlan === "business"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white cursor-pointer"
                    )}
                  >
                    {isCheckingOut === "business" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : currentPlan === "business" ? (
                      "Active Plan"
                    ) : (
                      "Upgrade to Business"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Booster Add-On Package */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-500/30 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-400/30">
                    <Zap className="size-3.5 text-amber-400 fill-amber-400" />
                    Capacity Booster Add-On
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    Rollover Guaranteed: Never Expires
                  </span>
                  {Boolean(usage?.extraPageviewsBalance) && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      Balance: +{usage?.extraPageviewsBalance?.toLocaleString()} PVs
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-white">100,000 Pageview Booster Pack</h3>
                  <span className="text-2xl font-black text-amber-400">$10</span>
                  <span className="text-xs text-slate-400 font-medium">/ pack</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Experiencing traffic surges or launching a high-volume marketing campaign? Add 100k extra pageviews to your workspace pool. 
                  <strong> Unused pageviews never expire or reset at month-end</strong>—they roll over month-to-month until fully consumed.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span><strong>+100,000</strong> instant pageviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span><strong>Lifetime rollover</strong> (never resets)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Stackable anytime</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[200px]">
                <Button
                  type="button"
                  disabled={isCheckingOut !== null}
                  onClick={() => startCheckout("addon_100k")}
                  className="h-11 px-6 text-xs font-bold bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md cursor-pointer flex items-center justify-center gap-2 rounded-xl transition-all"
                >
                  {isCheckingOut === "addon_100k" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Add 100k Pageviews ($10)</span>
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400">
                  Secure checkout powered by Paddle
                </p>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Billing History & Invoices</h2>
                <p className="text-xs text-slate-500">
                  Official VAT/tax invoices, receipts, and order history for your workspace.
                </p>
              </div>
              {entitlements?.paddleCustomerId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openPaddleCustomerPortal(entitlements.paddleCustomerId!)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Receipt className="size-3.5 text-slate-500" />
                  <span>Paddle Customer Portal</span>
                  <ExternalLink className="size-3 text-slate-400" />
                </Button>
              )}
            </div>

            {isLoadingInvoices ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="size-6 animate-spin text-blue-600" />
                <p className="text-xs">Loading billing history...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Receipt className="size-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">No Billing Invoices Yet</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  You are currently on the Free plan or have not made any payments yet. When you upgrade to Growth, Business, or purchase an add-on, your official PDF invoices and tax receipts will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Invoice / Reference</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {inv.date ? new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {inv.amount}
                        </td>
                        <td className="p-3.5">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            inv.status === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {inv.receiptUrl ? (
                            <a
                              href={inv.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1868db] hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                            >
                              <Download className="size-3" /> PDF
                            </a>
                          ) : entitlements?.paddleCustomerId ? (
                            <button
                              type="button"
                              onClick={() => openPaddleCustomerPortal(entitlements.paddleCustomerId!)}
                              className="text-[#1868db] hover:underline font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <ExternalLink className="size-3" /> View in Paddle
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-mono">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
      {/* TAB 5: LANGUAGES & LOCALIZATION (CENTRALIZED MULTI-LANGUAGE ENGINE)         */}
      {/* ========================================================================= */}
      {activeTab === "languages" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Business Tier Upgrade Banner (When on Free or Growth) */}
          {!hasMultilingual && (
            <div className="p-4.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-white border border-amber-300 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Multi-Language Translation Suite is a Business Tier Feature</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                      Business Tier
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">
                    Upgrade to the <strong>Business Plan ($49/month)</strong> to unlock automated visitor locale detection, multi-language banner switching, and live translation across all 9 languages for your notice banners, preference centers, and legal policies.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => openUpgradeModal("business", "Multi-Language Translations Suite")}
                className="h-9 text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shrink-0 shadow-xs cursor-pointer px-4"
              >
                Upgrade to Business
              </Button>
            </div>
          )}

          {/* Domain Binding Bar */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-blue-50 border border-blue-200 text-[#1868db] flex items-center justify-center">
                <Languages className="size-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Domain for Localization</div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedDomainForLang || "No Domain Selected"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDomainForLang}
                onChange={(e) => setSelectedDomainForLang(e.target.value)}
                className="h-8.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 text-slate-800 cursor-pointer"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.domain}>
                    {s.domain}
                  </option>
                ))}
              </select>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#1868db] border border-blue-200 shrink-0">
                {supportedLanguages.length} of {SUPPORTED_LANGUAGES.length} Languages Enabled
              </span>
            </div>
          </div>

          {/* Feedback message banner */}
          {langConfigMessage && (
            <div
              className={cn(
                "p-3 rounded-md text-xs font-medium border animate-in fade-in",
                langConfigMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center gap-2"
                  : "bg-rose-50 border-rose-200 text-rose-800 flex items-center gap-2"
              )}
            >
              {langConfigMessage.type === "success" ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="size-4 text-rose-600 shrink-0" />}
              <span>{langConfigMessage.text}</span>
            </div>
          )}

          {/* 3 Pillars Scope Showcase Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-lg p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider uppercase border border-blue-500/30 mb-2">
                  <Sparkles className="size-3" />
                  Unified Multi-Language Architecture
                </div>
                <h2 className="text-base font-bold text-white">Centralized Localization for All 3 Compliance Pillars</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Your enabled languages and auto-detection rules automatically propagate across your entire customer-facing compliance stack in real-time.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleSaveLangConfig}
                disabled={isSavingLangConfig || !selectedDomainForLang}
                className={cn(
                  "h-9 text-xs font-bold px-5 cursor-pointer shrink-0 shadow-xs",
                  hasMultilingual
                    ? "bg-[#1868db] hover:bg-[#1559be] text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                {isSavingLangConfig ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : hasMultilingual ? (
                  "Save & Deploy Languages"
                ) : (
                  "Upgrade to Business to Save"
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-md bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                  <Layers className="size-4" />
                  1. Cookie Notice Banner
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Headline, value description, and all CTA buttons (Accept All, Reject All, Customise Preferences) translate automatically.
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="size-4" />
                  2. Granular Preference Centre
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  5 standard categories (Necessary, Functional, Analytics, Performance, Ad), Always-Active tags, and cookie column headers.
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <FileText className="size-4" />
                  3. Legal Policies Suite
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Self-updating Cookie Policy, Privacy Policy, and Terms of Service documents render in the visitor&apos;s detected locale.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Card: Auto-detection & Fallback */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Detection & Fallback Rules</span>
              <span className="text-[11px] font-normal text-slate-500">Domain: {selectedDomainForLang || "All Sites"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auto-Detection Switch */}
              <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-[#1868db]" />
                    Auto-Language Detection
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Inspects visitor browser locale (e.g. <code className="text-slate-700 font-mono bg-slate-200/60 px-1 rounded">de-DE</code>, <code className="text-slate-700 font-mono bg-slate-200/60 px-1 rounded">fr-FR</code>, <code className="text-slate-700 font-mono bg-slate-200/60 px-1 rounded">ja-JP</code>) and geolocation headers to pick the matching active language.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableAutoLanguage}
                  onChange={(e) => setEnableAutoLanguage(e.target.checked)}
                  className="size-4.5 rounded text-[#1868db] focus:ring-[#1868db] cursor-pointer mt-0.5"
                />
              </div>

              {/* Default Language Select */}
              <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-900 block">
                  Default Fallback Language
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Served if a visitor&apos;s browser locale is not present in your enabled languages list.
                </p>
                <select
                  value={defaultLanguage}
                  onChange={(e) => {
                    const newDefault = e.target.value
                    setDefaultLanguage(newDefault)
                    if (!supportedLanguages.includes(newDefault)) {
                      setSupportedLanguages((prev) => [...prev, newDefault])
                    }
                  }}
                  className="w-full h-9 text-xs font-semibold bg-white border border-slate-300 rounded-md px-3 text-slate-800 cursor-pointer shadow-2xs focus:border-[#1868db]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.nativeName}) [{l.code.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Supported Languages Checklist Grid */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Supported Languages</h3>
                <p className="text-xs text-slate-500">
                  Select which languages you want to provide for your visitors. Check a language to activate auto-detection and live translation for it.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllLanguages}
                  className="text-xs font-bold text-[#1868db] hover:underline px-2 py-1 rounded cursor-pointer"
                >
                  Select All ({SUPPORTED_LANGUAGES.length})
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={resetToDefaultLanguages}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded cursor-pointer"
                >
                  Reset Recommended
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = supportedLanguages.includes(lang.code)
                const isDefault = defaultLanguage === lang.code

                return (
                  <label
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-blue-50/40 border-[#1868db] shadow-2xs ring-1 ring-[#1868db]/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="size-4 text-[#1868db] rounded focus:ring-[#1868db] cursor-pointer"
                      />
                      <span className="text-2xl shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">({lang.code})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{lang.name}</div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isDefault && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Fallback
                        </span>
                      )}
                      {isSelected && !isDefault && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Active
                        </span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Interactive Translation Simulator & Preview Tester */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-[#1868db]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Interactive Translation Preview Simulator</h3>
                  <p className="text-xs text-slate-500">Test how your compliance assets render across your selected languages</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewPillarTab("banner")}
                    className={cn(
                      "px-2.5 py-1 rounded font-bold transition-all cursor-pointer",
                      previewPillarTab === "banner" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPillarTab("preference")}
                    className={cn(
                      "px-2.5 py-1 rounded font-bold transition-all cursor-pointer",
                      previewPillarTab === "preference" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Preference Centre
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPillarTab("policy")}
                    className={cn(
                      "px-2.5 py-1 rounded font-bold transition-all cursor-pointer",
                      previewPillarTab === "policy" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Legal Policy
                  </button>
                </div>

                <select
                  value={previewLangSimulator}
                  onChange={(e) => setPreviewLangSimulator(e.target.value)}
                  className="h-8 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-2.5 text-slate-800 cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.filter((l) => supportedLanguages.includes(l.code)).map((l) => (
                    <option key={l.code} value={l.code}>
                      Preview: {l.flag} {l.name} ({l.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Render selected simulator pillar */}
            {previewPillarTab === "banner" && (
              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      {resolveCMPText("title", null, previewLangSimulator)}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {resolveCMPText("description", null, previewLangSimulator)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0 font-mono">
                    {previewLangSimulator.toUpperCase()} Notice
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                  <Button type="button" className="h-8 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white">
                    {resolveCMPText("accept_all_label", null, previewLangSimulator)}
                  </Button>
                  <Button type="button" variant="outline" className="h-8 text-xs font-bold bg-white text-slate-700">
                    {resolveCMPText("reject_all_label", null, previewLangSimulator)}
                  </Button>
                  <Button type="button" variant="outline" className="h-8 text-xs font-semibold bg-white text-slate-700">
                    {resolveCMPText("preferences_label", null, previewLangSimulator)}
                  </Button>
                </div>
              </div>
            )}

            {previewPillarTab === "preference" && (
              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {resolveCMPText("preferences_title", null, previewLangSimulator)}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {resolveCMPText("preferences_description", null, previewLangSimulator)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0 font-mono">
                    {previewLangSimulator.toUpperCase()} Centre
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {resolveCMPText("necessary_title", null, previewLangSimulator)}
                      </div>
                      <div className="text-[11px] text-slate-500 max-w-xl">
                        {resolveCMPText("necessary_description", null, previewLangSimulator)}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {resolveCMPText("always_active_label", null, previewLangSimulator)}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {resolveCMPText("analytics_title", null, previewLangSimulator)}
                      </div>
                      <div className="text-[11px] text-slate-500 max-w-xl">
                        {resolveCMPText("analytics_description", null, previewLangSimulator)}
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="size-4 text-[#1868db] rounded focus:ring-[#1868db]" />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200/80">
                  <Button type="button" className="h-8 text-xs font-bold bg-[#1868db] text-white">
                    {resolveCMPText("save_preferences_label", null, previewLangSimulator)}
                  </Button>
                </div>
              </div>
            )}

            {previewPillarTab === "policy" && (
              <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4 animate-in fade-in">
                {(() => {
                  const policyText = resolvePolicyText("cookie_policy", previewLangSimulator)
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {policyText.title} &mdash; {selectedDomainForLang || "yourwebsite.com"}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0 font-mono">
                          {previewLangSimulator.toUpperCase()} Legal Document
                        </span>
                      </div>

                      <div className="space-y-2 bg-white p-4 rounded border border-slate-200">
                        <div className="text-xs font-bold text-slate-800">{policyText.about_heading}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{policyText.about_text}</p>

                        <div className="text-xs font-bold text-slate-800 pt-2">{policyText.table_heading}</div>
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                          <span>{resolveCMPText("cookie_column_label", null, previewLangSimulator)}: _ga</span>
                          <span>{resolveCMPText("duration_column_label", null, previewLangSimulator)}: 2 Years</span>
                          <span>{resolveCMPText("analytics_title", null, previewLangSimulator)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Action Save Bar */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="text-xs text-slate-500">
              Languages are automatically bundled and cached for fast, sub-millisecond edge rendering.
            </div>

            <Button
              type="button"
              onClick={handleSaveLangConfig}
              disabled={isSavingLangConfig || !selectedDomainForLang}
              className={cn(
                "h-8.5 text-xs font-bold px-5 cursor-pointer shadow-xs",
                hasMultilingual
                  ? "bg-[#1868db] hover:bg-[#1559be] text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              )}
            >
              {isSavingLangConfig ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : hasMultilingual ? (
                "Save Changes"
              ) : (
                "Upgrade to Business to Save"
              )}
            </Button>
          </div>
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
      {/* CANCEL SUBSCRIPTION MODAL                                                 */}
      {/* ========================================================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <Ban className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Cancel {PLANS[currentPlan].name} Subscription?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We&apos;re sorry to see you go. Please choose when you would like the cancellation to take effect.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Option 1: End of Billing Period (Recommended) */}
              <label
                onClick={() => setCancelImmediately(false)}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all",
                  !cancelImmediately
                    ? "bg-blue-50/50 border-blue-400/80 ring-1 ring-blue-400/30"
                    : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="cancelSchedule"
                  checked={!cancelImmediately}
                  onChange={() => setCancelImmediately(false)}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Cancel at end of current billing period</span>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">Recommended</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Keep your {PLANS[currentPlan].name} features, full quota limits, and premium capabilities active until{" "}
                    <span className="font-semibold text-slate-700">
                      {entitlements?.currentPeriodEnd
                        ? new Date(entitlements.currentPeriodEnd).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "the end of your current cycle"}
                    </span>
                    . You won&apos;t be billed again.
                  </p>
                </div>
              </label>

              {/* Option 2: Immediate */}
              <label
                onClick={() => setCancelImmediately(true)}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all",
                  cancelImmediately
                    ? "bg-rose-50/50 border-rose-400/80 ring-1 ring-rose-400/30"
                    : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="cancelSchedule"
                  checked={cancelImmediately}
                  onChange={() => setCancelImmediately(true)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">
                    Cancel immediately
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Reverts workspace to the Free Tier immediately. Premium quotas and features will be downgraded right away.
                  </p>
                </div>
              </label>
            </div>

            {cancelError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="h-9 text-xs font-semibold"
              >
                Keep Subscription
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Processing Cancellation...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
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
