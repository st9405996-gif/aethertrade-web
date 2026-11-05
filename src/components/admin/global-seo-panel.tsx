import { useEffect, useState } from "react";
import { Save, Globe, ShieldCheck, Share2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/admin/workspace-provider";
import { DEFAULT_GLOBAL_SEO, type GlobalSeoSettings } from "@/lib/global-seo.functions";
import { demoCan } from "@/lib/workspace-model";

function Field({ label, value, onChange, maxLength = 500, hint }: {
  label: string; value: string; onChange: (value: string) => void; maxLength?: number; hint?: string;
}) {
  return <label className="grid gap-2 text-sm">{label}<Input value={value} maxLength={maxLength} onChange={event => onChange(event.target.value)}/>{hint && <span className="text-xs text-muted-foreground">{hint}</span>}</label>;
}

export function GlobalSeoPanel() {
  const workspace = useWorkspace();
  const [settings, setSettings] = useState<GlobalSeoSettings>(workspace.globalSeo || DEFAULT_GLOBAL_SEO);
  const [published, setPublished] = useState(workspace.globalSeoPublished);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSettings(workspace.globalSeo || DEFAULT_GLOBAL_SEO);
    setPublished(workspace.globalSeoPublished);
  }, [workspace.globalSeo, workspace.globalSeoPublished]);

  if (!demoCan(workspace.role, "settings")) {
    return <div className="rounded-md border border-border p-5"><h2 className="font-semibold">Settings permission required</h2><p className="mt-2 text-sm text-muted-foreground">Global SEO can only be edited by an administrator with the settings permission.</p></div>;
  }

  const update = (key: keyof GlobalSeoSettings, value: string | string[]) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  async function save() {
    setError("");
    try {
      const siteUrl = new URL(settings.siteUrl);
      if (siteUrl.protocol !== "https:") throw new Error("Canonical site URL must use HTTPS.");
      for (const [label, value] of [["Default Open Graph image", settings.defaultOgImage], ["Organization logo", settings.organizationLogo], ["Organization URL", settings.organizationUrl]] as const) {
        if (!value) continue;
        const url = new URL(value);
        if (url.protocol !== "https:") throw new Error(label + " must use an HTTPS URL.");
      }
      if (settings.sameAs.some(value => { try { return new URL(value).protocol !== "https:"; } catch { return true; } })) {
        throw new Error("Every social profile must be a valid HTTPS URL.");
      }
      setSaving(true);
      await workspace.saveGlobalSeoSettings(settings, published);
      toast.success(published ? "Global SEO settings saved and published" : "Global SEO settings saved as unpublished");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Global SEO settings could not be saved.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="max-w-4xl space-y-8">
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2"><Globe className="size-5 text-primary"/><h2 className="font-semibold">Global website metadata</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">These values provide site-wide defaults. Individual page SEO fields keep priority when they contain their own values.</p>
      <div className="mt-5 grid gap-4">
        <Field label="Website / brand name" value={settings.siteName} maxLength={120} onChange={value => update("siteName", value)}/>
        <Field label="Canonical website URL" value={settings.siteUrl} maxLength={300} hint="HTTPS URL for aethertrade.cloud. This is used as the organization website address." onChange={value => update("siteUrl", value)}/>
        <Field label="Default SEO title" value={settings.defaultTitle} maxLength={160} onChange={value => update("defaultTitle", value)}/>
        <label className="grid gap-2 text-sm">Default meta description<Textarea rows={3} maxLength={320} value={settings.defaultDescription} onChange={event => update("defaultDescription", event.target.value)}/><span className="text-xs text-muted-foreground">{settings.defaultDescription.length}/320 characters</span></label>
      </div>
    </div>

    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2"><Share2 className="size-5 text-primary"/><h2 className="font-semibold">Social sharing (Open Graph)</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">Used as the default preview metadata when a page does not define its own values.</p>
      <div className="mt-5 grid gap-4">
        <Field label="Default Open Graph image URL" value={settings.defaultOgImage} maxLength={1000} hint="Use a public HTTPS image URL. Recommended social preview format: 1200 × 630." onChange={value => update("defaultOgImage", value)}/>
      </div>
    </div>

    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="font-semibold">Search engine verification</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">Paste only the verification content value provided by the search engine, not the full meta tag.</p>
      <div className="mt-5 grid gap-4">
        <Field label="Google Search Console verification" value={settings.googleVerification} maxLength={200} onChange={value => update("googleVerification", value)}/>
        <Field label="Bing Webmaster verification" value={settings.bingVerification} maxLength={200} onChange={value => update("bingVerification", value)}/>
      </div>
    </div>

    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2"><Building2 className="size-5 text-primary"/><h2 className="font-semibold">Organization structured data</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">These details feed the site's Organization JSON-LD schema. Add only official, publicly verifiable company details.</p>
      <div className="mt-5 grid gap-4">
        <Field label="Organization name" value={settings.organizationName} maxLength={120} onChange={value => update("organizationName", value)}/>
        <Field label="Organization website URL" value={settings.organizationUrl} maxLength={1000} onChange={value => update("organizationUrl", value)}/>
        <Field label="Organization logo URL" value={settings.organizationLogo} maxLength={1000} onChange={value => update("organizationLogo", value)}/>
        <label className="grid gap-2 text-sm">Organization description<Textarea rows={3} maxLength={500} value={settings.organizationDescription} onChange={event => update("organizationDescription", event.target.value)}/></label>
        <label className="grid gap-2 text-sm">Official social profile URLs<Textarea rows={4} value={settings.sameAs.join("\n")} onChange={event => update("sameAs", event.target.value.split("\n").map(value => value.trim()).filter(Boolean).slice(0, 10))}/><span className="text-xs text-muted-foreground">One HTTPS URL per line; maximum 10 profiles.</span></label>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)}/>Publish settings to public website</label>
      <Button disabled={saving} onClick={() => void save()}><Save/>{saving ? "Saving…" : "Save global SEO"}</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">Technical files such as sitemap.xml, robots.txt and llms.txt remain on the existing build pipeline in this first release. They are not being silently changed by these controls.</p>
  </div>;
}
