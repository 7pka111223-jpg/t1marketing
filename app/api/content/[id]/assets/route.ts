import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { isUuid } from "@/lib/marketing/conversion-ingest";

const USAGE_ROLES = ["SOURCE", "B_ROLL", "REFERENCE"];

// Links uploaded media to a content item. The posting kit reads these links to hand over the
// right footage, so this is what makes "Get media" return files.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const assetId = String(body.assetId ?? "");

  if (!isUuid(id)) return NextResponse.json({ error: "Unknown content item." }, { status: 400 });
  if (!isUuid(assetId)) return NextResponse.json({ error: "assetId must be a UUID." }, { status: 400 });
  const requestedRole = String(body.role ?? "SOURCE");
  const usageRole = USAGE_ROLES.includes(requestedRole) ? requestedRole : "SOURCE";

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, contentItemId: id, assetId, usageRole });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { error } = await supabase
    .schema("marketing")
    .from("asset_usage")
    .upsert(
      { content_item_id: id, asset_id: assetId, usage_role: usageRole },
      { onConflict: "content_item_id,asset_id,usage_role", ignoreDuplicates: true },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, contentItemId: id, assetId, usageRole });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const assetId = request.nextUrl.searchParams.get("assetId") ?? "";

  if (!isUuid(id)) return NextResponse.json({ error: "Unknown content item." }, { status: 400 });
  if (!isUuid(assetId)) return NextResponse.json({ error: "assetId must be a UUID." }, { status: 400 });

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, contentItemId: id, assetId });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { error } = await supabase
    .schema("marketing")
    .from("asset_usage")
    .delete()
    .eq("content_item_id", id)
    .eq("asset_id", assetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, contentItemId: id, assetId });
}
