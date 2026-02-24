import { redirect } from "next/navigation"
import { getServerMerchant } from "@/lib/actions/auth"
import { Sidebar } from "@/components/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const merchant = await getServerMerchant()
  if (!merchant) redirect("/login")

  return (
    <div className="flex">
      <Sidebar merchant={merchant} />
      <main className="flex-1 ml-64 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
