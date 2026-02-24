"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { auth } from "@/lib/firebase"
import { createPaymentLink } from "@/lib/actions/payments"
import { QRCodeCanvas } from "qrcode.react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, QrCode, RefreshCw } from "lucide-react"

export default function DynamicQRPage() {
  const [amount, setAmount] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [linkId, setLinkId] = useState("")

  async function generateQR() {
    if (!amount || Number(amount) < 1000) {
      toast({ title: "Số tiền tối thiểu 1,000 VND", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return
      const id = await createPaymentLink(idToken, Number(amount), desc || "Thanh toán nhanh")
      setLinkId(id)
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  const qrValue = linkId ? JSON.stringify({ type: "SHARK_PAY", linkId, amount: Number(amount) }) : ""

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold">Dynamic QR</h1>
        <p className="text-slate-400 mt-1">Tạo QR code một lần để khách hàng quét thanh toán</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div>
          <Label className="text-slate-300">Số tiền cần thu (VND)</Label>
          <Input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
            className="mt-1 bg-white/5 border-white/10 text-white text-right text-2xl font-bold h-14" placeholder="0" />
          {amount && <p className="text-right text-sm text-slate-400 mt-1">{formatCurrency(Number(amount))}</p>}
        </div>
        <div>
          <Label className="text-slate-300">Mô tả (tùy chọn)</Label>
          <Input value={desc} onChange={e => setDesc(e.target.value)}
            className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Thanh toán cafe..." />
        </div>
        <Button onClick={generateQR} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
          Tạo QR
        </Button>
      </div>

      <AnimatePresence>
        {linkId && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="glass rounded-2xl p-8 border border-white/10 flex flex-col items-center gap-4">
            <p className="text-sm text-emerald-400 font-medium">✓ QR đang hoạt động – chờ khách quét</p>
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeCanvas value={qrValue} size={240} level="H" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(Number(amount))}</p>
              <p className="text-slate-400 text-sm">{desc || "Thanh toán nhanh"}</p>
            </div>
            <Button onClick={() => { setLinkId(""); setAmount(""); setDesc("") }}
              variant="outline" className="border-white/10">
              <RefreshCw className="w-4 h-4 mr-2" />Tạo QR mới
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
