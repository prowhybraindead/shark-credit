"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { auth } from "@/lib/firebase"
import { completeMerchantOnboarding } from "@/lib/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Building2 } from "lucide-react"

const SECTORS = ["Retail", "F&B", "Technology", "Education", "Healthcare", "Finance", "Entertainment", "Other"]

export default function OnboardingPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState("")
  const [sector, setSector] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!businessName.trim() || !sector) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error("Not authenticated")
      await completeMerchantOnboarding(idToken, businessName, sector)
      router.push("/dashboard")
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Thiết lập doanh nghiệp</h1>
          <p className="text-slate-400 mt-2">Cho chúng tôi biết về doanh nghiệp của bạn</p>
        </div>
        <div className="glass rounded-2xl p-8 space-y-4">
          <div>
            <Label className="text-slate-300">Tên doanh nghiệp</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)}
              className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Công ty TNHH Shark Tech" />
          </div>
          <div>
            <Label className="text-slate-300">Ngành nghề</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Chọn ngành nghề..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {SECTORS.map(s => (
                  <SelectItem key={s} value={s} className="text-white hover:bg-white/10">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Bắt đầu ngay
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
