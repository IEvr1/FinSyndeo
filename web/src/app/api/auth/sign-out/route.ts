import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neonAuth, authConfigured } from "@/lib/auth";

export async function POST() {
  if (authConfigured() && neonAuth) {
    await neonAuth.signOut();
  }
  const jar = await cookies();
  jar.delete("finsyndeo_dev_session");
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
