/**
 * UpFront - Open Source Local Session & User Provider
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

export async function getServerSession() {
  return {
    user: DEFAULT_USER,
    session: {
      id: "sess_local",
      userId: DEFAULT_USER.id,
      token: "local_dev_token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  }
}

export async function getCurrentUser() {
  return DEFAULT_USER
}
