import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";

const BUCKET = "marketing-assets";
const SIGNED_URL_TTL_SECONDS = 300;

// Hands the operator short-lived download links so an approved post can be saved locally
// and uploaded by hand. Nothing here publishes anything.
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, files: [] });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: publication, error } = await supabase
    .schema("marketing")
    .from("publications")
    .select("id,content_item_id,creative_id")
    .eq("id", id)
    .single();
  if (error || !publication) return NextResponse.json({ error: error?.message ?? "Publication not found" }, { status: 404 });

  const candidates: { path: string; label: string }[] = [];

  if (publication.creative_id) {
    const { data: creative } = await supabase
      .schema("marketing")
      .from("creatives")
      .select("output_path,creative_type")
      .eq("id", publication.creative_id)
      .maybeSingle();
    if (creative?.output_path) {
      candidates.push({ path: creative.output_path, label: creative.creative_type ?? "CREATIVE" });
    }
  }

  if (publication.content_item_id) {
    const { data: usage } = await supabase
      .schema("marketing")
      .from("asset_usage")
      .select("assets(storage_path,asset_type)")
      .eq("content_item_id", publication.content_item_id);
    for (const row of usage ?? []) {
      const asset = (row as { assets?: { storage_path?: string; asset_type?: string } | null }).assets;
      if (asset?.storage_path) candidates.push({ path: asset.storage_path, label: asset.asset_type ?? "ASSET" });
    }
  }

  const unique = [...new Map(candidates.map((item) => [item.path, item])).values()];
  const files: { name: string; url: string }[] = [];
  for (const item of unique) {
    const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(item.path, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed?.signedUrl) continue;
    files.push({ name: `${item.label} · ${item.path.split("/").pop()}`, url: signed.signedUrl });
  }

  return NextResponse.json({ ok: true, files });
}
