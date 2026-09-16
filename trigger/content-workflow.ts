import { task, wait } from "@trigger.dev/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export const contentWorkflow = task({
  id: "content-workflow",
  maxDuration: 900,
  run: async (payload: { contentId: string }) => {
    const supabase = createAdminClient();
    const approvalToken = await wait.createToken({ timeout: "7d" });

    // Store the waitpoint token on the content item so the approval API can complete it.
    const { data: item, error } = await supabase.from("content_items").select("brief").eq("id", payload.contentId).single();
    if (error || !item) throw new Error(error?.message ?? "Content item not found");
    const brief = (item.brief ?? {}) as Record<string, unknown>;
    await supabase.from("content_items").update({ brief: { ...brief, approval_token: approvalToken.id } }).eq("id", payload.contentId);

    const result = await wait.forToken<{ approved: boolean; feedback?: string | null; reloopTarget?: string | null }>(approvalToken);
    if (!result.ok) return { contentId: payload.contentId, status: "approval-timeout" };

    const { data: current } = await supabase.from("content_items").select("brief").eq("id", payload.contentId).single();
    const currentBrief = (current?.brief ?? {}) as Record<string, unknown>;
    delete currentBrief.approval_token;
    await supabase.from("content_items").update({ brief: currentBrief }).eq("id", payload.contentId);

    if (!result.output.approved) {
      return { contentId: payload.contentId, status: "needs-reloop", feedback: result.output.feedback, target: result.output.reloopTarget };
    }
    return { contentId: payload.contentId, status: "approved-for-next-stage" };
  },
});
