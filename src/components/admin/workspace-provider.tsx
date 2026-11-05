import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DemoWorkspace, Role, ContentRecord, Inquiry, MediaRecord, Revision, Audit, AnalyticsEvent, Subscriber } from "@/lib/workspace-model";
type Config={configured:true}; type Session={access_token:string;refresh_token:string;expires_at:number;user:{id:string}};
const KEY="aether-admin-session-v1", empty=():DemoWorkspace=>({records:[],inquiries:[],media:[],revisions:[],audit:[],analytics:[],subscribers:[]});
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const err=(x:any)=>String(x?.message||x?.msg||x?.error_description||x?.error||"Supabase request failed");
async function getConfig():Promise<Config>{
 const r=await fetch("/api/admin-config",{method:"GET",headers:{Accept:"application/json"},cache:"no-store"});
 const payload=await r.json().catch(()=>null);
 if(!r.ok)throw Error(typeof payload?.message==="string"?payload.message:"Admin configuration request failed with status "+r.status+".");
 if(payload?.configured!==true||typeof payload?.url!=="string")throw Error("Admin configuration response is incomplete. Check the Cloudflare Supabase bindings.");
 return {configured:true};
}
async function call(_c:Config,t:string,path:string,method="GET",body?:unknown){
 const r=await fetch("/api/admin-supabase"+path,{method,headers:{Authorization:"Bearer "+t,"Content-Type":"application/json",...(method!=="GET"?{Prefer:"return=representation"}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const data=r.status===204?null:await r.json().catch(()=>null);if(!r.ok)throw Error(err(data));return data;
}
function mapRecord(r:any):ContentRecord{return{id:r.id,module:r.module,slug:r.slug,title:r.title,body:r.body||"",category:r.category||"",publication:r.publication,availability:r.availability,position:r.position||0,scheduledAt:r.scheduled_at||"",seoTitle:r.seo_title||"",seoDescription:r.seo_description||"",canonical:r.canonical||"",noindex:!!r.noindex,updatedAt:r.updated_at||"",fields:Object.fromEntries(Object.entries(r.fields||{}).map(([k,v])=>[k,typeof v==="string"?v:JSON.stringify(v)]))};}
function mapInquiry(r:any,notes:any[]=[]):Inquiry{return{id:r.id,reference:r.reference,kind:r.kind==="demo"?"demo":"contact",name:r.contact_name,email:r.email,company:r.company,country:r.country,category:r.category||"",automation:r.automation_slug||"",message:r.message,requirements:r.requirements||"",consent:true,status:r.status,createdAt:r.created_at,notes:notes.filter(n=>n.inquiry_id===r.id).map(n=>({text:n.body,at:n.created_at})),assignedTo:r.assigned_to||"",followUp:r.follow_up||""};}
type Ctx={data:DemoWorkspace;ready:boolean;authenticated:boolean;role:Role;authError:string;storageError:string;setRole:(r:Role)=>void;signIn:(e:string,p:string)=>Promise<void>;signOut:()=>Promise<void>;sendPasswordRecovery:(e:string)=>Promise<void>;validateRecoverySession:()=>Promise<boolean>;updatePassword:(p:string)=>Promise<void>;save:(r:ContentRecord)=>Promise<void>;remove:(id:string)=>Promise<void>;restore:(id:string)=>Promise<void>;addInquiry:(r:Inquiry)=>Promise<void>;updateInquiry:(r:Inquiry)=>Promise<void>;addMedia:(file:File,altText?:string)=>Promise<void>;updateMedia:(r:MediaRecord)=>Promise<void>;removeMedia:(id:string)=>Promise<void>;addSubscriber:(email:string,consentConfirmed:boolean)=>Promise<void>;updateSubscriberStatus:(id:string,status:"subscribed"|"unsubscribed")=>Promise<void>;reset:()=>Promise<void>};
const Context=createContext<Ctx|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [cfg,setCfg]=useState<Config|null>(null),[session,setSession]=useState<Session|null>(null),[data,setData]=useState(empty),[role,setRole]=useState<Role>("Viewer"),[ready,setReady]=useState(false),[authenticated,setAuthenticated]=useState(false),[authError,setAuthError]=useState(""),[storageError,setStorageError]=useState("");
 const store=(s:Session)=>{localStorage.setItem(KEY,JSON.stringify(s));setSession(s);};
 async function refresh(c:Config,s:Session){const r=await fetch("/api/admin-supabase/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:s.refresh_token})});const x=await r.json();if(!r.ok)throw Error(err(x));const n={access_token:x.access_token,refresh_token:x.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(x.expires_in||3600),user:x.user};store(n);return n;}
 async function fresh(){if(!cfg||!session)throw Error("Please sign in.");return session.expires_at<Math.floor(Date.now()/1000)+60?refresh(cfg,session):session;}
 async function load(c:Config,s:Session){
  const [rs,is,ns,ms,vs,as,es,subs]=await Promise.all([
   call(c,s.access_token,"/rest/v1/content_records?select=*&order=position.asc"),
   call(c,s.access_token,"/rest/v1/inquiries?select=*&order=created_at.desc"),
   call(c,s.access_token,"/rest/v1/inquiry_notes?select=*&order=created_at.asc").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/media_assets?select=*&order=filename.asc").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/content_revisions?select=*&order=created_at.desc").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/audit_logs?select=*&order=created_at.desc&limit=100").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/analytics_events?select=*&order=created_at.desc&limit=500").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/newsletter_subscribers?select=*&order=created_at.desc").catch(()=>[])
  ]);
  const revisions:Revision[]=(vs||[]).map((v:any)=>{const snap=v.snapshot?.record||v.snapshot||{};return{id:v.id,record:snap.module?mapRecord(snap):{id:v.record_id,module:v.module,slug:"",title:"Previous version",body:"",category:"",publication:"Draft",availability:"Planned",position:0,scheduledAt:"",seoTitle:"",seoDescription:"",canonical:"",noindex:false,updatedAt:"",fields:{}},at:v.created_at,action:v.action==="DELETE"?"Deleted version":"Updated version"};});
  const media:MediaRecord[]=(ms||[]).map((m:any)=>({id:m.id,name:m.filename,type:m.content_type,size:Number(m.file_size),alt:m.alt_text||"",bucketId:m.bucket_id,objectPath:m.object_path,url:m.is_public?location.origin+"/api/admin-supabase/storage/v1/object/public/"+m.bucket_id+"/"+m.object_path:""}));
  const analytics:AnalyticsEvent[]=(es||[]).map((e:any)=>({id:e.id,eventType:e.event_type,pagePath:e.page_path,automationSlug:e.automation_slug||"",consent:true,createdAt:e.created_at}));
  const subscribers:Subscriber[]=(subs||[]).map((s:any)=>({id:s.id,email:s.email,status:s.status,consent:true,consentAt:s.consent_at,source:s.source||"admin",createdAt:s.created_at}));
  setData({records:(rs||[]).map(mapRecord),inquiries:(is||[]).map((i:any)=>mapInquiry(i,ns||[])),media,revisions,audit:(as||[]).map((a:any)=>({id:a.id,action:a.action,title:a.module||a.record_id||"Content update",at:a.created_at,changedFields:Array.isArray(a.details?.changed_fields)?a.details.changed_fields:[]})),analytics,subscribers});
  setAuthenticated(true);setStorageError("");
 }
 async function adminRole(c:Config,s:Session){const u=await call(c,s.access_token,"/auth/v1/user");const rows=await call(c,s.access_token,"/rest/v1/user_roles?select=role&user_id=eq."+encodeURIComponent(u.id));if(!rows?.length)throw Error("This account has no AETHER-TRADE administrator role.");return rows[0].role as Role;}
 useEffect(()=>{let active=true;(async()=>{try{const c=await getConfig();if(!active)return;setCfg(c);const raw=localStorage.getItem(KEY);if(!raw){setReady(true);return;}let s=JSON.parse(raw) as Session;if(s.expires_at<Math.floor(Date.now()/1000)+60)s=await refresh(c,s);const r=await adminRole(c,s);if(!active)return;setRole(r);await load(c,s);}catch(e){localStorage.removeItem(KEY);if(active){setAuthenticated(false);setAuthError(err(e));setStorageError(err(e));}}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 async function signIn(email:string,password:string){const c=cfg||await getConfig();setCfg(c);setAuthError("");const r=await fetch("/api/admin-supabase/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password})});const x=await r.json();if(!r.ok)throw Error(err(x));const s:Session={access_token:x.access_token,refresh_token:x.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(x.expires_in||3600),user:x.user};store(s);try{setRole(await adminRole(c,s));await load(c,s);}catch(e){localStorage.removeItem(KEY);setSession(null);setAuthenticated(false);throw e;}}
 async function signOut(){if(cfg&&session)await call(cfg,session.access_token,"/auth/v1/logout","POST").catch(()=>null);localStorage.removeItem(KEY);setSession(null);setAuthenticated(false);setData(empty());setRole("Viewer");}
 async function sendPasswordRecovery(email:string){const c=cfg||await getConfig();const r=await fetch("/api/admin-supabase/auth/v1/recover?redirect_to="+encodeURIComponent(location.origin+"/reset-password"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim()})});const x=await r.json().catch(()=>null);if(!r.ok)throw Error(err(x));}
 const validateRecoverySession=useCallback(async()=>{try{const hash=new URLSearchParams(window.location.hash.slice(1));const token=hash.get("access_token");if(!token||hash.get("type")!=="recovery")return false;const c=await getConfig();await call(c,token,"/auth/v1/user");return true;}catch{return false;}},[]);
 async function updatePassword(password:string){if(password.length<8)throw Error("Use a password with at least 8 characters.");const hash=new URLSearchParams(window.location.hash.slice(1));const token=hash.get("access_token");if(!token||hash.get("type")!=="recovery")throw Error("Recovery link is invalid or expired. Request a new link.");const c=cfg||await getConfig();await call(c,token,"/auth/v1/user");await call(c,token,"/auth/v1/user","PUT",{password});history.replaceState(null,"",location.pathname+location.search);}
 async function write(path:string,method:string,body?:unknown){const s=await fresh();return call(cfg!,s.access_token,path,method,body);}
 async function refreshAfterWrite(){try{const s=await fresh();await load(cfg!,s);}catch(e){setStorageError("Your change was saved, but the workspace could not refresh: "+err(e));}}
 async function save(r:ContentRecord){const id=uuid(r.id)?r.id:crypto.randomUUID();const row={id,module:r.module,slug:r.slug,title:r.title,body:r.body,category:r.category,fields:r.fields,publication:r.publication,availability:r.availability,position:r.position,scheduled_at:r.scheduledAt||null,seo_title:r.seoTitle,seo_description:r.seoDescription,canonical:r.canonical,noindex:r.noindex};await write(data.records.some(x=>x.id===id)?"/rest/v1/content_records?id=eq."+id:"/rest/v1/content_records",data.records.some(x=>x.id===id)?"PATCH":"POST",row);setData(old=>({...old,records:[...old.records.filter(x=>x.id!==id),{...r,id,updatedAt:new Date().toISOString()}]}));void refreshAfterWrite();}
 async function remove(id:string){if(!uuid(id))throw Error("Invalid database record.");await write("/rest/v1/content_records?id=eq."+id,"DELETE");setData(old=>({...old,records:old.records.filter(x=>x.id!==id)}));void refreshAfterWrite();}
 async function restore(id:string){const v=data.revisions.find(x=>x.id===id);if(!v)throw Error("Revision not found.");await save({...v.record,publication:"Draft"});}
 async function addInquiry(_r:Inquiry){throw Error("Inquiries are created through the public website forms.");}
 async function updateInquiry(r:Inquiry){if(!uuid(r.id))throw Error("Invalid inquiry.");const previous=data.inquiries.find(x=>x.id===r.id);await write("/rest/v1/inquiries?id=eq."+r.id,"PATCH",{status:r.status,assigned_to:uuid(r.assignedTo)?r.assignedTo:null,follow_up:r.followUp||null});const added=(r.notes||[]).slice(previous?.notes.length||0);for(const note of added)await write("/rest/v1/inquiry_notes","POST",{inquiry_id:r.id,body:note.text});setData(old=>({...old,inquiries:old.inquiries.map(x=>x.id===r.id?r:x)}));void refreshAfterWrite();}
 async function addMedia(file:File,altText=""){
  if(!session||!cfg)throw Error("Please sign in.");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size<=0||file.size>2097152)throw Error("Only JPG, PNG or WebP images up to 2 MB are accepted.");
  const s=await fresh();const user=await call(cfg,s.access_token,"/auth/v1/user");
  const safeName=file.name.normalize("NFKD").replace(/[^A-Za-z0-9._~-]+/g,"-").replace(/-+/g,"-").replace(/^[-.]+|[-.]+$/g,"").slice(0,100)||"image";
  const objectPath=user.id+"/"+crypto.randomUUID()+"-"+safeName;
  const upload=await fetch("/api/admin-supabase/storage/v1/object/website-media/"+objectPath,{method:"POST",headers:{Authorization:"Bearer "+s.access_token,"Content-Type":file.type,"x-upsert":"false"},body:file});
  const uploaded=await upload.json().catch(()=>null);if(!upload.ok)throw Error(err(uploaded));
  try{
   const rows=await call(cfg,s.access_token,"/rest/v1/media_assets","POST",{bucket_id:"website-media",object_path:objectPath,filename:file.name,content_type:file.type,file_size:file.size,alt_text:altText.trim().slice(0,500),owner_id:user.id,is_public:true});
   const row=Array.isArray(rows)?rows[0]:rows;if(!row?.id)throw Error("Image uploaded but media metadata was not returned.");
   const media:MediaRecord={id:row.id,name:row.filename,type:row.content_type,size:Number(row.file_size),alt:row.alt_text||"",bucketId:row.bucket_id,objectPath:row.object_path,url:location.origin+"/api/admin-supabase/storage/v1/object/public/"+row.bucket_id+"/"+row.object_path};
   setData(old=>({...old,media:[...old.media,media]}));void refreshAfterWrite();
  }catch(e){
   await fetch("/api/admin-supabase/storage/v1/object/website-media",{method:"DELETE",headers:{Authorization:"Bearer "+s.access_token,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[objectPath]})}).catch(()=>null);
   throw e;
  }
 }
 async function updateMedia(r:MediaRecord){if(!uuid(r.id))throw Error("Invalid media record.");await write("/rest/v1/media_assets?id=eq."+r.id,"PATCH",{filename:r.name,alt_text:r.alt});setData(old=>({...old,media:old.media.map(x=>x.id===r.id?r:x)}));void refreshAfterWrite();}
 async function removeMedia(id:string){if(!uuid(id))throw Error("Invalid media record.");const row=data.media.find(x=>x.id===id);if(!row||row.bucketId!=="website-media"||!row.objectPath)throw Error("Media object reference is invalid.");const s=await fresh();const deleted=await fetch("/api/admin-supabase/storage/v1/object/website-media",{method:"DELETE",headers:{Authorization:"Bearer "+s.access_token,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[row.objectPath]})});const payload=await deleted.json().catch(()=>null);if(!deleted.ok)throw Error(err(payload));await call(cfg!,s.access_token,"/rest/v1/media_assets?id=eq."+id,"DELETE");setData(old=>({...old,media:old.media.filter(x=>x.id!==id)}));void refreshAfterWrite();}
 async function reset(){throw Error("Live CMS data cannot be reset from this panel.");}
 const value=useMemo(()=>({data,ready,authenticated,role,authError,storageError,setRole,signIn,signOut,sendPasswordRecovery,validateRecoverySession,updatePassword,save,remove,restore,addInquiry,updateInquiry,addMedia,updateMedia,removeMedia,reset}),[data,ready,authenticated,role,authError,storageError,session,cfg]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspace(){const c=useContext(Context);if(!c)throw new Error("Workspace provider is missing");return c;}
