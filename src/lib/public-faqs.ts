import type { PublicContentRecord } from "@/lib/public-content-records.functions";

export function resolvePublicFaqs(
  items: readonly Pick<PublicContentRecord, "title" | "body">[] | null | undefined,
): { q: string; a: string }[] {
  return (items ?? []).map((item) => ({ q: item.title, a: item.body }));
}
