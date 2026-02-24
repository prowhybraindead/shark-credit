"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { createPaymentLink } from "@/lib/actions/payments"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Copy, CheckCircle, Clock, Loader2, Link2 } from "lucide-react"

export default function InvoicingPage() {
  const [links, setLinks] = useState<any[]>([])
  const [amount, setAmount] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [newLinkId, setNewLinkId] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) return
      return onSnapshot(
        query(collection(db, "payment_links"), where("merchantId", "==", user.uid), orderBy("createdAt", "desc")),
        snap => setLinks(snap.docs.map(d => d.data()))
      )
    })
    return () => unsub()
  }, [])

  async function handleCreate() {
    if (!amount || !desc) { toast({ title: "Vui lòng điền đầy đủ", variant: "destructive" }); return }
    setLoading(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return
      const linkId = await createPaymentLink(idToken, Number(amount), desc)
      setNewLinkId(linkId)
      setAmount(""); setDesc("")
      toast({ title: "Tạo link thành công!" })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  function copyLink(linkId: string) {
    navigator.clipboard.writeText(`sharkcredit://pay/${linkId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Links</h1>
          <p className="text-slate-400 mt-1">Tạo link thanh toán để chia sẻ với khách hàng</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />Tạo Link mới
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader><DialogTitle>Tạo Payment Link</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {newLinkId ? (
                <div className="space-y-3">
                  <p className="text-green-400 font-medium">✓ Link đã được tạo!</p>
                  <div className="bg-white/5 rounded-lg p-3 flex items-center gap-2">
                    <code className="text-sm text-emerald-400 flex-1 truncate">sharkcredit://pay/{newLinkId}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyLink(newLinkId)}>
                      {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={() => setNewLinkId("")} variant="outline" className="w-full border-white/10">Tạo link khác</Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Số tiền (VND)</Label>
                    <Input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 bg-white/5 border-white/10 text-white" placeholder="150000" />
                    {amount && <p className="text-right text-xs text-slate-400 mt-1">{formatCurrency(Number(amount))}</p>}
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Input value={desc} onChange={e => setDesc(e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Thanh toán đơn hàng #12345" />
                  </div>
                  <Button onClick={handleCreate} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Tạo Link
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links Table */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có payment link nào</p>
          </div>
        ) : links.map((link, i) => (
          <motion.div key={link.linkId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass rounded-xl p-4 flex items-center gap-4 border border-white/10">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${link.status === "PAID" ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
              {link.status === "PAID" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-yellow-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{link.description}</p>
              <p className="text-xs text-slate-500">{link.createdAt ? formatDate(link.createdAt) : "—"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-lg">{formatCurrency(link.amount)}</p>
              <Badge variant={link.status === "PAID" ? "success" : "warning"} className="mt-1">
                {link.status === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => copyLink(link.linkId)} className="text-slate-400 hover:text-white">
              <Copy className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
