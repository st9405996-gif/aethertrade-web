import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readServerEnv } from "@/lib/server-env.server";
import { isPublicAt } from "@/lib/publication";
import { isValidCmsPageSlug } from "@/lib/cms-page-routing";

export interface AeoQuestion {
  question: string;
  answer: string;
}

export interface PublishedInsight {
  slug: string;
  title: string;
  body: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
  geoSummary: string;
  aeoQuestions: AeoQuestion[];
  noindex: boolean;
  datePublished: string;
  dateModified: string;
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

function parseAeoQuestions(value: unknown): AeoQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((entry) => {
    const item = asRecord(entry);
    const question = asText(item?.["question"]).trim();
    const answer = asText(item?.["answer"]).trim();
    if (!question || !answer || question.length > 240 || answer.length > 1200) return [];
    return [{ question, answer }];
  });
}

export function parsePublishedInsight(value: unknown, now = Date.now()): PublishedInsight | null {
  const row = asRecord(value);
  if (!row) return null;

  const slug = asText(row["slug"]);
  const title = asText(row["title"]);
  const body = asText(row["body"]);
  if (
    !isValidCmsPageSlug(slug) ||
    !title.trim() ||
    !body.trim() ||
    !isPublicAt(row["publication"], row["scheduled_at"], now) ||
    typeof row["noindex"] !== "boolean"
  ) {
    return null;
  }

  const fields = asRecord(row["fields"]);
  return {
    slug,
    title,
    body,
    category: asText(row["category"]),
    seoTitle: asText(row["seo_title"]),
    seoDescription: asText(row["seo_description"]),
    author: asText(fields?.["author"]),
    geoSummary: asText(fields?.["geoSummary"]).trim().slice(0, 1200),
    aeoQuestions: parseAeoQuestions(fields?.["aeoQuestions"]),
    noindex: row["noindex"],
    datePublished: asText(fields?.["publishedAt"]),
    dateModified: asText(row["updated_at"]),
  };
}

/**
 * Reads only public, published insight records; noindex controls indexing, not visibility.
 * Uses the publishable key so Supabase RLS remains the authorization boundary.
 * The service-role key is deliberately never read or used here.
 */
export async function fetchPublishedInsights(
  baseUrl: string | undefined,
  publishableKey: string | undefined,
  slug?: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<PublishedInsight[]> {
  const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");
  if (!normalizedBaseUrl || !publishableKey) {
    throw new Error("Public content connection is not configured.");
  }

  const url = new URL(`${normalizedBaseUrl}/rest/v1/content_records`);
  url.searchParams.set(
    "select",
    "slug,title,body,category,publication,scheduled_at,noindex,seo_title,seo_description,fields,updated_at",
  );
  url.searchParams.set("module", "eq.insights");
  url.searchParams.set(
    "or",
    `(publication.eq.Published,and(publication.eq.Scheduled,scheduled_at.lte.${new Date(now).toISOString()}))`,
  );
  url.searchParams.set("order", "position.asc,slug.asc");
  url.searchParams.set("limit", "100");
  if (slug) url.searchParams.set("slug", `eq.${slug}`);

  const response = await fetchImpl(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Published content request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Published content response was not a list.");
  }

  return payload
    .map((item) => parsePublishedInsight(item, now))
    .filter((item): item is PublishedInsight => item !== null);
}

async function readPublishedInsights(slug?: string): Promise<PublishedInsight[]> {
  const env = readServerEnv();
  return fetchPublishedInsights(env["SUPABASE_URL"], env["SUPABASE_PUBLISHABLE_KEY"], slug);
}

export const getPublishedInsights = createServerFn({ method: "GET" }).handler(async () => {
  return readPublishedInsights();
});

const slugInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
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
