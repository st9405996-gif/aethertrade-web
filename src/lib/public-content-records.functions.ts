import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readServerEnv } from "@/lib/server-env.server";
import { isPublicAt } from "@/lib/publication";

export interface PublicContentRecord {
  id: string;
  module: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  availability: string;
  position: number;
  fields: Record<string, string>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function asText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 30000) : "";
}
function parseRecord(value: unknown, now = Date.now()): PublicContentRecord | null {
  const row = asRecord(value);
  if (!isPublicAt(row.publication, row.scheduled_at, now) || row.noindex === true) return null;
  const title = asText(row.title).trim();
  if (!title) return null;
  const rawFields = asRecord(row.fields);
  const fields = Object.fromEntries(Object.entries(rawFields).slice(0, 80).map(([key, item]) => [
    key.slice(0, 100),
    typeof item === "string" ? item.slice(0, 10000) : (JSON.stringify(item) ?? "").slice(0, 10000),
  ]));
  return {
    id: asText(row.id),
    module: asText(row.module),
    slug: asText(row.slug),
    title,
    body: asText(row.body),
    category: asText(row.category),
    availability: asText(row.availability),
    position: typeof row.position === "number" ? row.position : 0,
    fields,
  };
}

const inputSchema = z.object({
  module: z.enum(["platform", "services", "solutions", "industries", "navigation", "branding", "automations", "faqs", "partnerships"]),
});
export const getPublishedContentRecords = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid public content module.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const env = readServerEnv();
    const baseUrl = env["SUPABASE_URL"]?.replace(/\/+$/, "");
    const publishableKey = env["SUPABASE_PUBLISHABLE_KEY"];
    if (!baseUrl || !publishableKey) throw new Error("Public content connection is not configured.");
    const url = new URL(baseUrl + "/rest/v1/content_records");
    url.searchParams.set("select", "id,module,slug,title,body,category,availability,position,publication,scheduled_at,noindex,fields");
    url.searchParams.set("module", "eq." + data.module);
    url.searchParams.set("noindex", "eq.false");
    url.searchParams.set("or", `(publication.eq.Published,and(publication.eq.Scheduled,scheduled_at.lte.${new Date().toISOString()}))`);
    url.searchParams.set("order", "position.asc,title.asc");
    url.searchParams.set("limit", "200");
    const response = await fetch(url, {
      headers: { apikey: publishableKey, Authorization: "Bearer " + publishableKey, Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Public content request failed with status " + response.status + ".");
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("Public content response was not a list.");
    return payload.map(item => parseRecord(item)).filter((item): item is PublicContentRecord => item !== null);
  });
