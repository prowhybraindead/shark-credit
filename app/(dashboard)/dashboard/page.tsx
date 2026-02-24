"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, collection, query, where, orderBy, limit, onSnapshot as firestoreOnSnapshot } from "firebase/firestore"
import { formatCurrency, formatDate, getCategoryLabel } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, Link2, CheckCircle, Loader2, Utensils, ShoppingBag, Car, Play, Zap, ArrowLeftRight, CircleDollarSign } from "lucide-react"

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null)
  const [txs, setTxs] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return
      const mUnsub = onSnapshot(doc(db, "merchants", user.uid), snap => {
        setMerchant({ uid: user.uid, ...snap.data() })
        setLoading(false)
      })
      const txUnsub = onSnapshot(
        query(collection(db, "transactions"), where("receiverId", "==", user.uid), orderBy("timestamp", "desc"), limit(20)),
        snap => setTxs(snap.docs.map(d => d.data()))
      )
      const linkUnsub = onSnapshot(
        query(collection(db, "payment_links"), where("merchantId", "==", user.uid), orderBy("createdAt", "desc"), limit(5)),
        snap => setLinks(snap.docs.map(d => d.data()))
      )
      return () => { mUnsub(); txUnsub(); linkUnsub() }
    })
    return () => unsub()
  }, [])

  // Build chart data from transactions
  const chartData = (() => {
    const map = new Map<string, number>()
    txs.forEach(tx => {
      const date = tx.timestamp?.toDate?.() ? tx.timestamp.toDate() : new Date()
      const key = `${date.getMonth() + 1}/${date.getDate()}`
      map.set(key, (map.get(key) || 0) + tx.netAmount)
    })
    return Array.from(map.entries()).slice(-7).map(([date, revenue]) => ({ date, revenue }))
  })()

  const totalRevenue = txs.reduce((s, t) => s + (t.netAmount || 0), 0)
  const paidLinks = links.filter(l => l.status === "PAID").length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Xin chào, {merchant?.businessName} 👋</h1>
        <p className="text-slate-400 mt-1">Đây là tổng quan doanh nghiệp của bạn hôm nay</p>
      </div>

      {merchant?.isFrozen && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          ⚠️ Tài khoản merchant đang bị đình chỉ. Liên hệ SharkHub Admin.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Số dư khả dụng", value: formatCurrency(merchant?.balance || 0), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { title: "Tổng doanh thu (hiển thị)", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          { title: "Giao dịch thành công", value: String(txs.length), icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
          { title: "Link thanh toán đã tạo", value: String(links.length), icon: Link2, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-slate-900/50 border-white/10 text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader><CardTitle className="text-white">Doanh thu 7 ngày gần đây</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#10b981" }}
                formatter={(v: any) => [formatCurrency(v), "Doanh thu"]} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader><CardTitle className="text-white">Giao dịch gần đây</CardTitle></CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Chưa có giao dịch</p>
          ) : (
            <div className="space-y-2">
              {txs.slice(0, 8).map(tx => (
                <div key={tx.transactionId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.category === "FOOD_DRINK" ? "bg-green-500/10 text-green-500" :
                        tx.category === "SHOPPING" ? "bg-blue-500/10 text-blue-500" :
                          tx.category === "TRANSPORT" ? "bg-orange-500/10 text-orange-500" :
                            tx.category === "ENTERTAINMENT" ? "bg-purple-500/10 text-purple-500" :
                              tx.category === "BILL_UTILITIES" ? "bg-yellow-500/10 text-yellow-500" :
                                tx.category === "TRANSFER" ? "bg-gray-500/10 text-gray-400" :
                                  "bg-slate-500/10 text-slate-400"
                      }`}>
                      {tx.category === "FOOD_DRINK" ? <Utensils className="w-4 h-4" /> :
                        tx.category === "SHOPPING" ? <ShoppingBag className="w-4 h-4" /> :
                          tx.category === "TRANSPORT" ? <Car className="w-4 h-4" /> :
                            tx.category === "ENTERTAINMENT" ? <Play className="w-4 h-4" /> :
                              tx.category === "BILL_UTILITIES" ? <Zap className="w-4 h-4" /> :
                                tx.category === "TRANSFER" ? <ArrowLeftRight className="w-4 h-4" /> :
                                  <CircleDollarSign className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">{getCategoryLabel(tx.category)}</span>
                        <span className="text-[10px] text-slate-700">•</span>
                        <span className="text-xs text-slate-500">{tx.timestamp ? formatDate(tx.timestamp) : "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold text-sm">{formatCurrency(tx.netAmount)}</p>
                    <p className="text-xs text-slate-600">Phí: {formatCurrency(tx.fee)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
