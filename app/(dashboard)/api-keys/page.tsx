"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { generateApiKey } from "@/lib/actions/payments"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Key, Copy, RefreshCw, Eye, EyeOff, Loader2, Webhook, Code2 } from "lucide-react"

export default function ApiKeysPage() {
  const [merchant, setMerchant] = useState<any>(null)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) return
      return onSnapshot(doc(db, "merchants", user.uid), snap => setMerchant({ uid: user.uid, ...snap.data() }))
    })
    return () => unsub()
  }, [])

  async function handleGenerate() {
    setLoading(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) return
      await generateApiKey(idToken)
      toast({ title: "Đã tạo API key mới!" })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  function copyKey() {
    if (!merchant?.apiKey) return
    navigator.clipboard.writeText(merchant.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Đã copy API key!" })
  }

  const maskedKey = merchant?.apiKey ? merchant.apiKey.slice(0, 12) + "•".repeat(32) + merchant.apiKey.slice(-4) : ""

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">API & Webhooks</h1>
        <p className="text-slate-400 mt-1">Tích hợp SharkCredit vào hệ thống của bạn</p>
      </div>

      {/* API Key Card */}
      <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold">API Key</h2>
            <p className="text-slate-400 text-sm">Dùng để xác thực các request từ server</p>
          </div>
        </div>

        {merchant?.apiKey ? (
          <div className="space-y-3">
            <div className="bg-black/30 rounded-lg p-3 flex items-center gap-2 font-mono text-sm">
              <span className="flex-1 text-emerald-400 truncate">
                {showKey ? merchant.apiKey : maskedKey}
              </span>
              <button onClick={() => setShowKey(!showKey)} className="text-slate-400 hover:text-white p-1">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={copyKey} className="text-slate-400 hover:text-white p-1">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Badge variant="success">Live</Badge>
              {merchant.apiKeyCreatedAt && <span className="text-xs text-slate-500">Tạo lúc: {merchant.apiKeyCreatedAt?.toDate?.().toLocaleDateString("vi-VN")}</span>}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Chưa có API key. Nhấn "Tạo Key mới" để bắt đầu.</p>
        )}

        <Button onClick={handleGenerate} disabled={loading} variant="outline" className="border-white/10">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {merchant?.apiKey ? "Tạo key mới (sẽ vô hiệu key cũ)" : "Tạo API Key"}
        </Button>
      </div>

      {/* Code Example */}
      <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold">Ví dụ tích hợp</h2>
        </div>
        <pre className="bg-black/40 rounded-xl p-4 text-sm text-green-400 overflow-x-auto">
{`// Tạo payment link từ server của bạn
const response = await fetch("https://api.sharkcredit.vn/v1/links", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 150000,
    description: "Order #12345",
    webhook_url: "https://your-site.com/webhook"
  })
})

const { linkId, qrCode } = await response.json()
// Redirect user to: https://pay.sharkcredit.vn/\${linkId}`}
        </pre>
      </div>

      {/* Webhook */}
      <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <Webhook className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold">Webhooks</h2>
          <Badge variant="secondary">Sắp ra mắt</Badge>
        </div>
        <p className="text-slate-400 text-sm">
          Nhận thông báo tức thì khi có giao dịch mới. Webhook sẽ POST JSON payload đến URL của bạn.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {["payment.completed", "payment.failed", "refund.issued", "account.frozen"].map(event => (
            <div key={event} className="bg-white/5 rounded-lg p-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <code className="text-sm text-slate-300">{event}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
