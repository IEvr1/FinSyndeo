import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { aiExtractField } from "@/lib/integrations";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { prompt, answer, field } = await request.json();
  const result = await aiExtractField({
    prompt: `${prompt}\nAnswer: ${answer}`,
    fieldSchema: { field, type: "string" },
  });
  if (result.error) return NextResponse.json(result, { status: 503 });
  return NextResponse.json(result);
}
