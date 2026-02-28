import { getAdminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, CheckCircle, Store, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function B2BCheckoutPage({
  params,
}: {
  params: { merchantId: string; billId: string };
}) {
  const { merchantId, billId } = params;
  const adminDb = getAdminDb();

  // 1. Fetch Payment Link
  const docId = `${merchantId}_${billId}`;
  const linkDoc = await adminDb.collection("payment_links").doc(docId).get();
  
  if (!linkDoc.exists) {
    return notFound();
  }
  
  const linkData = linkDoc.data()!;
  
  // 2. Fetch passing Merchant Data
  const merchantDoc = await adminDb.collection("merchants").doc(merchantId).get();
  const merchantData = merchantDoc.data() || {};
  const walletValid = !!merchantData.walletUid;

  const qrPayload = `sharkcredit://pay/${merchantId}_${billId}`;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass rounded-3xl p-8 space-y-8 border border-white/10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="text-center relative z-10 space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 mx-auto flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {merchantData.businessName || "Thanh toán hóa đơn"}
          </h1>
          <p className="text-slate-400 text-sm">Quét mã QR bằng ứng dụng Stare Wallet để thanh toán</p>
        </div>

        <div className="bg-white p-4 rounded-2xl mx-auto w-max relative z-10 ring-4 ring-white/5 shadow-2xl">
          <QRCodeSVG 
            value={qrPayload} 
            size={240} 
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Mã hóa đơn</span>
              <span className="font-mono text-slate-300">{billId}</span>
            </div>
            {linkData.description && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Nội dung</span>
                <span className="text-slate-300 text-right line-clamp-2 max-w-[180px]">
                  {linkData.description}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-slate-400">Tổng tiền</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(linkData.amount)}
              </span>
            </div>
          </div>

          {!walletValid && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-400">Cảnh báo hệ thống</AlertTitle>
              <AlertDescription className="text-red-300/80 text-xs mt-1">
                Merchant này chưa liên kết ví Stare Wallet tĩnh. Giao dịch sẽ không thể hoàn tất hoặc tiền sẽ được chuyển vào Kho bạc trung gian.
              </AlertDescription>
            </Alert>
          )}

          {linkData.status === "PAID" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
              <h2 className="text-xl font-bold text-white">Đã Thanh Toán</h2>
              <p className="text-slate-400 text-sm mt-2">Hóa đơn này đã được hoàn tất.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
