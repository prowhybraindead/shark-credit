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
          <h2 className="font-semibold">Ví dụ tích hợp REST API</h2>
        </div>
        <pre className="bg-black/40 rounded-xl p-4 text-sm text-green-400 overflow-x-auto">
{`// Tạo payment link từ server của bạn
const response = await fetch("https://[DOMAIN]/api/[MERCHANT_ID]/[BILL_ID]", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_SECRET_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 150000,
    description: "Order #12345",
    redirectUrl: "https://your-site.com/success",
    webhookUrl: "https://your-site.com/webhook"
  })
})

const { checkoutUrl } = await response.json()
// Redirect user to: checkoutUrl`}
        </pre>
      </div>

      {/* Webhook */}
      <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <Webhook className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold">Webhooks & Xác thực (HMAC)</h2>
          <Badge variant="success">Hoạt động</Badge>
        </div>
        <p className="text-slate-400 text-sm">
          Nhận thông báo tức thì khi có giao dịch mới. Webhook sẽ POST JSON payload đến <code>webhookUrl</code> của bạn.
          Payload sẽ được ký bằng <b>HMAC-SHA256</b> với khóa bí mật và đính kèm trong header <code>X-Shark-Signature</code>.
        </p>
        <div className="bg-black/40 rounded-xl p-4 mt-2">
          <pre className="text-sm text-yellow-400 overflow-x-auto">
{`// Payload Example
{
  "event": "payment_success",
  "billId": "12345",
  "merchantId": "MERCHANT_UID",
  "transactionId": "...",
  "amount": 150000,
  "fee": 1500,
  "netAmount": 148500,
  "status": "PAID",
  "timestamp": "2026-03-01T..."
}`}
          </pre>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 rounded-lg p-3 flex items-center gap-2 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <code className="text-sm text-emerald-300">payment_success</code>
          </div>
        </div>
      </div>
    </div>
  )
}
