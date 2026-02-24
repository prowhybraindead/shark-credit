"use client"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Link2, QrCode, Key, LogOut, Zap, BarChart3, Bell, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Link2, label: "Payment Links", href: "/invoicing" },
  { icon: QrCode, label: "Dynamic QR", href: "/qr" },
  { icon: Key, label: "API & Webhooks", href: "/api-keys" },
  { icon: Receipt, label: "Hóa đơn", href: "/invoices" },
  { icon: Bell, label: "Thông báo", href: "/notifications" },
]

export function Sidebar({ merchant }: { merchant: any }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/10 flex flex-col z-30">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-sm">SharkCredit</p>
            <p className="text-xs text-slate-500 truncate max-w-[140px]">{merchant?.businessName}</p>
          </div>
        </div>
        <div className="mt-3">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold",
            merchant?.currentPlan === "ENTERPRISE" ? "bg-purple-500/20 text-purple-400" :
              merchant?.currentPlan === "PRO" ? "bg-blue-500/20 text-blue-400" :
                "bg-slate-500/20 text-slate-400"
          )}>
            {merchant?.currentPlan || "FREE"}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(item => (
          <button key={item.href} onClick={() => router.push(item.href)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              pathname === item.href
                ? "bg-emerald-500/20 text-emerald-400 font-medium"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <form action={logout}>
          <Button type="submit" variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-400 gap-3">
            <LogOut className="w-4 h-4" />Đăng xuất
          </Button>
        </form>
      </div>
    </aside>
  )
}
