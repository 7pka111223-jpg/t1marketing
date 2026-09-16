import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";

const MUTABLE_STATUSES = ["SAVED", "IGNORED"];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const status = String(body.status ?? "");
  if (!MUTABLE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Unsupported status." }, { status: 400 });
  }
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, id, status });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { error } = await supabase.schema("marketing").from("opportunities").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, id, status });
}
