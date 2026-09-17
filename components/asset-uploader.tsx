"use client";
import { ChangeEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, triggerConfig } from "@/lib/config";

export function AssetUploader(){
  const inputRef=useRef<HTMLInputElement | null>(null);
  const [cleared,setCleared]=useState(false);
  const [message,setMessage]=useState<string>("");
  const demo=isDemoMode();

  async function onFile(e: ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(!file) return;
    if(!cleared){ setMessage("Confirm marketing clearance before uploading."); e.target.value=""; return; }
    if(demo){ setMessage(`Demo: ${file.name} accepted as marketing-cleared.`); return; }
    try{
      setMessage("Uploading…");
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("Sign in required.");
      const ext=file.name.split('.').pop() ?? 'bin';
      const path=`${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const {error:uploadError}=await supabase.storage.from("marketing-assets").upload(path,file,{contentType:file.type,upsert:false});
      if(uploadError) throw uploadError;
      const type=file.type.startsWith("video/")?"VIDEO":file.type.startsWith("image/")?"PHOTO":file.type.startsWith("audio/")?"AUDIO":"GRAPHIC";
      const {data:assetRow,error:dbError}=await supabase.schema("marketing").from("assets").insert({storage_provider:"SUPABASE",storage_path:path,asset_type:type,mime_type:file.type,marketing_cleared:true,consent_status:"CLEARED",metadata:{original_name:file.name,size:file.size}}).select("id").single();
      if(dbError) throw dbError;
      if(triggerConfig.configured && assetRow){
        try{
          const { tasks } = await import("@trigger.dev/sdk");
          await tasks.trigger("media-ingestion", { assetId: assetRow.id });
        }catch(ingestError){
          console.error("[asset-uploader:media-ingestion]", ingestError);
          setMessage(`${file.name} stored. Indexing will retry when the workflow runner is reachable.`);
        }
      }
      setMessage(`${file.name} added to the asset library.`);
    }catch(error){ setMessage(error instanceof Error?error.message:"Upload failed."); }
    finally{ e.target.value=""; }
  }

  return <div className="card" style={{marginBottom:16}}>
    <div className="card-head"><div><div className="eyebrow">Asset intake</div><h2 className="display card-title" style={{marginTop:6}}>Add Real TripleOne Media</h2></div><button className="btn btn-primary" onClick={()=>inputRef.current?.click()}><Upload size={15}/>Choose file</button></div>
    <label style={{display:"flex",alignItems:"flex-start",gap:10,textTransform:"none",letterSpacing:0,fontSize:13,fontWeight:600,color:"#404040"}}><input style={{width:18,minHeight:18,marginTop:1}} type="checkbox" checked={cleared} onChange={(e: ChangeEvent<HTMLInputElement>)=>setCleared(e.target.checked)}/><span>I confirm TripleOneBars has permission to use this media for marketing, including the people visible or audible in it.</span></label>
    <input ref={inputRef} type="file" accept="video/*,image/*,audio/*" onChange={onFile} style={{display:"none"}}/>
    {message&&<div className="note" style={{marginTop:14}}>{message}</div>}
  </div>;
}
