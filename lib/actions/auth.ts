"use server"
import { cookies } from "next/headers"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { redirect } from "next/navigation"
import { serializeFirestoreData } from "@/lib/utils"

export async function checkMerchantAndSession(idToken: string): Promise<{ redirect: string }> {
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)

  const expiresIn = 60 * 60 * 24 * 7 * 1000
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
  cookies().set("session", sessionCookie, {
    maxAge: expiresIn / 1000, httpOnly: true,
    secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
  })

  const merchantDoc = await adminDb.collection("merchants").doc(decoded.uid).get()
  if (!merchantDoc.exists) return { redirect: "/onboarding" }
  if (merchantDoc.data()?.isFrozen) {
    cookies().delete("session")
    return { redirect: "/login?error=frozen" }
  }
  return { redirect: "/dashboard" }
}

export async function logout() {
  "use server"
  cookies().delete("session")
  redirect("/login")
}

export async function getServerMerchant() {
  const session = cookies().get("session")?.value
  if (!session) return null
  try {
    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifySessionCookie(session, true)
    const adminDb = getAdminDb()
    const doc = await adminDb.collection("merchants").doc(decoded.uid).get()
    if (!doc.exists) return null
    return serializeFirestoreData({ uid: decoded.uid, ...doc.data() })
  } catch { return null }
}
