"use client"

/**
 * UpFront - Open Source Client Auth Mock
 *
 * Auth is disabled for open source self-hosting. Always returns the default local administrator user.
 */

export const DEFAULT_USER = {
  id: "usr_local_admin",
  email: "admin@upfront.local",
  name: "Admin",
  role: "owner",
  image: null,
  twoFactorEnabled: false,
}

const mockSessionData = {
  data: {
    user: DEFAULT_USER,
    session: {
      id: "sess_local",
      userId: DEFAULT_USER.id,
      token: "local_dev_token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    },
  },
  isPending: false,
  error: null,
}

export const authClient: any = {
  useSession: () => mockSessionData,
  signIn: {
    email: async () => ({ data: mockSessionData.data, error: null }),
  },
  signUp: {
    email: async () => ({ data: mockSessionData.data, error: null }),
  },
  signOut: async () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard"
    }
    return { data: null, error: null }
  },
  twoFactor: {
    enable: async () => ({ data: { backupCodes: [] }, error: null }),
    disable: async () => ({ data: null, error: null }),
    verifyTotp: async () => ({ data: null, error: null }),
  },
}

export const useSession = authClient.useSession
export const signIn = authClient.signIn
export const signUp = authClient.signUp
export const signOut = authClient.signOut
