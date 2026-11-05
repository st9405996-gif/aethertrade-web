import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DemoWorkspace, Role, ContentRecord, Inquiry, MediaRecord, Revision, Audit, AnalyticsEvent, Subscriber } from "@/lib/workspace-model";
type Config={configured:true}; type Session={access_token:string;refresh_token:string;expires_at:number;user:{id:string}};
type JsonRow = Record<string, unknown>;
const row = (value: unknown): JsonRow => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRow : {};
const text = (source: JsonRow, key: string, fallback = ""): string => typeof source[key] === "string" ? source[key] as string : fallback;
const numeric = (source: JsonRow, key: string, fallback = 0): number => typeof source[key] === "number" ? source[key] as number : Number(source[key]) || fallback;
const KEY="aether-admin-session-v1", empty=():DemoWorkspace=>({records:[],inquiries:[],media:[],revisions:[],audit:[],analytics:[],subscribers:[]});
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const err=(value:unknown)=>{const x=row(value);return String(x.message??x.msg??x.error_description??x.error??"Supabase request failed");};
function mapRecord(source:JsonRow):ContentRecord {
 const fields=row(source.fields);
 return {
  id:text(source,"id"),
  module:text(source,"module") as ContentRecord["module"],
  slug:text(source,"slug"),
  title:text(source,"title"),
  body:text(source,"body"),
  category:text(source,"category"),
  publication:text(source,"publication") as ContentRecord["publication"],
  availability:text(source,"availability") as ContentRecord["availability"],
  position:numeric(source,"position"),
  scheduledAt:text(source,"scheduled_at"),
  seoTitle:text(source,"seo_title"),
  seoDescription:text(source,"seo_description"),
  canonical:text(source,"canonical"),
  noindex:source.noindex===true,
  updatedAt:text(source,"updated_at"),
  fields:Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,typeof value==="string"?value:JSON.stringify(value)??""])),
 };
}
function mapInquiry(source:JsonRow,notes:JsonRow[]=[]):Inquiry {
 return {
  id:text(source,"id"),
  reference:text(source,"reference"),
  kind:text(source,"kind")==="demo"?"demo":"contact",
  name:text(source,"contact_name"),
  email:text(source,"email"),
  company:text(source,"company"),
  country:text(source,"country"),
  category:text(source,"category"),
  automation:text(source,"automation_slug"),
  message:text(source,"message"),
  requirements:text(source,"requirements"),
  consent:true,
  status:text(source,"status") as Inquiry["status"],
  createdAt:text(source,"created_at"),
  notes:notes.filter(note=>note.inquiry_id===source.id).map(note=>({text:text(note,"body"),at:text(note,"created_at")})),
  assignedTo:text(source,"assigned_to"),
  followUp:text(source,"follow_up"),
 };
}
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
  const revisionRows=Array.isArray(vs)?vs.map(row):[];
  const revisions:Revision[]=revisionRows.map(v=>{const snapshot=row(row(v.snapshot).record??v.snapshot);return{id:text(v,"id"),record:text(snapshot,"module")?mapRecord(snapshot):{id:text(v,"record_id"),module:text(v,"module") as ContentRecord["module"],slug:"",title:"Previous version",body:"",category:"",publication:"Draft",availability:"Planned",position:0,scheduledAt:"",seoTitle:"",seoDescription:"",canonical:"",noindex:false,updatedAt:"",fields:{}},at:text(v,"created_at"),action:text(v,"action")==="DELETE"?"Deleted version":"Updated version"};});
  const mediaRows=Array.isArray(ms)?ms.map(row):[];
  const media:MediaRecord[]=mediaRows.map(m=>({id:text(m,"id"),name:text(m,"filename"),type:text(m,"content_type"),size:numeric(m,"file_size"),alt:text(m,"alt_text"),bucketId:text(m,"bucket_id"),objectPath:text(m,"object_path"),url:m.is_public===true?location.origin+"/api/admin-supabase/storage/v1/object/public/"+text(m,"bucket_id")+"/"+text(m,"object_path"):""}));
  const analyticsRows=Array.isArray(es)?es.map(row):[];
  const analytics:AnalyticsEvent[]=analyticsRows.map(e=>({id:text(e,"id"),eventType:text(e,"event_type"),pagePath:text(e,"page_path"),automationSlug:text(e,"automation_slug"),consent:true,createdAt:text(e,"created_at")}));
  const subscriberRows=Array.isArray(subs)?subs.map(row):[];
  const subscribers:Subscriber[]=subscriberRows.map(s=>({id:text(s,"id"),email:text(s,"email"),status:text(s,"status") as Subscriber["status"],consent:true,consentAt:text(s,"consent_at"),source:text(s,"source","admin"),createdAt:text(s,"created_at")}));
  const recordRows=Array.isArray(rs)?rs.map(row):[];
  const inquiryRows=Array.isArray(is)?is.map(row):[];
  const noteRows=Array.isArray(ns)?ns.map(row):[];
  const auditRows=Array.isArray(as)?as.map(row):[];
  setData({records:recordRows.map(mapRecord),inquiries:inquiryRows.map(i=>mapInquiry(i,noteRows)),media,revisions,audit:auditRows.map(a=>{const details=row(a.details);const changedFields=Array.isArray(details.changed_fields)?details.changed_fields.filter((field):field is string=>typeof field==="string"):[];return{id:text(a,"id"),action:text(a,"action"),title:text(a,"module")||text(a,"record_id")||"Content update",at:text(a,"created_at"),changedFields};}),analytics,subscribers});
  setAuthenticated(true);setStorageError("");
 }
 async function adminRole(c:Config,s:Session){const u=await call(c,s.access_token,"/auth/v1/user");const rows=await call(c,s.access_token,"/rest/v1/user_roles?select=role&user_id=eq."+encodeURIComponent(u.id));if(!rows?.length)throw Error("This account has no AETHER-TRADE administrator role.");return rows[0].role as Role;}
 useEffect(()=>{let active=true;(async()=>{try{const c=await getConfig();if(!active)return;setCfg(c);const raw=localStorage.getItem(KEY);if(!raw){setReady(true);return;}let s=JSON.parse(raw) as Session;if(s.expires_at<Math.floor(Date.now()/1000)+60)s=await refresh(c,s);const r=await adminRole(c,s);if(!active)return;setRole(r);await load(c,s);}catch(e){localStorage.removeItem(KEY);if(active){setAuthenticated(false);setAuthError(err(e));setStorageError(err(e));}}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 async function signIn(email:string,password:string){const c=cfg||await getConfig();setCfg(c);setAuthError("");const r=await fetch("/api/admin-supabase/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password})});const x=await r.json();if(!r.ok)throw Error(err(x));const s:Session={access_token:x.access_token,refresh_token:x.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(x.expires_in||3600),user:x.user};store(s);try{setRole(await adminRole(c,s));await load(c,s);}catch(e){localStorage.removeItem(KEY);setSession(null);setAuthenticated(false);throw e;}}
 async function signOut(){if(cfg&&session)await call(cfg,session.access_token,"/auth/v1/logout","POST").catch(()=>null);localStorage.removeItem(KEY);setSession(null);setAuthenticated(false);setData(empty());setRole("Viewer");}
 async function sendPasswordRecovery(email:string){const c=cfg||await getConfig();const r=await fetch("/api/admin-supabase/auth/v1/recover?redirect_to="+encodeURIComponent(location.origin+"/reset-password"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim()})});const x=await r.json().catch(()=>null);if(!r.ok)throw Error(err(x));}
 const validateRecoverySession=useCallback(async()=>{try{const hash=new URLSearchParams(window.location.hash.slice(1));const token=hash.get("access_token");if(!token||!["recovery","invite"].includes(hash.get("type")??""))return false;const c=await getConfig();await call(c,token,"/auth/v1/user");return true;}catch{return false;}},[]);
 async function updatePassword(password:string){if(password.length<8)throw Error("Use a password with at least 8 characters.");const hash=new URLSearchParams(window.location.hash.slice(1));const token=hash.get("access_token");if(!token||!["recovery","invite"].includes(hash.get("type")??""))throw Error("Account link is invalid or expired. Request a fresh invite or recovery link.");const c=cfg||await getConfig();await call(c,token,"/auth/v1/user");await call(c,token,"/auth/v1/user","PUT",{password});history.replaceState(null,"",location.pathname+location.search);}
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
 async function addSubscriber(email:string,consentConfirmed:boolean){
  const normalized=email.trim().toLowerCase();
  if(!consentConfirmed)throw Error("Confirm that the email owner gave permission before adding them.");
  if(normalized.length<5||normalized.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw Error("Enter a valid email address.");
  const s=await fresh();const user=await call(cfg!,s.access_token,"/auth/v1/user");
  const existing=await call(cfg!,s.access_token,"/rest/v1/newsletter_subscribers?select=id,status,email&email=eq."+encodeURIComponent(normalized));
  if(Array.isArray(existing)&&existing.length){
   if(existing[0].status==="subscribed")throw Error("This email is already subscribed.");
   await call(cfg!,s.access_token,"/rest/v1/newsletter_subscribers?id=eq."+existing[0].id,"PATCH",{status:"subscribed",consent:true,consent_at:new Date().toISOString(),source:"admin",created_by:user.id,updated_at:new Date().toISOString()});
  }else{
   await call(cfg!,s.access_token,"/rest/v1/newsletter_subscribers","POST",{email:normalized,status:"subscribed",consent:true,consent_at:new Date().toISOString(),source:"admin",created_by:user.id});
  }
  setData(old=>({...old,subscribers:[{id:Array.isArray(existing)&&existing.length?existing[0].id:crypto.randomUUID(),email:normalized,status:"subscribed",consent:true,consentAt:new Date().toISOString(),source:"admin",createdAt:new Date().toISOString()},...old.subscribers.filter(x=>x.email!==normalized)]}));
  void refreshAfterWrite();
 }
 async function updateSubscriberStatus(id:string,status:"subscribed"|"unsubscribed"){
  if(!uuid(id))throw Error("Invalid subscriber record.");
  if(status!=="unsubscribed")throw Error("Re-subscribing requires confirming fresh consent through the add-subscriber form.");
  await write("/rest/v1/newsletter_subscribers?id=eq."+id,"PATCH",{status:"unsubscribed",updated_at:new Date().toISOString()});
  setData(old=>({...old,subscribers:old.subscribers.map(x=>x.id===id?{...x,status:"unsubscribed"}:x)}));
  void refreshAfterWrite();
 }
 async function reset(){throw Error("Live CMS data cannot be reset from this panel.");}
 const value=useMemo(()=>({data,ready,authenticated,role,authError,storageError,setRole,signIn,signOut,sendPasswordRecovery,validateRecoverySession,updatePassword,save,remove,restore,addInquiry,updateInquiry,addMedia,updateMedia,removeMedia,addSubscriber,updateSubscriberStatus,reset}),[data,ready,authenticated,role,authError,storageError,session,cfg]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspace(){const c=useContext(Context);if(!c)throw new Error("Workspace provider is missing");return c;}
