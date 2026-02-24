"use server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"
import { serializeFirestoreData } from "@/lib/utils"

export async function createPaymentLink(idToken: string, amount: number, description: string) {
  if (amount < 1000) throw new Error("Số tiền tối thiểu 1,000 VND")
  if (!description.trim()) throw new Error("Mô tả không được trống")

  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)
  const merchantId = decoded.uid

  const merchantDoc = await adminDb.collection("merchants").doc(merchantId).get()
  if (!merchantDoc.exists) throw new Error("Merchant not found")
  if (merchantDoc.data()?.isFrozen) throw new Error("Merchant account is frozen")

  const linkId = uuidv4()
  await adminDb.collection("payment_links").doc(linkId).set({
    linkId, merchantId, amount,
    description: description.trim(),
    status: "UNPAID", paidByUserId: null,
    createdAt: FieldValue.serverTimestamp(),
  })

  return linkId
}

export async function getPaymentLinks(idToken: string, limitCount = 20) {
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)

  const snap = await adminDb.collection("payment_links")
    .where("merchantId", "==", decoded.uid)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get()

  return snap.docs.map(d => serializeFirestoreData(d.data()))
}

export async function getMerchantTransactions(idToken: string) {
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)

  const snap = await adminDb.collection("transactions")
    .where("receiverId", "==", decoded.uid)
    .orderBy("timestamp", "desc")
    .limit(50)
    .get()

  return snap.docs.map(d => serializeFirestoreData(d.data()))
}

export async function getMerchantAnalytics(idToken: string) {
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)

  const snap = await adminDb.collection("transactions")
    .where("receiverId", "==", decoded.uid)
    .where("status", "==", "COMPLETED")
    .orderBy("timestamp", "desc")
    .limit(200)
    .get()

  const txs = snap.docs.map(d => d.data())

  const totalRevenue = txs.reduce((s, t) => s + (t.netAmount || 0), 0)
  const totalFees = txs.reduce((s, t) => s + (t.fee || 0), 0)
  const txCount = txs.length
  const avgOrderValue = txCount > 0 ? Math.round(totalRevenue / txCount) : 0

  // Build daily revenue map (last 30 days bucketed by date string)
  const dailyMap = new Map<string, { revenue: number; count: number }>()
  txs.forEach(tx => {
    const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const existing = dailyMap.get(key) || { revenue: 0, count: 0 }
    dailyMap.set(key, { revenue: existing.revenue + (tx.netAmount || 0), count: existing.count + 1 })
  })

  const dailyRevenue = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, data]) => ({ date, revenue: data.revenue, count: data.count }))

  return serializeFirestoreData({
    totalRevenue,
    totalFees,
    txCount,
    avgOrderValue,
    dailyRevenue,
  })
}

export async function generateApiKey(idToken: string) {
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()
  const decoded = await adminAuth.verifyIdToken(idToken)

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const key = "sk_live_" + Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")

  await adminDb.collection("merchants").doc(decoded.uid).update({
    apiKey: key, apiKeyCreatedAt: FieldValue.serverTimestamp(),
  })

  return key
}
