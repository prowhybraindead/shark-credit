"use client"
import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Loader2, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

export default function InvoicesListPage() {
    const router = useRouter()
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) { setLoading(false); return }
            const q = query(
                collection(db, "invoices"),
                where("merchantId", "==", user.uid),
                orderBy("createdAt", "desc")
            )
            const snap = onSnapshot(q, (snapshot) => {
                setInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
                setLoading(false)
            }, (error) => {
                console.error("🔥 Firebase Snapshot Error (invoices):", error)
                setLoading(false)
            })
            return () => snap()
        })
        return () => unsub()
    }, [])

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-bold">Hóa đơn nâng cấp</h1>
            </div>
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-slate-400 text-xs">ID</TableHead>
                            <TableHead className="text-slate-400 text-xs">Gói đích</TableHead>
                            <TableHead className="text-slate-400 text-xs">Số tiền</TableHead>
                            <TableHead className="text-slate-400 text-xs">Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">Chưa có hóa đơn.</TableCell></TableRow>
                        )}
                        {invoices.map(inv => (
                            <TableRow key={inv.id} className="border-white/5 hover:bg-white/5 cursor-pointer"
                                onClick={() => router.push(`/invoices/${inv.invoiceId}`)}>
                                <TableCell className="font-mono text-xs text-slate-400">{inv.invoiceId?.slice(0, 8)}...</TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px]">{inv.targetPlan}</Badge></TableCell>
                                <TableCell className="font-semibold text-sm">{formatCurrency(inv.amount || 0)}</TableCell>
                                <TableCell>
                                    <Badge className={`text-[9px] ${inv.status === "COMPLETED" ? "bg-emerald-600 text-white" :
                                            inv.status === "PAID" ? "bg-blue-600 text-white" :
                                                inv.status === "CANCELED" ? "bg-red-600 text-white" :
                                                    inv.status === "SUSPENDED" ? "bg-amber-600 text-white" :
                                                        inv.status === "REFUNDED" ? "bg-slate-500 text-white" :
                                                            "bg-slate-700 text-slate-300"
                                        }`}>
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
