import type { ContentRecord } from "@/lib/workspace-model";

export function restoreRevisionAsDraft(record: ContentRecord): ContentRecord {
  return { ...record, publication: "Draft" };
}
