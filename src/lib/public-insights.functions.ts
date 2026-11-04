import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readServerEnv } from "@/lib/server-env.server";

export interface PublishedInsight {
  slug: string;
  title: string;
  body: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parsePublishedInsight(value: unknown): PublishedInsight | null {
  const row = asRecord(value);
  if (!row) return null;

  const slug = asText(row.slug);
  const title = asText(row.title);
  const body = asText(row.body);
  if (!slug || !title || !body.trim() || row.publication !== "Published" || row.noindex === true) {
    return null;
  }

  const fields = asRecord(row.fields);
  return {
    slug,
    title,
    body,
    category: asText(row.category),
    seoTitle: asText(row.seo_title),
    seoDescription: asText(row.seo_description),
    author: asText(fields?.author),
  };
}

/**
 * Reads only public, published, indexable insight records.
 * Uses the publishable key so Supabase RLS remains the authorization boundary.
 * The service-role key is deliberately never read or used here.
 */
async function readPublishedInsights(slug?: string): Promise<PublishedInsight[]> {
  const env = readServerEnv();
  const baseUrl = env["SUPABASE_URL"]?.replace(/\/$/, "");
  const publishableKey = env["SUPABASE_PUBLISHABLE_KEY"];
  if (!baseUrl || !publishableKey) {
    throw new Error("Public content connection is not configured.");
  }

  const url = new URL(`${baseUrl}/rest/v1/content_records`);
  url.searchParams.set(
    "select",
    "slug,title,body,category,publication,noindex,seo_title,seo_description,fields",
  );
  url.searchParams.set("module", "eq.insights");
  url.searchParams.set("publication", "eq.Published");
  url.searchParams.set("noindex", "eq.false");
  url.searchParams.set("order", "position.asc,slug.asc");
  url.searchParams.set("limit", "100");
  if (slug) url.searchParams.set("slug", `eq.${slug}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    // Do not return backend details, credentials, or hidden content to the browser.
    throw new Error(`Published content request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Published content response was not a list.");
  }

  return payload
    .map(parsePublishedInsight)
    .filter((item): item is PublishedInsight => item !== null);
}

export const getPublishedInsights = createServerFn({ method: "GET" }).handler(async () => {
  return readPublishedInsights();
});

const slugInput = z.object({
  slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
});

export const getPublishedInsight = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const parsed = slugInput.safeParse(input);
    if (!parsed.success) throw new Error("Invalid article slug.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const [article] = await readPublishedInsights(data.slug);
    return article ?? null;
  });
