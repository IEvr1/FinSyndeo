import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await params;
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("stripe-signature") ?? request.headers.get("x-signature") ?? "";

  if (gateway === "stripe") {
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    const provided = signature.replace("sha256=", "");
    try {
      if (!timingSafeEqual(Buffer.from(expected), Buffer.from(provided.padEnd(expected.length, "0").slice(0, expected.length)))) {
        return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  const payload = JSON.parse(raw);
  const orderId = payload.data?.object?.id ?? payload.orderId;
  const idempotencyKey = payload.id ?? orderId;

  const db = getDb();
  const [payment] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.gatewayOrderId, orderId))
    .limit(1);

  if (payment?.status === "verified") {
    return NextResponse.json({ ok: true, replay: true });
  }

  if (payment) {
    await db
      .update(schema.payments)
      .set({ status: "verified", verifiedAt: new Date(), webhookEvidence: payload })
      .where(eq(schema.payments.id, payment.id));

    await db
      .update(schema.introductionRequests)
      .set({ paymentStatus: "verified" })
      .where(eq(schema.introductionRequests.id, payment.introductionRequestId));
  }

  return NextResponse.json({ ok: true, idempotencyKey });
}
