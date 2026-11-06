import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DemoWorkspace, Role, ContentRecord, Inquiry, MediaRecord, Revision, Audit, AnalyticsEvent, Subscriber } from "@/lib/workspace-model";
import { DEFAULT_GLOBAL_SEO, type GlobalSeoSettings } from "@/lib/global-seo.model";
import { inviteAdminUser, listAdminUsers, removeAdminUser, updateAdminUserRole, type AdminUserRecord } from "@/lib/admin-users.functions";
import { getAdminPublicConfig } from "@/lib/admin-auth.functions";
import {
  deleteWebsiteMediaAsset,
  deleteWebsiteMediaObject,
  uploadAndSaveWebsiteMedia,
  validateWebsiteMediaUpload,
  writeAdminRecord,
} from "@/lib/admin-mutations";
import { mapAdminMediaRecord } from "@/lib/admin-media";
import { toast } from "sonner";
import {
  createAdminSession,
  logoutAdminSession,
  needsAdminSessionRefresh,
  parseStoredAdminSession,
  recoveryAccessToken,
  refreshAdminSession,
  type AdminSession,
} from "@/lib/admin-session";
type Config={configured:true;url:string};
async function getConfig(): Promise<Config> {
  const publicConfig = await getAdminPublicConfig();
  return { configured: true, url: publicConfig.url.replace(/\/$/, "") };
}
type Session=AdminSession;
type JsonRow = Record<string, unknown>;
const row = (value: unknown): JsonRow => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRow : {};
const text = (source: JsonRow, key: string, fallback = ""): string => typeof source[key] === "string" ? source[key] as string : fallback;
const numeric = (source: JsonRow, key: string, fallback = 0): number => typeof source[key] === "number" ? source[key] as number : Number(source[key]) || fallback;
const KEY="aether-admin-session-v1", empty=():DemoWorkspace=>({records:[],inquiries:[],media:[],revisions:[],audit:[],analytics:[],subscribers:[]});
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const err=(value:unknown)=>{const x=row(value);return String(x.message??x.msg??x.error_description??x.error??"Supabase request failed");};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(_config: Config, accessToken: string, path: string, method = "GET", body?: unknown): Promise<any> {
 const response = await fetch("/api/admin-supabase" + path, {
  method,
  headers: {
   Authorization: "Bearer " + accessToken,
   ...(body === undefined ? {} : { "Content-Type": "application/json" }),
   ...(method === "POST" || method === "PATCH" || method === "DELETE" ? { Prefer: "return=representation" } : {}),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
 });
 const raw = await response.text();
 let payload: unknown = null;
 if (raw) {
  try { payload = JSON.parse(raw); } catch { payload = { message: raw }; }
 }
 if (!response.ok) throw Error(err(payload));
 return payload;
}
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

type AssignableAdminRole = Exclude<Role, "Super Admin">;
type Ctx={adminUsers:AdminUserRecord[];listAdminUsers:()=>Promise<AdminUserRecord[]>;inviteAdminUser:(email:string,role:AssignableAdminRole)=>Promise<void>;updateAdminUserRole:(userId:string,role:AssignableAdminRole)=>Promise<void>;removeAdminUser:(userId:string)=>Promise<void>;data:DemoWorkspace;globalSeo:GlobalSeoSettings;globalSeoPublished:boolean;saveGlobalSeoSettings:(settings:GlobalSeoSettings,published:boolean)=>Promise<void>;ready:boolean;authenticated:boolean;role:Role;authError:string;storageError:string;setRole:(r:Role)=>void;signIn:(e:string,p:string)=>Promise<void>;signOut:()=>Promise<void>;sendPasswordRecovery:(e:string)=>Promise<void>;validateRecoverySession:()=>Promise<boolean>;updatePassword:(p:string)=>Promise<void>;save:(r:ContentRecord)=>Promise<void>;remove:(id:string)=>Promise<void>;restore:(id:string)=>Promise<void>;addInquiry:(r:Inquiry)=>Promise<void>;updateInquiry:(r:Inquiry)=>Promise<void>;addMedia:(file:File,altText?:string)=>Promise<void>;updateMedia:(r:MediaRecord)=>Promise<void>;removeMedia:(id:string)=>Promise<void>;addSubscriber:(email:string,consentConfirmed:boolean)=>Promise<void>;updateSubscriberStatus:(id:string,status:"subscribed"|"unsubscribed")=>Promise<void>;reset:()=>Promise<void>};
const Context=createContext<Ctx|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [cfg,setCfg]=useState<Config|null>(null),[session,setSession]=useState<Session|null>(null),[data,setData]=useState(empty),[role,setRole]=useState<Role>("Viewer"),[ready,setReady]=useState(false),[authenticated,setAuthenticated]=useState(false),[authError,setAuthError]=useState(""),[storageError,setStorageError]=useState("");
 const [globalSeo,setGlobalSeo]=useState<GlobalSeoSettings>(DEFAULT_GLOBAL_SEO),[globalSeoPublished,setGlobalSeoPublished]=useState(false);
 const store=(s:Session)=>{localStorage.setItem(KEY,JSON.stringify(s));setSession(s);};
 async function refresh(s:Session){const n=await refreshAdminSession(s);store(n);return n;}
 async function fresh(){if(!cfg||!session)throw Error("Please sign in.");return needsAdminSessionRefresh(session)?refresh(session):session;}
 async function load(c:Config,s:Session){
  const [rs,is,ns,ms,vs,as,es,subs,seoRows]=await Promise.all([
   call(c,s.access_token,"/rest/v1/content_records?select=*&order=position.asc"),
   call(c,s.access_token,"/rest/v1/inquiries?select=*&order=created_at.desc"),
   call(c,s.access_token,"/rest/v1/inquiry_notes?select=*&order=created_at.asc").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/media_assets?select=*&order=filename.asc"),
   call(c,s.access_token,"/rest/v1/content_revisions?select=*&order=created_at.desc").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/audit_logs?select=*&order=created_at.desc&limit=100").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/analytics_events?select=*&order=created_at.desc&limit=500").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/newsletter_subscribers?select=*&order=created_at.desc").catch(()=>[]),
   call(c,s.access_token,"/rest/v1/global_seo_settings?select=settings,is_published&id=eq.1").catch(()=>[])
  ]);
  const revisionRows=Array.isArray(vs)?vs.map(row):[];
  const revisions:Revision[]=revisionRows.map(v=>{const snapshot=row(row(v.snapshot).record??v.snapshot);return{id:text(v,"id"),record:text(snapshot,"module")?mapRecord(snapshot):{id:text(v,"record_id"),module:text(v,"module") as ContentRecord["module"],slug:"",title:"Previous version",body:"",category:"",publication:"Draft",availability:"Planned",position:0,scheduledAt:"",seoTitle:"",seoDescription:"",canonical:"",noindex:false,updatedAt:"",fields:{}},at:text(v,"created_at"),action:text(v,"action")==="DELETE"?"Deleted version":"Updated version"};});
  const mediaRows=Array.isArray(ms)?ms.map(row):[];
  const media:MediaRecord[]=mediaRows.map(mapAdminMediaRecord);
  const analyticsRows=Array.isArray(es)?es.map(row):[];
  const analytics:AnalyticsEvent[]=analyticsRows.map(e=>({id:text(e,"id"),eventType:text(e,"event_type"),pagePath:text(e,"page_path"),automationSlug:text(e,"automation_slug"),consent:true,createdAt:text(e,"created_at")}));
  const subscriberRows=Array.isArray(subs)?subs.map(row):[];
  const subscribers:Subscriber[]=subscriberRows.map(s=>({id:text(s,"id"),email:text(s,"email"),status:text(s,"status") as Subscriber["status"],consent:true,consentAt:text(s,"consent_at"),source:text(s,"source","admin"),createdAt:text(s,"created_at")}));
  const recordRows=Array.isArray(rs)?rs.map(row):[];
  const inquiryRows=Array.isArray(is)?is.map(row):[];
  const noteRows=Array.isArray(ns)?ns.map(row):[];
  const auditRows=Array.isArray(as)?as.map(row):[];
  setData({records:recordRows.map(mapRecord),inquiries:inquiryRows.map(i=>mapInquiry(i,noteRows)),media,revisions,audit:auditRows.map(a=>{const details=row(a.details);const changedFields=Array.isArray(details.changed_fields)?details.changed_fields.filter((field):field is string=>typeof field==="string"):[];return{id:text(a,"id"),action:text(a,"action"),title:text(a,"module")||text(a,"record_id")||"Content update",at:text(a,"created_at"),changedFields};}),analytics,subscribers});
  const seoRow=Array.isArray(seoRows)?row(seoRows[0]):{};
  if (Object.keys(seoRow).length) {
   const saved=row(seoRow.settings);
   setGlobalSeo({...DEFAULT_GLOBAL_SEO,...saved,sameAs:Array.isArray(saved.sameAs)?saved.sameAs.filter((item):item is string=>typeof item==="string"):[]});
   setGlobalSeoPublished(seoRow.is_published===true);
  }
  setAuthenticated(true);setStorageError("");
 }
 async function adminRole(c:Config,s:Session){const u=await call(c,s.access_token,"/auth/v1/user");const rows=await call(c,s.access_token,"/rest/v1/user_roles?select=role&user_id=eq."+encodeURIComponent(u.id));if(!rows?.length)throw Error("This account has no AETHER-TRADE administrator role.");return rows[0].role as Role;}
 useEffect(()=>{let active=true;(async()=>{try{const c=await getConfig();if(!active)return;setCfg(c);const raw=localStorage.getItem(KEY);if(!raw){setReady(true);return;}let s=parseStoredAdminSession(raw);store(s);if(needsAdminSessionRefresh(s))s=await refresh(s);const r=await adminRole(c,s);if(!active)return;setRole(r);await load(c,s);}catch(e){localStorage.removeItem(KEY);if(active){setAuthenticated(false);setAuthError(err(e));setStorageError(err(e));}}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 async function signIn(email:string,password:string){const c=cfg||await getConfig();setCfg(c);setAuthError("");const r=await fetch("/api/admin-supabase/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password})});const x=await r.json().catch(()=>null);if(!r.ok)throw Error(err(x));const s=createAdminSession(x);store(s);try{setRole(await adminRole(c,s));await load(c,s);}catch(e){localStorage.removeItem(KEY);setSession(null);setAuthenticated(false);throw e;}}
 async function signOut(){const result=await logoutAdminSession(async()=>{if(cfg&&session)await call(cfg,session.access_token,"/auth/v1/logout","POST");},()=>{localStorage.removeItem(KEY);setSession(null);setAuthenticated(false);setData(empty());setRole("Viewer");});if(!result.revoked)toast.error("Signed out on this device, but server session revocation could not be confirmed.");}
 async function sendPasswordRecovery(email:string){const c=cfg||await getConfig();const r=await fetch("/api/admin-supabase/auth/v1/recover?redirect_to="+encodeURIComponent(location.origin+"/reset-password"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim()})});const x=await r.json().catch(()=>null);if(!r.ok)throw Error(err(x));}
 const validateRecoverySession=useCallback(async()=>{try{const token=recoveryAccessToken(window.location.hash);if(!token)return false;const c=await getConfig();await call(c,token,"/auth/v1/user");return true;}catch{return false;}},[]);
 async function updatePassword(password:string){if(password.length<8)throw Error("Use a password with at least 8 characters.");const token=recoveryAccessToken(window.location.hash);if(!token)throw Error("Account link is invalid or expired. Request a fresh invite or recovery link.");const c=cfg||await getConfig();await call(c,token,"/auth/v1/user");await call(c,token,"/auth/v1/user","PUT",{password});history.replaceState(null,"",location.pathname+location.search);}
 async function write(path:string,method:string,body?:unknown){const s=await fresh();return call(cfg!,s.access_token,path,method,body);}
 async function refreshAfterWrite(){try{const s=await fresh();await load(cfg!,s);}catch(e){setStorageError("Your change was saved, but the workspace could not refresh: "+err(e));}}
 async function save(r:ContentRecord){const id=uuid(r.id)?r.id:crypto.randomUUID();const existing=data.records.some(x=>x.id===id);const row={id,module:r.module,slug:r.slug,title:r.title,body:r.body,category:r.category,fields:r.fields,publication:r.publication,availability:r.availability,position:r.position,scheduled_at:r.scheduledAt||null,seo_title:r.seoTitle,seo_description:r.seoDescription,canonical:r.canonical,noindex:r.noindex};const s=await fresh();const saved=await writeAdminRecord({accessToken:s.access_token,path:existing?"/rest/v1/content_records?id=eq."+id:"/rest/v1/content_records",method:existing?"PATCH":"POST",body:row,expectedId:id,operation:"Content save"});const savedRecord=mapRecord(saved);setData(old=>({...old,records:[...old.records.filter(x=>x.id!==id),savedRecord]}));void refreshAfterWrite();}
 async function saveGlobalSeoSettings(settings:GlobalSeoSettings,published:boolean){
  const s=await fresh();
  const result=await call(cfg!,s.access_token,"/rest/v1/global_seo_settings?id=eq.1","PATCH",{settings,is_published:published,updated_at:new Date().toISOString(),updated_by:s.user.id});
  if(!Array.isArray(result)||result.length!==1)throw Error("Global SEO settings were not updated. Check your settings permission.");
  setGlobalSeo(settings);setGlobalSeoPublished(published);
 }
 async function remove(id:string){if(!uuid(id))throw Error("Invalid database record.");const s=await fresh();await writeAdminRecord({accessToken:s.access_token,path:"/rest/v1/content_records?id=eq."+id,method:"DELETE",expectedId:id,operation:"Content deletion"});setData(old=>({...old,records:old.records.filter(x=>x.id!==id)}));void refreshAfterWrite();}
 async function restore(id:string){const v=data.revisions.find(x=>x.id===id);if(!v)throw Error("Revision not found.");await save({...v.record,publication:"Draft"});}
 async function addInquiry(_r:Inquiry){throw Error("Inquiries are created through the public website forms.");}
 async function updateInquiry(r:Inquiry){if(!uuid(r.id))throw Error("Invalid inquiry.");const previous=data.inquiries.find(x=>x.id===r.id);const saved=await writeAdminRecord({accessToken:(await fresh()).access_token,path:"/rest/v1/inquiries?id=eq."+r.id,method:"PATCH",body:{status:r.status,assigned_to:uuid(r.assignedTo)?r.assignedTo:null,follow_up:r.followUp||null},expectedId:r.id,operation:"Inquiry update"});const added=(r.notes||[]).slice(previous?.notes.length||0);try{for(const note of added)await writeAdminRecord({accessToken:(await fresh()).access_token,path:"/rest/v1/inquiry_notes",method:"POST",body:{inquiry_id:r.id,body:note.text},operation:"Inquiry note save"});}catch(e){await refreshAfterWrite();throw Error("Inquiry status was saved, but one or more notes could not be confirmed; earlier notes may already have been saved. "+err(e));}const updated={...r,status:text(saved,"status",r.status) as Inquiry["status"],assignedTo:text(saved,"assigned_to"),followUp:text(saved,"follow_up")};setData(old=>({...old,inquiries:old.inquiries.map(x=>x.id===r.id?updated:x)}));void refreshAfterWrite();}
 async function addMedia(file:File,altText=""){
  if(!session||!cfg)throw Error("Please sign in.");
  validateWebsiteMediaUpload(file,altText);
  const s=await fresh();const user=await call(cfg,s.access_token,"/auth/v1/user");
  const safeName=file.name.normalize("NFKD").replace(/[^A-Za-z0-9._~-]+/g,"-").replace(/-+/g,"-").replace(/^[-.]+|[-.]+$/g,"").slice(0,100)||"image";
  const objectPath=user.id+"/"+crypto.randomUUID()+"-"+safeName;
  const saved=await uploadAndSaveWebsiteMedia({accessToken:s.access_token,ownerId:user.id,objectPath,file,altText});
  const media=mapAdminMediaRecord(saved);
  setData(old=>({...old,media:[...old.media,media]}));void refreshAfterWrite();
 }
 async function updateMedia(r:MediaRecord){if(!uuid(r.id))throw Error("Invalid media record.");if(!r.alt.trim())throw Error("Alt text is required for public images.");const saved=await writeAdminRecord({accessToken:(await fresh()).access_token,path:"/rest/v1/media_assets?id=eq."+r.id,method:"PATCH",body:{filename:r.name,alt_text:r.alt.trim()},expectedId:r.id,operation:"Media metadata update"});const updated={...r,name:text(saved,"filename",r.name),alt:text(saved,"alt_text",r.alt.trim())};setData(old=>({...old,media:old.media.map(x=>x.id===r.id?updated:x)}));void refreshAfterWrite();}
 async function removeMedia(id: string) {
   if (!uuid(id)) throw Error("Invalid media record.");
   const media = data.media.find((x) => x.id === id);
   if (!media || media.bucketId !== "website-media" || !media.objectPath)
     throw Error("Media object reference is invalid.");
   const s = await fresh();
   async function readAll(path: string) {
     const rows: unknown[] = [];
     const pageSize = 1000;
     for (let page = 0; page < 100; page++) {
       const result = await call(
         cfg!,
         s.access_token,
         path + "&limit=" + pageSize + "&offset=" + page * pageSize,
       );
       if (!Array.isArray(result))
         throw Error("Could not verify CMS media references; deletion was cancelled.");
       rows.push(...result);
       if (result.length < pageSize) return rows;
     }
     throw Error("Could not verify all CMS media references; deletion was cancelled.");
   }
   const [records, revisions] = await Promise.all([
     readAll("/rest/v1/content_records?select=id,fields&order=id.asc"),
     readAll("/rest/v1/content_revisions?select=id,snapshot&order=id.asc"),
   ]);
   try {
     await deleteWebsiteMediaAsset({
       accessToken: s.access_token,
       id,
       objectPath: media.objectPath,
       referenceRecords: [records, revisions],
     });
   } catch (e) {
     void refreshAfterWrite();
     throw e;
   }
   setData((old) => ({ ...old, media: old.media.filter((x) => x.id !== id) }));
   void refreshAfterWrite();
 }
 async function addSubscriber(email:string,consentConfirmed:boolean){
  const normalized=email.trim().toLowerCase();
  if(!consentConfirmed)throw Error("Confirm that the email owner gave permission before adding them.");
  if(normalized.length<5||normalized.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw Error("Enter a valid email address.");
  const s=await fresh();const user=await call(cfg!,s.access_token,"/auth/v1/user");
  const existing=await call(cfg!,s.access_token,"/rest/v1/newsletter_subscribers?select=id,status,email&email=eq."+encodeURIComponent(normalized));
  const existingRow=Array.isArray(existing)&&existing.length?row(existing[0]):null;let saved:JsonRow;
  if(existingRow){
   const existingId=text(existingRow,"id");if(!uuid(existingId))throw Error("Subscriber lookup returned an invalid record.");
   if(existingRow["status"]==="subscribed")throw Error("This email is already subscribed.");
   saved=await writeAdminRecord({accessToken:s.access_token,path:"/rest/v1/newsletter_subscribers?id=eq."+existingId,method:"PATCH",body:{status:"subscribed",consent:true,consent_at:new Date().toISOString(),source:"admin",created_by:user.id,updated_at:new Date().toISOString()},expectedId:existingId,operation:"Subscriber re-subscription"});
  }else{
   saved=await writeAdminRecord({accessToken:s.access_token,path:"/rest/v1/newsletter_subscribers",method:"POST",body:{email:normalized,status:"subscribed",consent:true,consent_at:new Date().toISOString(),source:"admin",created_by:user.id},operation:"Subscriber creation"});
  }
  const subscriberId=text(saved,"id");if(!uuid(subscriberId)||text(saved,"email")!==normalized||saved["status"]!=="subscribed"||saved["consent"]!==true)throw Error("Subscriber write returned a record that did not match the confirmed consent.");
  const subscriber:Subscriber={id:subscriberId,email:normalized,status:"subscribed",consent:true,consentAt:text(saved,"consent_at"),source:text(saved,"source","admin"),createdAt:text(saved,"created_at")};
  setData(old=>({...old,subscribers:[subscriber,...old.subscribers.filter(x=>x.email!==normalized)]}));
  void refreshAfterWrite();
 }
 async function updateSubscriberStatus(id:string,status:"subscribed"|"unsubscribed"){
  if(!uuid(id))throw Error("Invalid subscriber record.");
  if(status!=="unsubscribed")throw Error("Re-subscribing requires confirming fresh consent through the add-subscriber form.");
  const saved=await writeAdminRecord({accessToken:(await fresh()).access_token,path:"/rest/v1/newsletter_subscribers?id=eq."+id,method:"PATCH",body:{status:"unsubscribed",updated_at:new Date().toISOString()},expectedId:id,operation:"Subscriber unsubscribe"});
  if(saved["status"]!=="unsubscribed")throw Error("Subscriber update returned an unexpected status.");
  setData(old=>({...old,subscribers:old.subscribers.map(x=>x.id===id?{...x,status:"unsubscribed"}:x)}));
  void refreshAfterWrite();
 }
 async function listUsers(){const s=await fresh();return listAdminUsers({data:{accessToken:s.access_token}});}
 async function inviteUser(email:string,adminRole:AssignableAdminRole){const s=await fresh();await inviteAdminUser({data:{email,role:adminRole,accessToken:s.access_token}});}
 async function changeUserRole(userId:string,adminRole:AssignableAdminRole){const s=await fresh();await updateAdminUserRole({data:{targetUserId:userId,role:adminRole,accessToken:s.access_token}});}
 async function revokeUser(userId:string){const s=await fresh();await removeAdminUser({data:{targetUserId:userId,accessToken:s.access_token}});}
 async function reset(){throw Error("Live CMS data cannot be reset from this panel.");}
 const value=useMemo(()=>({data,globalSeo,globalSeoPublished,saveGlobalSeoSettings,ready,authenticated,role,authError,storageError,setRole,signIn,signOut,sendPasswordRecovery,validateRecoverySession,updatePassword,save,remove,restore,addInquiry,updateInquiry,addMedia,updateMedia,removeMedia,addSubscriber,updateSubscriberStatus,listAdminUsers:listUsers,inviteAdminUser:inviteUser,updateAdminUserRole:changeUserRole,removeAdminUser:revokeUser,reset}),[data,globalSeo,globalSeoPublished,ready,authenticated,role,authError,storageError,session,cfg]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspace(){const c=useContext(Context);if(!c)throw new Error("Workspace provider is missing");return c;}
