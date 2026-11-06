import { FAQS } from "@/content/site-content";
import type { PublicContentRecord } from "@/lib/public-content-records.functions";

export function resolvePublicFaqs(
  items: readonly Pick<PublicContentRecord, "title" | "body">[] | null | undefined,
): { q: string; a: string }[] {
  return items?.length ? items.map((item) => ({ q: item.title, a: item.body })) : FAQS;
}
