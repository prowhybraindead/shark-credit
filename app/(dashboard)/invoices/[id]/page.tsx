"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { motion } from "framer-motion"
import { Loader2, Receipt, CheckCircle, Clock, QrCode, XCircle, PauseCircle, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default function InvoiceCheckoutPage() {
    const { id } = useParams<{ id: string }>()
    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showQR, setShowQR] = useState(false)

    useEffect(() => {
        // Real-time listener on invoice document
        const unsub = onSnapshot(doc(db, "invoices", id), (snap) => {
            if (snap.exists()) {
                setInvoice({ id: snap.id, ...snap.data() })
            }
            setLoading(false)
        }, (error) => {
            console.error("🔥 Firebase Snapshot Error (invoice detail):", error)
            setLoading(false)
        })
        return () => unsub()
    }, [id])

    function handleConfirmPayment() {
        setShowQR(true)
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
    if (!invoice) return <p className="text-center text-slate-500 py-16">Hóa đơn không tồn tại.</p>

    const qrPayload = JSON.stringify({
        type: "UPGRADE_INVOICE",
        invoiceId: invoice.invoiceId,
        amount: invoice.amount,
    })

    const isPaid = invoice.status === "PAID"
    const isCompleted = invoice.status === "COMPLETED"
    const isUnpaid = invoice.status === "UNPAID"
    const isTerminal = ["CANCELED", "SUSPENDED", "REFUNDED"].includes(invoice.status)

    const statusLabel: Record<string, string> = {
        UNPAID: "CHƯA THANH TOÁN", PAID: "ĐÃ THANH TOÁN", COMPLETED: "HOÀN TẤT",
        CANCELED: "ĐÃ HỦY", SUSPENDED: "TẠM NGƯNG", REFUNDED: "HOÀN TIỀN",
    }
    const statusColor: Record<string, string> = {
        COMPLETED: "bg-emerald-600 text-white", PAID: "bg-blue-600 text-white",
        UNPAID: "bg-slate-700 text-slate-300", CANCELED: "bg-red-600 text-white",
        SUSPENDED: "bg-amber-600 text-white", REFUNDED: "bg-slate-500 text-white",
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-bold">Hóa đơn nâng cấp</h1>
            </div>

            <Card className="bg-slate-900/60 border-white/10 text-slate-100">
                <CardHeader><CardTitle className="text-sm">Chi tiết hóa đơn</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Invoice ID</span><span className="font-mono text-xs">{invoice.invoiceId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Gói đích</span><Badge variant="outline">{invoice.targetPlan}</Badge></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số tiền</span><span className="font-bold text-white text-lg">{formatCurrency(invoice.amount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span>
                        <Badge className={statusColor[invoice.status] || "bg-slate-700 text-slate-300"}>
                            {statusLabel[invoice.status] || invoice.status}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {isCompleted && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-emerald-300">Gói đã được nâng cấp thành {invoice.targetPlan}!</p>
                </motion.div>
            )}

            {isPaid && !isCompleted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-blue-900/30 border border-blue-700/50 text-center">
                    <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="font-medium text-blue-300">Thanh toán thành công! Đang chờ Admin duyệt.</p>
                </motion.div>
            )}

            {isTerminal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`p-4 rounded-xl border text-center ${invoice.status === "CANCELED" ? "bg-red-900/30 border-red-700/50" :
                            invoice.status === "SUSPENDED" ? "bg-amber-900/30 border-amber-700/50" :
                                "bg-slate-800/30 border-slate-600/50"
                        }`}>
                    {invoice.status === "CANCELED" && <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />}
                    {invoice.status === "SUSPENDED" && <PauseCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />}
                    {invoice.status === "REFUNDED" && <Undo2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />}
                    <p className="font-medium text-slate-300">{statusLabel[invoice.status]}</p>
                </motion.div>
            )}

            {isUnpaid && (
                <div className="space-y-4">
                    {!showQR ? (
                        <Button onClick={handleConfirmPayment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6">
                            <QrCode className="w-5 h-5 mr-2" />Xác nhận thanh toán
                        </Button>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="bg-white p-6 rounded-2xl text-center">
                                <p className="text-slate-700 text-sm font-medium mb-4">Quét mã QR bằng StareWallet</p>
                                {/* QR Code rendered as SVG via a simple data-URI approach */}
                                <div className="mx-auto w-64 h-64 bg-white rounded-xl border-2 border-slate-200 flex items-center justify-center relative overflow-hidden">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrPayload)}`}
                                        alt="QR Code"
                                        className="w-full h-full"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-3 break-all font-mono">{qrPayload}</p>
                            </Card>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    )
}
