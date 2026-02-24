"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { checkMerchantAndSession } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Zap, Shield, TrendingUp, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      const { redirect } = await checkMerchantAndSession(idToken)
      router.push(redirect)
    } catch (err: any) {
      toast({ title: "Đăng nhập thất bại", description: err.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const result = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await result.user.getIdToken()
      const { redirect } = await checkMerchantAndSession(idToken)
      router.push(redirect)
    } catch (err: any) {
      toast({
        title: isLogin ? "Đăng nhập thất bại" : "Đăng ký thất bại",
        description: isLogin ? "Email hoặc mật khẩu không đúng." : err.message,
        variant: "destructive"
      })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center p-16 flex-1 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-r border-white/10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold">SharkCredit</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Payment Gateway<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              cho Doanh nghiệp
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-12">Tích hợp thanh toán nhanh chóng, bảo mật và minh bạch.</p>
          <div className="space-y-4">
            {[
              { icon: Shield, text: "Bảo mật chuẩn PCI DSS" },
              { icon: TrendingUp, text: "Analytics thời gian thực" },
              { icon: Zap, text: "Tích hợp API trong 5 phút" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-slate-300">
                <item.icon className="w-5 h-5 text-emerald-400" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col justify-center items-center flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              SharkCredit
            </h1>
          </div>
          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-2">Đăng nhập doanh nghiệp</h2>
            <p className="text-slate-400 text-sm mb-6">Sử dụng tài khoản Google của doanh nghiệp</p>
            <Button onClick={handleGoogleLogin} disabled={loading}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold h-12 mb-6">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Đăng nhập với Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative text-center"><span className="bg-transparent px-2 text-slate-500 text-sm">hoặc</span></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300">Email doanh nghiệp</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    placeholder="you@company.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-300">Mật khẩu</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold h-12">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isLogin ? "Đăng nhập bằng Email" : "Đăng ký bằng Email"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
              </button>
            </div>

            <p className="text-slate-600 text-xs text-center mt-6">
              Dành riêng cho đối tác doanh nghiệp
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
