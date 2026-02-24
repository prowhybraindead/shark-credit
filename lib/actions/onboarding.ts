"use server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

const SECTORS = ["Retail", "F&B", "Technology", "Education", "Healthcare", "Finance", "Entertainment", "Other"]

export async function completeMerchantOnboarding(idToken: string, businessName: string, sector: string) {
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)
  const { uid, email } = decoded

  if (!SECTORS.includes(sector)) throw new Error("Invalid sector")

  const ref = adminDb.collection("merchants").doc(uid)
  const existing = await ref.get()
  if (existing.exists) throw new Error("Already onboarded")

  await ref.set({
    uid, email: email || "", businessName: businessName.trim(),
    sector, balance: 0, currentPlan: "FREE",
    isFrozen: false, createdAt: FieldValue.serverTimestamp(),
  })
}
