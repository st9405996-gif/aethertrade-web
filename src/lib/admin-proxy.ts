const ADMIN_PROXY_PREFIX = "/api/admin-supabase";
const ADMIN_TABLES = new Set([
  "audit_logs",
  "analytics_events",
  "content_records",
  "content_revisions",
  "global_seo_settings",
  "inquiries",
  "inquiry_notes",
  "media_assets",
  "newsletter_subscribers",
  "user_roles",
]);
const PUBLIC_MEDIA_PREFIX = "/storage/v1/object/public/website-media/";
const UPLOAD_MEDIA_PREFIX = "/storage/v1/object/website-media/";

function safeStorageObjectPath(value: string): boolean {
  return value.length > 0 && value.split("/").every(
    (part) => /^[A-Za-z0-9._~-]+$/.test(part) && part !== "." && part !== "..",
  );
}

/** Return only explicitly allowlisted Supabase paths for the same-origin admin proxy. */
export function adminProxyTarget(pathname: string, search: string, method: string): string | null {
  if (!pathname.startsWith(ADMIN_PROXY_PREFIX + "/")) return null;
  const path = pathname.slice(ADMIN_PROXY_PREFIX.length);
  const grantType = new URLSearchParams(search).get("grant_type");

  if (
    (path === "/auth/v1/token" && ["password", "refresh_token"].includes(grantType ?? "")) ||
    path === "/auth/v1/recover" ||
    path === "/auth/v1/user" ||
    path === "/auth/v1/logout"
  ) return path + search;

  const table = /^\/rest\/v1\/([a-z_]+)$/.exec(path);
  if (table && ADMIN_TABLES.has(table[1])) return path + search;

  if (
    method === "GET" &&
    path.startsWith(PUBLIC_MEDIA_PREFIX) &&
    safeStorageObjectPath(path.slice(PUBLIC_MEDIA_PREFIX.length))
  ) return path + search;

  if (
    ["POST", "PUT"].includes(method) &&
    path.startsWith(UPLOAD_MEDIA_PREFIX) &&
    safeStorageObjectPath(path.slice(UPLOAD_MEDIA_PREFIX.length))
  ) return path + search;

  if (method === "DELETE" && path === "/storage/v1/object/website-media") return path + search;
  return null;
}
