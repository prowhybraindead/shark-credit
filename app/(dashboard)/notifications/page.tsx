"use client"
import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Bell, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) { setLoading(false); return }
            const q = query(
                collection(db, "merchants", user.uid, "notifications"),
                orderBy("createdAt", "desc")
            )
            const snap = onSnapshot(q, (snapshot) => {
                setNotifications(snapshot.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() })))
                setLoading(false)
            }, (error) => {
                console.error("🔥 Firebase Snapshot Error (notifications):", error)
                setLoading(false)
            })
            return () => snap()
        })
        return () => unsub()
    }, [])

    async function markRead(notif: any) {
        if (!notif.read) await updateDoc(notif.ref, { read: true })
        if (notif.type === "UPGRADE_INVOICE" && notif.invoiceId) {
            router.push(`/invoices/${notif.invoiceId}`)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-bold">Thông báo</h1>
            </div>
            {notifications.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">Không có thông báo mới.</p>}
            <div className="space-y-3">
                {notifications.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className={`border-white/10 cursor-pointer transition-all hover:bg-white/5 ${n.read ? "bg-slate-900/40" : "bg-slate-900/80 border-emerald-500/30"}`}
                            onClick={() => markRead(n)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-100">{n.message}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[9px]">{n.type}</Badge>
                                        {!n.read && <Badge className="text-[9px] bg-emerald-600">Mới</Badge>}
                                    </div>
                                </div>
                                {n.type === "UPGRADE_INVOICE" && <ArrowRight className="w-4 h-4 text-slate-500" />}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
