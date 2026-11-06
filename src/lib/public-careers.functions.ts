import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readServerEnv } from "@/lib/server-env.server";

export interface PublicCareerListing {
  id: string;
  title: string;
  body: string;
  location: string;
  type: string;
  position: number;
}

const listingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  body: z.string().max(30000),
  location: z.string().nullable(),
  type: z.string().nullable(),
  position: z.number().int().nonnegative(),
});

export async function fetchPublicCareerListings(
  baseUrl: string | undefined,
  key: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicCareerListing[]> {
  const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");
  if (!normalizedBaseUrl || !key) {
    throw new Error("Public career listing connection is not configured.");
  }

  const url = new URL(normalizedBaseUrl + "/rest/v1/public_career_listings");
  url.searchParams.set("select", "id,title,body,location,type,position");
  url.searchParams.set("order", "position.asc,title.asc");
  url.searchParams.set("limit", "200");

  const response = await fetchImpl(url, {
    headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Public career listing request failed with status " + response.status + ".");
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Public career listing response was not a list.");
  }

  return payload.map((value, index) => {
    const parsed = listingSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error(
        "Public career listing response contained an invalid record at row " + (index + 1) + ".",
      );
    }
    return {
      ...parsed.data,
      location: parsed.data.location ?? "",
      type: parsed.data.type ?? "",
    };
  });
}

export const getPublishedCareerListings = createServerFn({ method: "GET" }).handler(async () => {
  const env = readServerEnv();
  return fetchPublicCareerListings(env["SUPABASE_URL"], env["SUPABASE_PUBLISHABLE_KEY"]);
});
