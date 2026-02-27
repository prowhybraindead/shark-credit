import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { merchantId: string; billId: string } },
) {
  try {
    const { merchantId, billId } = params;

    // 1. Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid Authorization header" },
        { status: 401, headers: corsHeaders },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const secretKey = process.env.SHARK_CREDIT_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "SHARK_CREDIT_SECRET_KEY is not set in environment variables.",
      );
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500, headers: corsHeaders },
      );
    }

    if (token !== secretKey) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Invalid secret key" },
        { status: 403, headers: corsHeaders },
      );
    }

    // 2. Payload Parsing
    const body = await req.json().catch(() => ({}));
    const { amount, description, redirectUrl, webhookUrl } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing 'amount'" },
        { status: 400, headers: corsHeaders },
      );
    }

    // 3. Firestore Transaction
    const adminDb = getAdminDb();
    const docId = `${merchantId}_${billId}`;
    const paymentLinkRef = adminDb.collection("payment_links").doc(docId);
    const paymentLinkSnap = await paymentLinkRef.get();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const checkoutUrl = `${baseUrl}/pay/${merchantId}/${billId}`;

    if (paymentLinkSnap.exists) {
      const existingData = paymentLinkSnap.data();
      // Prevent overwriting a completed payment
      if (existingData?.status === "PAID") {
        return NextResponse.json(
          { success: false, error: "Hóa đơn này đã được thanh toán trước đó." },
          { status: 400, headers: corsHeaders },
        );
      }
      // Idempotency: If called again but unpaid, just return the existing link
      return NextResponse.json(
        { success: true, checkoutUrl, message: "Hóa đơn đã tồn tại." },
        { status: 200, headers: corsHeaders },
      );
    }

    const merchantDoc = await adminDb
      .collection("merchants")
      .doc(merchantId)
      .get();

    if (!merchantDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Merchant not found" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (merchantDoc.data()?.isFrozen) {
      return NextResponse.json(
        { success: false, error: "Merchant account is frozen" },
        { status: 400, headers: corsHeaders },
      );
    }

    await paymentLinkRef.set({
      merchantId,
      billId,
      amount,
      description: description?.trim() || "",
      redirectUrl: redirectUrl || null,
      webhookUrl: webhookUrl || null,
      status: "UNPAID",
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. Response
    return NextResponse.json(
      { success: true, checkoutUrl },
      { status: 200, headers: corsHeaders },
    );
  } catch (error: any) {
    console.error("API POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
