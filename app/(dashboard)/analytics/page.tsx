"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getMerchantAnalytics } from "@/lib/actions/payments"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, ShoppingCart, Calculator, Loader2 } from "lucide-react"

interface AnalyticsData {
    totalRevenue: number
    totalFees: number
    txCount: number
    avgOrderValue: number
    dailyRevenue: { date: string; revenue: number; count: number }[]
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) return
            try {
                const idToken = await user.getIdToken()
                const analytics = await getMerchantAnalytics(idToken)
                setData(analytics)
            } catch (err) {
                console.error("Failed to load analytics:", err)
            } finally {
                setLoading(false)
            }
        })
        return () => unsub()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
    )

    const stats = [
        { title: "Tổng doanh thu", value: formatCurrency(data?.totalRevenue || 0), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { title: "Số giao dịch", value: String(data?.txCount || 0), icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10" },
        { title: "Giá trị TB", value: formatCurrency(data?.avgOrderValue || 0), icon: Calculator, color: "text-purple-400", bg: "bg-purple-500/10" },
        { title: "Tổng phí dịch vụ", value: formatCurrency(data?.totalFees || 0), icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10" },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Phân tích doanh thu</h1>
                <p className="text-slate-400 mt-1">Tổng quan hiệu suất kinh doanh của bạn</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
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

            {/* Revenue Over Time – Area Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="bg-slate-900/50 border-white/10 text-white">
                    <CardHeader><CardTitle className="text-white">Doanh thu theo ngày (14 ngày gần nhất)</CardTitle></CardHeader>
                    <CardContent>
                        {(data?.dailyRevenue?.length || 0) === 0 ? (
                            <p className="text-slate-500 text-center py-12">Chưa có dữ liệu giao dịch để hiển thị biểu đồ.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={data?.dailyRevenue}>
                                    <defs>
                                        <linearGradient id="colorAnalyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }}
                                        tickFormatter={v => { const parts = v.split('-'); return `${parts[1]}/${parts[2]}` }} />
                                    <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }}
                                        tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                        labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#10b981" }}
                                        formatter={(v: any) => [formatCurrency(v), "Doanh thu"]} />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorAnalyticsRevenue)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Transaction Count Bar Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <Card className="bg-slate-900/50 border-white/10 text-white">
                    <CardHeader><CardTitle className="text-white">Số lượng giao dịch theo ngày</CardTitle></CardHeader>
                    <CardContent>
                        {(data?.dailyRevenue?.length || 0) === 0 ? (
                            <p className="text-slate-500 text-center py-12">Chưa có dữ liệu.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data?.dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }}
                                        tickFormatter={v => { const parts = v.split('-'); return `${parts[1]}/${parts[2]}` }} />
                                    <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                                        labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#818cf8" }}
                                        formatter={(v: any) => [v, "Giao dịch"]} />
                                    <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
