"use client";
import { createClient } from "@/lib/supabase/client";
export function SignOutButton(){
  async function signOut(){
    const supabase=createClient();
    await supabase.auth.signOut();
    window.location.href="/login";
  }
  return <button className="btn btn-primary" onClick={signOut}>Sign out</button>;
}
