import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileNav } from "@/components/mobile-nav";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { ToastProvider } from "@/components/toast";

// Every dashboard route reads the Supabase session cookie and RLS-scoped data.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = isDemoMode();
  if (!demo) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) redirect("/login");
    const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
    if (!member) redirect("/unauthorized");
  }
  return <ToastProvider><div className="shell"><Sidebar demo={demo}/><main className="main"><Topbar/><div className="content">{children}</div></main><MobileNav/></div></ToastProvider>;
}
