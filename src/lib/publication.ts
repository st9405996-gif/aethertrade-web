/** Shared publication gate for public CMS reads. Scheduled records become public only after their UTC timestamp. */
export function isPublicAt(publication: unknown, scheduledAt: unknown, now = Date.now()): boolean {
  if (publication === "Published") return true;
  if (publication !== "Scheduled" || typeof scheduledAt !== "string" || !scheduledAt.trim())
    return false;
  const timestamp = Date.parse(scheduledAt);
  return Number.isFinite(timestamp) && timestamp <= now;
}
