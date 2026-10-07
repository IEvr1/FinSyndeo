/** Fail-closed integration adapters — no demo bypass flags. */

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_PROVIDER && process.env.EMAIL_FROM && process.env.EMAIL_API_KEY);
}

export function paymentConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_GATEWAY &&
      process.env.PAYMENT_SECRET_KEY &&
      process.env.PAYMENT_WEBHOOK_SECRET
  );
}

export function voiceConfigured(): boolean {
  return Boolean(process.env.VOICE_PROVIDER && process.env.VOICE_API_KEY);
}

export function malwareScannerConfigured(): boolean {
  return Boolean(process.env.MALWARE_SCANNER && process.env.MALWARE_SCANNER_API_KEY);
}

export function aiGatewayConfigured(): boolean {
  return Boolean(process.env.NEON_AI_GATEWAY_URL && process.env.NEON_AI_GATEWAY_API_KEY);
}

export type IntegrationGate = {
  ready: boolean;
  reason?: string;
};

export function gateEmail(): IntegrationGate {
  if (!emailConfigured()) {
    return { ready: false, reason: "Email provider credentials not configured." };
  }
  return { ready: true };
}

export function gatePayment(): IntegrationGate {
  if (!paymentConfigured()) {
    return { ready: false, reason: "Payment gateway not configured." };
  }
  return { ready: true };
}

export function gateVoice(): IntegrationGate {
  if (!voiceConfigured()) {
    return { ready: false, reason: "Voice provider not configured." };
  }
  return { ready: true };
}

export function gateDocumentExtraction(): IntegrationGate {
  if (!malwareScannerConfigured()) {
    return { ready: false, reason: "Malware scanner not configured." };
  }
  return { ready: true };
}

export async function sendEmail(params: {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<{ sent: boolean; error?: string }> {
  const gate = gateEmail();
  if (!gate.ready) return { sent: false, error: gate.reason };

  const provider = process.env.EMAIL_PROVIDER;
  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      return { sent: false, error: `Email API error: ${res.status}` };
    }
    return { sent: true };
  }

  return { sent: false, error: `Unsupported email provider: ${provider}` };
}

export async function createPaymentCheckout(params: {
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}): Promise<{ checkoutUrl?: string; orderId?: string; error?: string }> {
  const gate = gatePayment();
  if (!gate.ready) return { error: gate.reason };

  if (process.env.PAYMENT_GATEWAY === "stripe") {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYMENT_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price_data][currency]": params.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(params.amountMinor),
        "line_items[0][price_data][product_data][name]": "Additional introduction",
        "line_items[0][quantity]": "1",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/applicant/introductions?paid=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/applicant/introductions?cancelled=1`,
        ...Object.fromEntries(
          Object.entries(params.metadata).map(([k, v]) => [`metadata[${k}]`, v])
        ),
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error?.message ?? "Stripe error" };
    return { checkoutUrl: data.url, orderId: data.id };
  }

  return { error: "Unsupported payment gateway." };
}

export async function aiExtractField(params: {
  prompt: string;
  fieldSchema: Record<string, unknown>;
}): Promise<{ value?: unknown; confidence?: number; error?: string }> {
  if (!aiGatewayConfigured()) {
    return { error: "AI Gateway not configured." };
  }
  const res = await fetch(`${process.env.NEON_AI_GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEON_AI_GATEWAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a FinSyndeo intake assistant. Extract one typed field value. Respond with JSON only: {value, confidence}. Never activate rules or approve identity.",
        },
        { role: "user", content: `${params.prompt}\nSchema: ${JSON.stringify(params.fieldSchema)}` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return { error: `AI Gateway error: ${res.status}` };
  const data = await res.json();
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return { value: parsed.value, confidence: parsed.confidence };
  } catch {
    return { error: "Invalid AI response." };
  }
}
