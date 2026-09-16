"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(){
  const [message,setMessage]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault(); const fd=new FormData(e.currentTarget); try{const supabase=createClient(); const {error}=await supabase.auth.signInWithPassword({email:String(fd.get('email')),password:String(fd.get('password'))}); if(error) throw error; window.location.href='/';}catch(err){setMessage(err instanceof Error?err.message:'Login failed');}}
  return <div className="login-wrap"><section className="login-brand"><div><div className="eyebrow" style={{color:'#a3a3a3'}}>TripleOneBars</div><h1 className="display login-title">Marketing<br/><span className="login-accent">Operating</span><br/>System</h1></div></section><section className="login-panel"><form className="login-card" onSubmit={submit}><div className="brand" style={{padding:0,marginBottom:40,color:'#171717'}}><div className="brand-mark" style={{color:'white'}}>111</div><div><div className="display brand-title">TripleOne</div><div className="brand-sub">Internal access</div></div></div><h2 className="display" style={{fontSize:44,margin:'0 0 10px'}}>Sign In</h2><p className="page-copy" style={{marginBottom:24}}>Private marketing operations dashboard.</p><div className="form-row"><label>Email</label><input name="email" type="email" required/></div><div className="form-row"><label>Password</label><input name="password" type="password" required/></div>{message&&<div className="note" style={{marginBottom:16}}>{message}</div>}<button className="btn btn-primary" style={{width:'100%'}}>Sign in</button></form></section></div>
}
