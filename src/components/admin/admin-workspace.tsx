import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Files, Workflow, BriefcaseBusiness, BookOpen, MessageSquare, Image, Settings2, Shield, ArrowUpRight, Plus, Search, Pencil, Trash2, Eye, Save, X, Download, RotateCcw, ChevronRight, Globe, Plug, Menu, ArrowUp, ArrowDown, CheckCircle2, CircleDashed, Upload, Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Logo } from "@/components/site/logo";
import { useWorkspace } from "@/components/admin/workspace-provider";
import { GlobalSeoPanel } from "@/components/admin/global-seo-panel";
import { getInquiryDeliveryMode } from "@/lib/inquiry.functions";
import { modules, makeRecord, availabilityValues, publicationValues, inquiryValues, roles, demoCan, contentSchema, isPublic, safeCsvCell, type ModuleId, type ContentRecord, type Inquiry, type Role } from "@/lib/workspace-model";

const icons = { overview: LayoutDashboard, pages: Files, automations: Workflow, platform: Workflow, services: BriefcaseBusiness, insights: BookOpen, inquiries: MessageSquare, media: Image, connections: Plug, audit: Shield, analytics: Activity, "global-seo": Globe };
const selectClass = "h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm";
async function attempt(fn: () => void | Promise<void>, message: string) { try { await fn(); toast.success(message); } catch (e) { toast.error(e instanceof Error ? e.message : "Change could not be saved"); } }
function download(name: string, text: string, type = "application/json") { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
function Status({ value }: { value: string }) { return <span className={`inline-flex items-center gap-1.5 text-xs ${value === "Published" || value === "Available" ? "text-success" : value === "Draft" || value === "New" ? "text-warning" : "text-muted-foreground"}`}><span className="size-1.5 rounded-full bg-current"/>{value}</span>; }
function date(value: string) { return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"; }
export function AdminWorkspace({ module = "overview" }: { module?: ModuleId }) {
  const workspace = useWorkspace();
  const { data, role, ready } = workspace;
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = modules.find(m => m[0] === module)?.[1] || "Overview";
  const contentModule = !["overview", "inquiries", "media", "seo", "users", "revisions", "audit", "analytics", "connections", "subscribers", "global-seo"].includes(module);
  return <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className={`${mobileOpen ? "block" : "hidden"} border-r border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto`}>
      <div className="flex h-20 items-center justify-between border-b border-border px-6"><Logo/><Button className="lg:hidden" size="icon" variant="ghost" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)}><X/></Button></div>
      <div className="px-5 py-5"><p className="eyebrow">Control center</p><p className="mt-2 flex items-center gap-2 text-xs text-success"><CheckCircle2 className="size-3.5"/>Administrator workspace</p></div>
      <nav aria-label="Admin navigation" className="space-y-5 px-3 pb-6">{["Workspace", "Content", "Website", "Operations", "Governance"].map(group => <div key={group}><p className="mb-2 px-3 font-mono text-[10px] uppercase text-muted-foreground">{group}</p>{modules.filter(m => m[2] === group).map(m => { const Icon = icons[m[0] as keyof typeof icons] || Settings2; return <Link key={m[0]} to={m[0] === "overview" ? "/admin" : "/admin/$module"} params={{ module: m[0] }} onClick={() => setMobileOpen(false)} className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${module === m[0] ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Icon className="size-4"/>{m[1]}{module === m[0] && <ChevronRight className="ml-auto size-3"/>}</Link>; })}</div>)}</nav>
      <div className="border-t border-border p-5"><Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground">View public website <ArrowUpRight className="size-4"/></Link></div>
    </aside>
    <div className="min-w-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-8"><div className="flex items-center gap-3"><Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open admin navigation" onClick={() => setMobileOpen(true)}><Menu/></Button><span className="text-sm text-muted-foreground">Workspace</span><ChevronRight className="size-3 text-muted-foreground"/><span className="text-sm font-medium">{title}</span></div><div className="flex items-center gap-3"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="size-4"/>{role}</span><Button size="sm" variant="outline" onClick={() => void workspace.signOut()}>Sign out</Button><ThemeToggle/></div></header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-5 py-2.5 text-xs md:px-8"><p><span className="font-semibold text-success">CONNECTED</span><span className="ml-2 text-muted-foreground">Live administrator session · Supabase-backed content</span></p><Link to="/admin/$module" params={{ module: "connections" }} className="inline-flex items-center gap-1 text-primary">Connection status <ArrowUpRight className="size-3"/></Link></div>
      <main className="px-5 py-8 md:px-8"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow mb-2">AETHER-TRADE / Administration</p><h1 className="text-3xl font-semibold">{title}</h1></div><span className="hidden font-mono text-xs text-muted-foreground sm:block">{ready ? "LIVE WORKSPACE" : "LOADING"}</span></div>
        {workspace.storageError && <p role="alert" className="mb-5 border border-destructive/40 p-3 text-destructive">{workspace.storageError}</p>}
        {!ready ? <p className="text-muted-foreground">Loading workspace…</p> : <>
          {module === "overview" && <Overview/>}
          {contentModule && <ContentManager key={module} module={module}/>}
          {module === "inquiries" && <Inquiries/>}
          {module === "media" && <MediaLibrary/>}
          {module === "seo" && <ContentManager module="pages" seoOnly/>}
          {module === "global-seo" && <GlobalSeoPanel/>}
          {module === "connections" && <Connections/>}
          {module === "users" && <Users/>}
          {module === "revisions" && <div className="divide-y divide-border border-y border-border">{data.revisions.length ? data.revisions.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{r.record.title}</p><p className="mt-1 text-xs text-muted-foreground">{r.action} · {r.record.module} · {date(r.at)}</p></div><Button variant="outline" disabled={!demoCan(role, "draft")} onClick={() => attempt(() => workspace.restore(r.id), "Revision restored as draft")}><RotateCcw/>Restore as draft</Button></div>) : <Empty icon={RotateCcw} title="No revisions yet" body="Updates and deletes create database snapshots automatically. New records have no previous version to restore."/>}</div>}
          {module === "audit" && <div className="divide-y divide-border border-y border-border">{data.audit.length ? data.audit.map(r => <div key={r.id} className="flex justify-between gap-4 py-4"><div><p className="text-sm"><span className="font-medium">{r.action}</span> · {r.title}</p><p className="mt-1 text-xs text-muted-foreground">Database-recorded action · changed fields: {r.changedFields.length ? r.changedFields.join(", ") : "No field detail"}</p></div><span className="shrink-0 text-xs text-muted-foreground">{date(r.at)}</span></div>) : <Empty icon={Shield} title="No recorded actions" body="Database-recorded content changes appear here."/>}</div>}
          {module === "analytics" && <AnalyticsDashboard/>}
          {module === "subscribers" && <Subscribers/>}
        </>}
      </main>
    </div>
  </div>;
}
function AnalyticsDashboard() {
  const { data } = useWorkspace();
  const total = data.analytics.length;
  const counts = data.analytics.reduce<Record<string, number>>((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {});
  const pageCounts = data.analytics.reduce<Record<string, number>>((acc, event) => {
    acc[event.pagePath] = (acc[event.pagePath] || 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!total) return <Empty icon={Activity} title="No consented visitor events yet" body="This dashboard reports only first-party events submitted after analytics consent. It does not fabricate visits, conversions or engagement metrics." />;
  return <div className="space-y-8">
    <p className="text-xs text-muted-foreground">Showing the latest {total} consented events. No visitor names, email addresses or shipment data are collected.</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Events", total],
      ["Page views", counts.page_view || 0],
      ["CTA clicks", counts.cta_click || 0],
      ["Demo conversions", counts.demo_conversion || 0],
    ].map(([label, value]) => <div key={String(label)} className="rounded-md border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-4 font-mono text-3xl">{value}</p></div>)}</div>
    <section><h2 className="mb-4 text-lg font-semibold">Top pages</h2><div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-3">Path</th><th className="text-right">Events</th></tr></thead><tbody>{topPages.map(([path, count]) => <tr key={path} className="border-t border-border"><td className="py-3 font-mono">{path}</td><td className="text-right">{count}</td></tr>)}</tbody></table></div></section>
    <section><h2 className="mb-4 text-lg font-semibold">Recent events</h2><div className="divide-y divide-border border-y border-border">{data.analytics.slice(0, 25).map(event => <div key={event.id} className="flex flex-wrap justify-between gap-3 py-3"><div><p className="text-sm font-medium">{event.eventType}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{event.pagePath}{event.automationSlug ? " · "+event.automationSlug : ""}</p></div><span className="text-xs text-muted-foreground">{date(event.createdAt)}</span></div>)}</div></section>
  </div>;
}
function Subscribers() {
  const workspace = useWorkspace();
  const [email, setEmail] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [pendingUnsubscribe, setPendingUnsubscribe] = useState<string | null>(null);
  const rows = workspace.data.subscribers;
  async function add() {
    setError("");
    try {
      await workspace.addSubscriber(email, consentConfirmed);
      setEmail("");
      setConsentConfirmed(false);
      toast.success("Consented subscriber record saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add subscriber");
    }
  }
  async function unsubscribe() {
    if (!pendingUnsubscribe) return;
    try {
      await workspace.updateSubscriberStatus(pendingUnsubscribe, "unsubscribed");
      setPendingUnsubscribe(null);
      toast.success("Subscriber marked as unsubscribed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update subscriber");
    }
  }
  return <div className="space-y-7">
    <div className="rounded-md border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Add a consented subscriber</h2>
      <p className="mt-2 text-sm text-muted-foreground">Admin-only manual entry. This list does not send newsletter emails; double opt-in and unsubscribe email delivery must be configured before a campaign is enabled.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]"><Input type="email" aria-label="Subscriber email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} maxLength={254}/><Button disabled={!email.trim() || !consentConfirmed || !demoCan(workspace.role, "users")} onClick={add}><Plus/>Add subscriber</Button></div>
      <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-primary" checked={consentConfirmed} onChange={e => setConsentConfirmed(e.target.checked)}/><span>I confirm that this email owner has explicitly consented to receive newsletter communications.</span></label>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Subscriber records ({rows.length})</h2><Button variant="outline" disabled={!rows.length || !demoCan(workspace.role, "export")} onClick={() => download("aethertrade-subscribers.csv", [["Email","Status","Consent at","Source"],...rows.map(r=>[r.email,r.status,r.consentAt,r.source])].map(row=>row.map(safeCsvCell).join(",")).join("\n"),"text/csv")}><Download/>Export CSV</Button></div>
    {rows.length ? <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-3">Email</th><th>Status</th><th>Consent recorded</th><th>Source</th><th className="text-right">Action</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t border-border"><td className="py-4">{row.email}</td><td><Status value={row.status==="subscribed"?"Subscribed":"Unsubscribed"}/></td><td className="text-xs">{date(row.consentAt)}</td><td className="text-xs">{row.source}</td><td className="text-right">{row.status==="subscribed" ? <Button size="sm" variant="outline" onClick={()=>setPendingUnsubscribe(row.id)}>Mark unsubscribed</Button> : <span className="text-xs text-muted-foreground">No action</span>}</td></tr>)}</tbody></table></div> : <Empty icon={MessageSquare} title="No subscriber records" body="Add an email only after you have a clear consent confirmation. No newsletter messages are sent by this module."/>}
    <Dialog open={!!pendingUnsubscribe} onOpenChange={open=>!open&&setPendingUnsubscribe(null)}><DialogContent><DialogHeader><DialogTitle>Mark this subscriber as unsubscribed?</DialogTitle><DialogDescription>This will update the subscriber status and keep the record for suppression. It does not send an email.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setPendingUnsubscribe(null)}>Cancel</Button><Button variant="destructive" onClick={unsubscribe}>Confirm unsubscribe</Button></div></DialogContent></Dialog>
  </div>;
}
function Empty({ icon: Icon, title, body }: { icon: typeof Files; title: string; body: string }) { return <div className="flex min-h-64 flex-col items-center justify-center border-y border-border px-5 py-10 text-center"><Icon className="mb-5 size-8 text-muted-foreground"/><h2 className="text-lg font-medium">{title}</h2><p className="mt-2 max-w-lg text-sm text-muted-foreground">{body}</p></div>; }
function Overview() {
  const { data, role, authenticated } = useWorkspace();
  const readMode = useServerFn(getInquiryDeliveryMode);
  const { data: delivery } = useQuery({
    queryKey: ["inquiry-delivery-mode"],
    queryFn: () => readMode(),
    staleTime: Infinity,
  });
  const permitted = demoCan(role, "inquiries");
  const stats = [
    { label: "Inquiries", value: permitted ? data.inquiries.length : "Restricted", icon: MessageSquare },
    { label: "New inquiries", value: permitted ? data.inquiries.filter(r => r.status === "New").length : "Restricted", icon: BriefcaseBusiness },
    { label: "Published content", value: data.records.filter(r => isPublic(r)).length, icon: Files },
    { label: "Draft articles", value: data.records.filter(r => r.module === "insights" && r.publication === "Draft").length, icon: BookOpen },
  ];
  const deliveryStatus = delivery === undefined
    ? "Checking"
    : delivery.mode === "live"
      ? "Configured · not tested"
      : "Unavailable";
  const connectionRows = [
    ["Supabase CMS & inquiry database", authenticated ? "Connected" : "Disconnected"],
    ["Administrator authentication", authenticated ? "Connected" : "Disconnected"],
    ["Website media storage", data.media.length ? "Available" : "No media assets"],
    ["Inquiry email delivery", deliveryStatus],
    ["Cloudflare Worker", "Production active"],
  ];
  return <>
    <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(s => <div key={s.label} className="rounded-md border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{s.label}</p><s.icon className="size-4 text-primary"/></div><p className="mt-5 font-mono text-3xl">{s.value}</p><p className="mt-2 text-xs text-muted-foreground">Live records from the connected database</p></div>)}</div>
    <div className="grid gap-10 xl:grid-cols-[1.5fr_1fr]">
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent inquiries</h2><Link to="/admin/$module" params={{ module: "inquiries" }} className="text-sm text-primary">View all <ArrowUpRight className="inline size-3"/></Link></div>{permitted && data.inquiries.length ? <div className="divide-y divide-border border-y border-border">{data.inquiries.slice(0, 5).map(r => <div className="flex items-center justify-between py-4" key={r.id}><div><p className="text-sm font-medium">{r.company}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{r.reference}</p></div><Status value={r.status}/></div>)}</div> : <Empty icon={MessageSquare} title={permitted ? "Your inquiry queue is empty" : "Inquiry access restricted"} body={permitted ? "New inquiries submitted through the public Contact or Demo forms appear here." : "Your database role does not allow inquiry access."}/>}</section>
      <section><h2 className="mb-4 text-lg font-semibold">Connection readiness</h2><div className="divide-y divide-border border-y border-border">{connectionRows.map(([name,state]) => <div key={name} className="flex items-center justify-between gap-3 py-4"><span className="text-sm">{name}</span><Status value={state}/></div>)}</div><Link to="/admin/$module" params={{ module: "connections" }} className="mt-5 inline-flex items-center gap-2 text-sm text-primary">Review readiness <ArrowUpRight className="size-4"/></Link></section>
    </div>
    <section className="mt-10 border-t border-border pt-7"><h2 className="mb-5 text-lg font-semibold">Content workspace</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["pages", "Pages & sections", Files], ["automations", "Automation catalogue", Workflow], ["insights", "Insights & articles", BookOpen], ["media", "Media library", Image]].map(([id, label, Icon]) => { const I = Icon as typeof Files; return <Link key={id as string} to="/admin/$module" params={{ module: id as string }} className="group flex items-center gap-4 rounded-md border border-border bg-card p-5 hover:border-primary/40"><I className="size-5 text-primary"/><div><p className="text-sm font-medium">{label as string}</p><p className="mt-1 text-xs text-muted-foreground">{id === "media" ? data.media.length : data.records.filter(r => r.module === id).length} {id === "media" ? "media assets" : "database records"}</p></div><ArrowUpRight className="ml-auto size-4 text-muted-foreground"/></Link>; })}</div></section>
  </>;
}
function ContentManager({ module, seoOnly = false }: { module: ModuleId; seoOnly?: boolean }) {
  const workspace = useWorkspace(); const { data, role } = workspace;
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("All"); const [category, setCategory] = useState("All");
  const [edit, setEdit] = useState<ContentRecord | null>(null); const [preview, setPreview] = useState<ContentRecord | null>(null); const [remove, setRemove] = useState<ContentRecord | null>(null);
  const records = data.records.filter(r => r.module === module).sort((a, b) => a.position - b.position);
  const filtered = records.filter(r => `${r.title} ${r.body} ${r.category}`.toLowerCase().includes(search.toLowerCase()) && (status === "All" || r.publication === status) && (category === "All" || r.category === category));
  const writable = demoCan(role, ["branding", "settings", "navigation"].includes(module) ? "settings" : "draft");
  return <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Search records" className="w-64 pl-9" placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)}/></div><select aria-label="Publication filter" className={selectClass} value={status} onChange={e => setStatus(e.target.value)}><option value="All">All states</option>{publicationValues.map(v => <option key={v}>{v}</option>)}</select><select aria-label="Category filter" className={selectClass} value={category} onChange={e => setCategory(e.target.value)}><option value="All">All categories</option>{[...new Set(records.map(r => r.category).filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></div>{!seoOnly && <Button disabled={!writable} onClick={() => setEdit({ ...makeRecord(module), id: crypto.randomUUID(), position: records.length })}><Plus/>New record</Button>}</div>
    <p className="mb-4 text-xs text-muted-foreground">{filtered.length} records · changes are saved to the connected CMS database</p>
    {filtered.length ? <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 font-medium">Title</th><th className="font-medium">Category</th><th className="font-medium">Publication</th><th className="font-medium">{seoOnly ? "SEO title" : "Availability"}</th><th className="py-3 text-right font-medium">Actions</th></tr></thead><tbody>{filtered.map(r => <tr key={r.id} className="border-b border-border last:border-0"><td className="max-w-xs py-4 pr-4"><p className="font-medium">{r.title}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{r.slug}</p></td><td className="pr-4 text-xs text-muted-foreground">{r.category || "—"}</td><td><Status value={r.publication}/></td><td className="pr-4">{seoOnly ? <span className="text-xs text-muted-foreground">{r.seoTitle || "Default"}</span> : <Status value={r.availability}/>}</td><td><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Preview record" aria-label={`Preview ${r.title}`} onClick={() => setPreview(r)}><Eye/></Button><Button variant="ghost" size="icon" title="Edit record" aria-label={`Edit ${r.title}`} disabled={!writable} onClick={() => setEdit(r)}><Pencil/></Button>{!seoOnly && <Button variant="ghost" size="icon" title="Delete record" aria-label={`Delete ${r.title}`} disabled={!writable} onClick={() => setRemove(r)}><Trash2/></Button>}</div></td></tr>)}</tbody></table></div> : <Empty icon={Files} title="No matching records" body="Adjust the filters or create a new record."/>}
    <Dialog open={!!edit} onOpenChange={open => !open && setEdit(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{seoOnly ? "Page SEO" : "Edit content record"}</DialogTitle><DialogDescription>Changes persist in the connected Supabase CMS. Public-site rendering must be separately verified.</DialogDescription></DialogHeader>{edit && <RecordEditor key={edit.id} initial={edit} seoOnly={seoOnly} onSaved={() => setEdit(null)}/>}</DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>CMS record preview</DialogTitle><DialogDescription>Preview of the selected CMS record. Preview does not guarantee public-site rendering.</DialogDescription></DialogHeader>{preview && <div className="space-y-5"><div className="flex gap-4"><Status value={preview.publication}/><Status value={preview.availability}/></div><h2 className="text-2xl font-semibold">{preview.title}</h2><p className="whitespace-pre-wrap text-muted-foreground">{preview.body || "No body text entered."}</p>{Object.entries(preview.fields).map(([k, v]) => <div key={k}><h3 className="text-sm font-medium capitalize">{k}</h3><p className="whitespace-pre-wrap text-sm text-muted-foreground">{v || "—"}</p></div>)}</div>}</DialogContent></Dialog>
    <Dialog open={!!remove} onOpenChange={open => !open && setRemove(null)}><DialogContent><DialogHeader><DialogTitle>Delete this content record?</DialogTitle><DialogDescription>{remove?.title}. This action cannot be undone.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRemove(null)}>Cancel</Button><Button variant="destructive" onClick={() => { if (remove) attempt(() => workspace.remove(remove.id), "Record deleted"); setRemove(null); }}><Trash2/>Delete</Button></div></DialogContent></Dialog>
  </>;
}
interface PageSection { id: string; title: string; body: string; imageUrl?: string; imageAlt?: string; }
function RecordEditor({ initial, onSaved, seoOnly }: { initial: ContentRecord; onSaved: () => void; seoOnly: boolean }) {
  const workspace = useWorkspace(); const [record, setRecord] = useState(initial); const [error, setError] = useState("");
  const [tab, setTab] = useState(seoOnly ? "SEO" : "Content"); const [newFieldKey, setNewFieldKey] = useState(""); const [newFieldValue, setNewFieldValue] = useState("");
  let sections: PageSection[] = []; try { sections = JSON.parse(record.fields['sections'] || "[]") as PageSection[]; if (!Array.isArray(sections)) sections = []; } catch { sections = []; }
  const setSections = (next: PageSection[]) => setRecord({ ...record, fields: { ...record.fields, sections: JSON.stringify(next) } });
  const field = (name: "title" | "slug" | "category" | "seoTitle" | "seoDescription" | "canonical", label: string) => <label className="grid gap-2 text-sm" key={name}>{label}<Input value={record[name]} onChange={e => setRecord({ ...record, [name]: e.target.value })}/></label>;
  async function save() {
    const result = contentSchema.safeParse(record); if (!result.success) { setError(result.error.issues.map(e => e.message).join(". ")); return; }
    if (!demoCan(workspace.role, "publish") && (record.publication !== "Draft" || initial.publication === "Published" || initial.publication === "Scheduled")) { setError("Your account does not have permission to publish this record."); return; }
    if (workspace.data.records.some(r => r.id !== record.id && r.module === record.module && r.slug === record.slug)) { setError("A record with this slug already exists."); return; }
    if (record.canonical && !/^https:\/\//.test(record.canonical)) { setError("Canonical URL must be an absolute HTTPS address."); return; }
    try { await workspace.save({ ...record, ...result.data }); onSaved(); toast.success("Saved to database"); } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
  }
  return <div className="space-y-5"><div className="flex flex-wrap gap-1 border-b border-border pb-3">{(seoOnly ? ["SEO"] : ["Content", "Fields", "Publishing", "SEO"]).map(t => <Button size="sm" variant={tab === t ? "secondary" : "ghost"} key={t} onClick={() => setTab(t)}>{t}</Button>)}</div>
    {tab === "Content" && <>{field("title", "Title")}{field("slug", "Slug")}{field("category", "Category")}<label className="grid gap-2 text-sm">Body<Textarea rows={8} value={record.body} onChange={e => setRecord({ ...record, body: e.target.value })}/></label>{record.module === "pages" && <div className="space-y-4"><div className="flex justify-between"><h3 className="font-medium">Ordered sections</h3><Button size="sm" variant="outline" onClick={() => setSections([...sections, { id: crypto.randomUUID(), title: "New section", body: "", imageUrl: "", imageAlt: "" }])}><Plus/>Add section</Button></div>{sections.map((s, i) => <div key={s.id} className="space-y-2 border-t border-border pt-3"><div className="flex gap-2"><Input aria-label={`Section ${i + 1} title`} value={s.title} onChange={e => setSections(sections.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))}/><Button variant="ghost" size="icon" aria-label="Move section up" disabled={!i} onClick={() => { const n = [...sections]; const current = n[i]; const previous = n[i - 1]; if (!current || !previous) return; n[i - 1] = current; n[i] = previous; setSections(n); }}><ArrowUp/></Button><Button variant="ghost" size="icon" aria-label="Move section down" disabled={i === sections.length - 1} onClick={() => { const n = [...sections]; const current = n[i]; const next = n[i + 1]; if (!current || !next) return; n[i] = next; n[i + 1] = current; setSections(n); }}><ArrowDown/></Button><Button variant="ghost" size="icon" aria-label="Remove section" onClick={() => setSections(sections.filter(x => x.id !== s.id))}><Trash2/></Button></div><Textarea aria-label={`Section ${i + 1} body`} value={s.body} maxLength={10000} onChange={e => setSections(sections.map(x => x.id === s.id ? { ...x, body: e.target.value } : x))}/><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm">Section image<select className={selectClass} aria-label={`Section ${i + 1} image`} value={s.imageUrl || ""} onChange={e => setSections(sections.map(x => x.id === s.id ? { ...x, imageUrl: e.target.value } : x))}><option value="">No image</option>{workspace.data.media.filter(m => m.url).map(m => <option key={m.id} value={m.url}>{m.name}</option>)}</select></label><label className="grid gap-2 text-sm">Image alt text<Input aria-label={`Section ${i + 1} image alt text`} value={s.imageAlt || ""} maxLength={500} onChange={e => setSections(sections.map(x => x.id === s.id ? { ...x, imageAlt: e.target.value } : x))}/></label></div></div>)}</div>}</>}
    {tab === "Fields" && <>{Object.keys(record.fields).filter(k => k !== "sections").map(k => <label key={k} className="grid gap-2 text-sm capitalize">{k.replace(/([A-Z])/g, " $1")}{["careersEnabled", "cookiePolicyApproved", "analyticsConsent", "visible"].includes(k) ? <select className={selectClass} value={record.fields[k]} onChange={e => setRecord({ ...record, fields: { ...record.fields, [k]: e.target.value } })}><option value="false">Disabled</option><option value="true">Enabled</option></select> : <Textarea rows={3} value={record.fields[k]} onChange={e => setRecord({ ...record, fields: { ...record.fields, [k]: e.target.value } })}/>}</label>)}<div className="grid gap-2 rounded-md border border-border p-3"><p className="text-sm font-medium">Add a custom field</p><Input aria-label="New field name" placeholder="Field name (e.g. group)" value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}/><Textarea aria-label="New field value" placeholder="Field value" rows={2} value={newFieldValue} onChange={e => setNewFieldValue(e.target.value)}/><Button type="button" variant="outline" disabled={!/^[A-Za-z][A-Za-z0-9_-]{0,49}$/.test(newFieldKey.trim()) || !newFieldValue.trim() || Object.hasOwn(record.fields, newFieldKey.trim())} onClick={() => { const key = newFieldKey.trim(); setRecord({ ...record, fields: { ...record.fields, [key]: newFieldValue } }); setNewFieldKey(""); setNewFieldValue(""); }}><Plus/>Add field</Button></div><label className="grid gap-2 text-sm">Position<Input type="number" min={0} value={record.position} onChange={e => setRecord({ ...record, position: Math.max(0, Number(e.target.value)) })}/></label>{!Object.keys(record.fields).length && <p className="text-sm text-muted-foreground">This record has no additional structured fields.</p>}</>}
    {tab === "Publishing" && <><label className="grid gap-2 text-sm">Publication<select className={selectClass} value={record.publication} onChange={e => setRecord({ ...record, publication: e.target.value as ContentRecord["publication"] })}>{publicationValues.map(v => <option key={v} disabled={v !== "Draft" && !demoCan(workspace.role, "publish")}>{v}</option>)}</select></label>{record.publication === "Scheduled" && <label className="grid gap-2 text-sm">Publication date<Input type="datetime-local" value={record.scheduledAt} onChange={e => setRecord({ ...record, scheduledAt: e.target.value })}/></label>}<label className="grid gap-2 text-sm">Capability availability<select className={selectClass} value={record.availability} onChange={e => setRecord({ ...record, availability: e.target.value as ContentRecord["availability"] })}>{availabilityValues.map(v => <option key={v}>{v}</option>)}</select></label><p className="text-xs text-muted-foreground">Scheduling affects demo visibility only. No production scheduler is running.</p></>}
    {tab === "SEO" && <>{field("seoTitle", "SEO title")}{field("seoDescription", "Meta description")}{field("canonical", "Canonical HTTPS URL")}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={record.noindex} onChange={e => setRecord({ ...record, noindex: e.target.checked })}/>Exclude from search indexing (demo setting)</label><div className="border-t border-border pt-4"><p className="text-lg text-primary">{record.seoTitle || record.title} — AETHER-TRADE</p><p className="mt-1 text-sm text-muted-foreground">{record.seoDescription || "No custom description entered."}</p></div></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end border-t border-border pt-4"><Button onClick={save}><Save/>Save changes</Button></div>
  </div>;
}
function Inquiries() {
  const workspace = useWorkspace(); const [search, setSearch] = useState(""); const [status, setStatus] = useState("All"); const [kind, setKind] = useState("All"); const [edit, setEdit] = useState<Inquiry | null>(null); const [note, setNote] = useState("");
  if (!demoCan(workspace.role, "inquiries")) return <Empty icon={Shield} title="Inquiry access restricted" body="Your assigned database role does not allow inquiry management."/>;
  const rows = workspace.data.inquiries.filter(r => `${r.name} ${r.company} ${r.reference} ${r.email}`.toLowerCase().includes(search.toLowerCase()) && (status === "All" || r.status === status) && (kind === "All" || r.kind === kind));
  return <><div className="mb-5 flex flex-wrap justify-between gap-3"><div className="flex flex-wrap gap-2"><Input className="w-64" aria-label="Search inquiries" placeholder="Search company, email, reference…" value={search} onChange={e => setSearch(e.target.value)}/><select className={selectClass} aria-label="Inquiry status filter" value={status} onChange={e => setStatus(e.target.value)}><option value="All">All statuses</option>{inquiryValues.map(v => <option key={v}>{v}</option>)}</select><select className={selectClass} aria-label="Inquiry type filter" value={kind} onChange={e => setKind(e.target.value)}><option value="All">All types</option><option value="contact">Contact</option><option value="demo">Demo request</option></select></div><Button variant="outline" disabled={!rows.length || !demoCan(workspace.role, "export")} onClick={() => download("aethertrade-inquiries.csv", [["Reference", "Name", "Company", "Email", "Status", "Type"], ...rows.map(r => [r.reference, r.name, r.company, r.email, r.status, r.kind])].map(r => r.map(safeCsvCell).join(",")).join("\n"), "text/csv")}><Download/>Export CSV</Button></div>
    {rows.length ? <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[600px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-3">Company / contact</th><th>Reference</th><th>Type</th><th>Status</th><th className="text-right">Received</th></tr></thead><tbody>{rows.map(r => <tr className="border-t border-border" key={r.id}><td className="py-4"><Button variant="link" className="h-auto p-0" onClick={() => { setEdit(r); setNote(""); }}>{r.company}</Button><p className="mt-1 text-xs text-muted-foreground">{r.name}</p></td><td className="font-mono text-xs text-muted-foreground">{r.reference}</td><td className="text-xs">{r.kind}</td><td><Status value={r.status}/></td><td className="text-right text-xs text-muted-foreground">{date(r.createdAt)}</td></tr>)}</tbody></table></div> : <Empty icon={MessageSquare} title="No inquiries found" body="No inquiries found. Submit a Contact or Demo form to create an inquiry, or adjust your filters."/>}
    <Dialog open={!!edit} onOpenChange={open => !open && setEdit(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{edit?.company}</DialogTitle><DialogDescription>{edit?.reference} </DialogDescription></DialogHeader>{edit && <div className="space-y-4"><p className="text-sm">{edit.name} · {edit.email}<br/>{edit.country} · {edit.automation || edit.category}</p><div className="border-y border-border py-4"><p className="whitespace-pre-wrap text-sm">{edit.requirements}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{edit.message}</p><p className="mt-3 text-xs text-muted-foreground">Privacy consent recorded · {date(edit.createdAt)}</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm">Status<select className={selectClass} value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value as Inquiry["status"] })}>{inquiryValues.map(v => <option key={v}>{v}</option>)}</select></label><label className="grid gap-2 text-sm">Follow-up date<Input type="date" value={edit.followUp} onChange={e => setEdit({ ...edit, followUp: e.target.value })}/></label></div><label className="grid gap-2 text-sm">Assigned administrator ID (UUID)<Input placeholder="Leave blank to unassign" value={edit.assignedTo} onChange={e => setEdit({ ...edit, assignedTo: e.target.value })}/></label><label className="grid gap-2 text-sm">Internal note<Textarea value={note} onChange={e => setNote(e.target.value)}/></label>{edit.notes.map((n, i) => <p key={i} className="border-t border-border pt-3 text-sm">{n.text}<span className="ml-2 text-xs text-muted-foreground">{date(n.at)}</span></p>)}<Button onClick={async () => { if (edit.assignedTo.trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(edit.assignedTo.trim())) { toast.error("Assigned administrator must be a valid UUID, or leave it blank."); return; } await attempt(() => workspace.updateInquiry({ ...edit, assignedTo: edit.assignedTo.trim(), notes: note.trim() ? [...edit.notes, { text: note.trim(), at: new Date().toISOString() }] : edit.notes }), "Inquiry updated"); setEdit(null); }}><Save/>Save inquiry</Button></div>}</DialogContent></Dialog>
  </>;
}
function MediaLibrary() {
  const workspace = useWorkspace();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [altText, setAltText] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<typeof workspace.data.media[number] | null>(null);
  const [remove, setRemove] = useState<string | null>(null);

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size <= 0 || file.size > 2 * 1024 * 1024) {
      setError("Only JPG, PNG or WebP images up to 2 MB are accepted.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image could not be read"));
        reader.onerror = () => reject(new Error("Image could not be read"));
        reader.readAsDataURL(file);
      });
      const decoded = new window.Image();
      decoded.src = dataUrl;
      await decoded.decode();
      await workspace.addMedia(file, altText);
      setAltText("");
      toast.success("Image uploaded to Supabase Storage");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function copyPublicUrl(url: string) {
    if (!url) {
      toast.error("This media item has no valid public URL");
      return;
    }
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
      toast.success("Public image URL copied");
    } catch {
      setError("Could not copy URL. Select and copy it from the URL field.");
    }
  }

  const rows = workspace.data.media.filter(r => (r.name + " " + r.alt).toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <Input className="w-full" placeholder="Search media…" aria-label="Search media" value={search} onChange={e => setSearch(e.target.value)}/>
      <Input className="w-full" placeholder="Required: describe this image" aria-label="Required alt text for new images" value={altText} onChange={e => setAltText(e.target.value)} maxLength={500} required/>
      <Button asChild disabled={busy || !demoCan(workspace.role, "draft")}>
        <label><Upload/>{busy ? "Uploading…" : "Upload image"}<input type="file" className="sr-only" aria-label="Upload image" accept="image/jpeg,image/png,image/webp" disabled={busy || !demoCan(workspace.role, "draft") || !altText.trim()} onChange={upload}/></label>
      </Button>
    </div>
    <p className="mb-5 text-xs text-muted-foreground">Persistent Supabase Storage · public website-media bucket · JPG / PNG / WebP · 2 MB maximum. Files are stored under your authenticated user folder.</p>
    {error && <p role="alert" className="mb-5 text-sm text-destructive">{error}</p>}
    {rows.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map(r => <div key={r.id} className="overflow-hidden rounded-md border border-border bg-card"><img src={r.url} alt={r.alt} className="aspect-[4/3] w-full object-contain bg-muted"/><div className="p-4"><p className="truncate text-sm font-medium">{r.name}</p><p className="mt-1 text-xs text-muted-foreground">{Math.round(r.size / 1024)} KB · {r.type}</p><p className="mt-1 text-xs text-muted-foreground">{r.alt || "Alt text not set"}</p><div className="mt-3 grid gap-2"><label className="grid gap-1 text-xs text-muted-foreground">Public image URL<input aria-label={"Public URL for " + r.name} readOnly value={r.url} onFocus={e => e.currentTarget.select()} className="w-full rounded-md border border-input bg-background px-2 py-2 font-mono text-xs text-foreground"/></label><Button variant="outline" size="sm" onClick={() => void copyPublicUrl(r.url)}>Copy public URL</Button></div><div className="mt-3 flex gap-2"><Button variant="outline" size="sm" disabled={!demoCan(workspace.role, "draft")} onClick={() => setEdit(r)}><Pencil/>Metadata</Button><Button size="icon" variant="ghost" aria-label={"Delete " + r.name} disabled={!demoCan(workspace.role, "draft")} onClick={() => setRemove(r.id)}><Trash2/></Button></div></div></div>)}</div> : <Empty icon={Image} title="No uploaded media" body="Upload a JPG, PNG or WebP image to add a persistent asset to the website media library."/>}
    <Dialog open={!!edit} onOpenChange={open => !open && setEdit(null)}><DialogContent><DialogHeader><DialogTitle>Media metadata</DialogTitle><DialogDescription>Changes are saved to the media catalogue.</DialogDescription></DialogHeader>{edit && <><label className="grid gap-2 text-sm">File name<Input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} maxLength={255}/></label><label className="grid gap-2 text-sm">Alt text<Textarea value={edit.alt} onChange={e => setEdit({ ...edit, alt: e.target.value })} maxLength={500}/></label><Button onClick={async () => { try { await workspace.updateMedia(edit); setEdit(null); toast.success("Media metadata saved"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save metadata"); } }}><Save/>Save</Button></>}</DialogContent></Dialog>
    <Dialog open={!!remove} onOpenChange={open => !open && setRemove(null)}><DialogContent><DialogHeader><DialogTitle>Delete media item?</DialogTitle><DialogDescription>{workspace.data.media.find(r => r.id === remove)?.name}. This removes the object from Supabase Storage and deletes its catalogue record.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRemove(null)}>Cancel</Button><Button variant="destructive" onClick={async () => { if (!remove) return; try { await workspace.removeMedia(remove); setRemove(null); toast.success("Media item deleted"); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete media item"); } }}><Trash2/>Delete</Button></div></DialogContent></Dialog>
  </>;
}
type AdminRole = "Administrator" | "Content Editor" | "Sales Manager" | "Viewer";
type AdminUser = { userId: string; email: string; displayName: string; role: string; createdAt: string };
const adminRoles: AdminRole[] = ["Administrator", "Content Editor", "Sales Manager", "Viewer"];
function Users() {
  const workspace = useWorkspace();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("Content Editor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await workspace.listAdminUsers()); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Administrator list could not be loaded."); }
    finally { setLoading(false); }
  }, [workspace.listAdminUsers]);
  useEffect(() => { void refreshUsers(); }, [refreshUsers]);
  async function invite() {
    setSaving(true); setError("");
    try {
      await workspace.inviteAdminUser(email, inviteRole);
      setEmail("");
      await refreshUsers();
      toast.success("Administrator invitation sent");
    } catch (e) { setError(e instanceof Error ? e.message : "Invitation could not be sent."); }
    finally { setSaving(false); }
  }
  async function changeRole(userId: string, nextRole: AdminRole) {
    setSaving(true); setError("");
    try {
      await workspace.updateAdminUserRole(userId, nextRole);
      await refreshUsers();
      toast.success("Administrator role updated");
    } catch (e) { setError(e instanceof Error ? e.message : "Role could not be updated."); }
    finally { setSaving(false); }
  }
  async function revoke() {
    if (!pendingRemove) return;
    setSaving(true); setError("");
    try {
      await workspace.removeAdminUser(pendingRemove);
      setPendingRemove(null);
      await refreshUsers();
      toast.success("Administrator access revoked");
    } catch (e) { setError(e instanceof Error ? e.message : "Administrator access could not be revoked."); }
    finally { setSaving(false); }
  }
  return <div className="space-y-8">
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-semibold">Invite administrator</h2>
      <p className="mt-2 text-sm text-muted-foreground">Only the verified account owner can invite users. The invitation email sends the new administrator to the secure password setup page. Invitations are limited to five per hour.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto]">
        <Input type="email" aria-label="Administrator email" placeholder="name@company.com" value={email} maxLength={254} onChange={e => setEmail(e.target.value)}/>
        <select className={selectClass} aria-label="Administrator role" value={inviteRole} onChange={e => setInviteRole(e.target.value as AdminRole)}>{adminRoles.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <Button disabled={!email.trim() || saving || !demoCan(workspace.role, "users")} onClick={invite}><Plus/>Send invitation</Button>
      </div>
    </section>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <section>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">Administrator accounts</h2><Button size="sm" variant="outline" disabled={loading || saving} onClick={() => void refreshUsers()}>Refresh</Button></div>
      {loading ? <p className="py-8 text-sm text-muted-foreground">Loading administrator accounts…</p> : users.length ? <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-3">Administrator</th><th>Email</th><th>Role</th><th>Created</th><th className="text-right">Access</th></tr></thead><tbody>{users.map(user => <tr key={user.userId} className="border-t border-border"><td className="py-4 font-medium">{user.displayName}</td><td>{user.email}</td><td>{user.role === "Super Admin" ? <Status value="Super Admin"/> : <select className={selectClass} aria-label={"Role for "+user.email} value={user.role} disabled={saving || !demoCan(workspace.role, "users")} onChange={e => void changeRole(user.userId, e.target.value as AdminRole)}>{adminRoles.map(r => <option key={r}>{r}</option>)}</select>}</td><td className="text-xs text-muted-foreground">{date(user.createdAt)}</td><td className="text-right">{user.role === "Super Admin" ? <span className="text-xs text-muted-foreground">Owner protected</span> : <Button size="sm" variant="destructive" disabled={saving || !demoCan(workspace.role, "users")} onClick={() => setPendingRemove(user.userId)}><Trash2/>Revoke</Button>}</td></tr>)}</tbody></table></div> : <Empty icon={Shield} title="No administrator accounts" body="No accounts with an assigned administrator role were returned."/>}
    </section>
    <section><h2 className="mb-4 font-semibold">Role permissions reference</h2><div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[550px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-3">Role</th><th>Drafts</th><th>Publish</th><th>Leads</th><th>Users</th></tr></thead><tbody>{roles.map(r => <tr key={r} className="border-t border-border"><td className="py-4 font-medium">{r}</td>{(["draft", "publish", "inquiries", "users"] as const).map(p => <td key={p}>{demoCan(r, p) ? <CheckCircle2 className="size-4 text-success"/> : <span className="text-muted-foreground">—</span>}</td>)}</tr>)}</tbody></table></div><p className="mt-3 text-xs text-muted-foreground">The table is a reference; Supabase Row Level Security is the enforcement layer.</p></section>
    <Dialog open={!!pendingRemove} onOpenChange={open => !open && setPendingRemove(null)}><DialogContent><DialogHeader><DialogTitle>Revoke administrator access?</DialogTitle><DialogDescription>This removes the selected user's AETHER-TRADE role. It does not delete their Supabase account.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPendingRemove(null)}>Cancel</Button><Button variant="destructive" disabled={saving} onClick={() => void revoke()}><Trash2/>Confirm revoke</Button></div></DialogContent></Dialog>
  </div>;
}
function Connections() {
  const { authenticated, role } = useWorkspace();
  const readMode = useServerFn(getInquiryDeliveryMode);
  const { data: delivery } = useQuery({
    queryKey: ["inquiry-delivery-mode"],
    queryFn: () => readMode(),
    staleTime: Infinity,
  });
  const deliveryStatus = delivery === undefined ? "Checking" : delivery.mode === "live" ? "Configured" : "Unavailable";
  const deliveryDescription = delivery === undefined
    ? "Checking the server-side inquiry delivery configuration."
    : delivery.mode === "live"
      ? "Server configuration reports live mode. Actual email deliverability has not been verified with a test message."
      : "The inquiry service is not configured for live delivery; the public form will not claim that submissions are sent.";
  const items = [
    ["Supabase database", authenticated ? "Connected" : "Disconnected", "CMS records, inquiries, revisions, audit history and consented analytics use the configured Supabase project."],
    ["Administrator authentication", authenticated ? "Connected" : "Disconnected", "This workspace requires a verified Supabase session and an assigned database role."],
    ["Cloudflare Worker", "Production active", "The website is served by the existing Cloudflare Worker deployment."],
    ["Media storage", "Provisioned", "website-media (public images) and internal-media (private) buckets are provisioned with image MIME and 2 MB limits."],
    ["Inquiry email delivery", deliveryStatus, deliveryDescription],
  ];
  return <div className="divide-y divide-border border-y border-border">
    {items.map(([name,state,description]) => <section key={name} className="py-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-medium">{name}</h2><Status value={state}/></div>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </section>)}
    <p className="py-4 text-xs text-muted-foreground">Signed-in role: {role}. Database permissions are enforced by Supabase Row Level Security; this page reports configuration, not a full penetration test.</p>
  </div>;
}
