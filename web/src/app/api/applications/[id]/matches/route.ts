import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session-server";
import { loadAuthContext, requireRole } from "@/lib/permissions";
import { computeMatches, getProviderPublicSummary } from "@/lib/services/applications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await loadAuthContext(user);
    requireRole(ctx, "applicant");
    const { id } = await params;
    const result = await computeMatches(id, user.id, user.email, user.name?.split(" ")[0]);
    const enriched = {
      ...result,
      matches: await Promise.all(
        (result.matches ?? []).map(async (m) => {
          const p = await getProviderPublicSummary(String(m.provider));
          return {
            ...m,
            providerCode: p?.code ?? String(m.provider),
            providerCountry: p?.country ?? "",
            institutionLegalName: p?.legalName ?? "",
          };
        })
      ),
    };
    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
