import { isSafeStorageObjectPath, websiteMediaUploadProxyUrl } from "@/lib/admin-proxy";

type MutationMethod = "POST" | "PATCH" | "DELETE";
type JsonRecord = Record<string, unknown>;

interface AdminRecordMutation {
  accessToken: string;
  path: string;
  method: MutationMethod;
  body?: unknown;
  expectedId?: string;
  operation: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  for (const key of ["message", "msg", "error_description", "error"]) {
    const message = value[key];
    if (typeof message === "string" && message) return message;
  }
  return null;
}

export function validateWebsiteMediaUpload(
  file: Pick<File, "type" | "size">,
  altText: string,
): void {
  if (!altText.trim()) throw new Error("Add descriptive alt text before uploading this image.");
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size <= 0 ||
    file.size > 2_097_152
  ) {
    throw new Error("Only JPG, PNG or WebP images up to 2 MB are accepted.");
  }
}

export async function uploadAndSaveWebsiteMedia(
  input: {
    accessToken: string;
    ownerId: string;
    objectPath: string;
    file: File;
    altText: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<JsonRecord> {
  validateWebsiteMediaUpload(input.file, input.altText);
  if (!input.accessToken.trim()) throw new Error("Authentication required.");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.ownerId,
    )
  ) {
    throw new Error("Authenticated user identity is invalid.");
  }
  if (
    !isSafeStorageObjectPath(input.objectPath) ||
    input.objectPath.split("/")[0] !== input.ownerId
  ) {
    throw new Error("Invalid media object path.");
  }
  const uploadUrl = websiteMediaUploadProxyUrl(input.objectPath);
  if (!uploadUrl) throw new Error("Invalid media object path.");

  const upload = await fetchImpl(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + input.accessToken,
      "Content-Type": input.file.type,
      "x-upsert": "false",
    },
    body: input.file,
  });
  if (!upload.ok) {
    const raw = await upload.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = { message: raw };
      }
    }
    throw new Error(errorMessage(payload) ?? `Storage upload failed with status ${upload.status}.`);
  }

  try {
    const saved = await writeAdminRecord(
      {
        accessToken: input.accessToken,
        path: "/rest/v1/media_assets",
        method: "POST",
        body: {
          bucket_id: "website-media",
          object_path: input.objectPath,
          filename: input.file.name,
          content_type: input.file.type,
          file_size: input.file.size,
          alt_text: input.altText.trim().slice(0, 500),
          owner_id: input.ownerId,
          is_public: true,
        },
        operation: "Media metadata save",
      },
      fetchImpl,
    );
    if (
      typeof saved["id"] !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        saved["id"],
      )
    ) {
      throw new Error("Image uploaded but valid media metadata was not returned.");
    }
    if (
      saved["bucket_id"] !== "website-media" ||
      saved["object_path"] !== input.objectPath ||
      saved["owner_id"] !== input.ownerId
    ) {
      throw new Error("Media metadata did not match the uploaded object.");
    }
    return saved;
  } catch (error) {
    try {
      await deleteWebsiteMediaObject(input.accessToken, input.objectPath, fetchImpl);
    } catch (cleanupError) {
      const saveMessage = error instanceof Error ? error.message : "Media metadata save failed.";
      const cleanupMessage =
        cleanupError instanceof Error ? cleanupError.message : "Storage cleanup failed.";
      throw new Error(
        `${saveMessage} Uploaded object cleanup failed for ${input.objectPath}: ${cleanupMessage}`,
      );
    }
    throw error;
  }
}

export async function writeAdminRecord(
  mutation: AdminRecordMutation,
  fetchImpl: typeof fetch = fetch,
): Promise<JsonRecord> {
  const request: RequestInit = {
    method: mutation.method,
    headers: {
      Authorization: "Bearer " + mutation.accessToken,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  };
  if (mutation.body !== undefined) request.body = JSON.stringify(mutation.body);

  const response = await fetchImpl("/api/admin-supabase" + mutation.path, request);

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      if (response.ok) throw new Error(`${mutation.operation} returned invalid JSON.`);
      payload = { message: raw };
    }
  }

  if (!response.ok) {
    throw new Error(
      errorMessage(payload) ?? `${mutation.operation} failed with status ${response.status}.`,
    );
  }

  if (!Array.isArray(payload) || payload.length !== 1) {
    throw new Error(`${mutation.operation} could not be confirmed: expected one affected record.`);
  }

  const [record] = payload;
  if (
    !isRecord(record) ||
    (mutation.expectedId !== undefined && record["id"] !== mutation.expectedId)
  ) {
    throw new Error(
      `${mutation.operation} could not be confirmed: the returned record did not match.`,
    );
  }

  return record;
}

export async function deleteWebsiteMediaObject(
  accessToken: string,
  objectPath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!accessToken.trim()) throw new Error("Authentication required.");
  if (!isSafeStorageObjectPath(objectPath)) throw new Error("Invalid media object path.");
  const response = await fetchImpl("/api/admin-supabase/storage/v1/object/website-media", {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });
  // A 404 means the object is already gone (for example a retry after a partial failure).
  // Treat that as removed so the catalogue entry can still be cleaned up.
  if (response.status === 404) return;
  if (!response.ok) {
    throw new Error(`Storage object deletion failed with status ${response.status}.`);
  }
}

/**
 * Deletes the catalogue row. Returns true when this call removed it, and false when the
 * row was already gone (a repeated or retried deletion). A DELETE that returns no rows is
 * ambiguous (already removed, or denied by RLS), so the row is re-read to tell them apart.
 */
async function deleteMediaMetadataRow(
  accessToken: string,
  id: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const headers = {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json",
  };
  const path = "/rest/v1/media_assets?id=eq." + id;
  const deleted = await fetchImpl("/api/admin-supabase" + path, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=representation" },
  });
  const raw = await deleted.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      if (deleted.ok) throw new Error("Media metadata deletion returned invalid JSON.");
      payload = { message: raw };
    }
  }
  if (!deleted.ok) {
    throw new Error(
      errorMessage(payload) ?? `Media metadata deletion failed with status ${deleted.status}.`,
    );
  }
  if (
    Array.isArray(payload) &&
    payload.length === 1 &&
    isRecord(payload[0]) &&
    payload[0]["id"] === id
  ) {
    return true;
  }
  if (!Array.isArray(payload) || payload.length !== 0) {
    throw new Error("Media metadata deletion could not be confirmed.");
  }

  const check = await fetchImpl("/api/admin-supabase/rest/v1/media_assets?select=id&id=eq." + id, {
    method: "GET",
    headers,
  });
  if (!check.ok) throw new Error("Media metadata deletion could not be confirmed.");
  const remaining: unknown = await check.json().catch(() => null);
  if (!Array.isArray(remaining)) throw new Error("Media metadata deletion could not be confirmed.");
  if (remaining.length === 0) return false; // already removed: idempotent success
  throw new Error("Media metadata deletion was denied. Check your media permission.");
}

function containsMediaObjectPath(
  value: unknown,
  objectPath: string,
  visited: Set<object>,
): boolean {
  if (typeof value === "string") {
    if (value.includes(objectPath)) return true;
    try {
      return decodeURIComponent(value).includes(objectPath);
    } catch {
      return false;
    }
  }
  if (value === null || typeof value !== "object" || visited.has(value)) return false;
  visited.add(value);
  return Object.values(value).some((entry) => containsMediaObjectPath(entry, objectPath, visited));
}

export function isWebsiteMediaReferenced(objectPath: string, records: unknown[]): boolean {
  if (!isSafeStorageObjectPath(objectPath)) throw new Error("Invalid media object path.");
  return records.some((record) => containsMediaObjectPath(record, objectPath, new Set()));
}

export async function deleteWebsiteMediaAsset(
  input: {
    accessToken: string;
    id: string;
    objectPath: string;
    referenceRecords: unknown[];
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id)
  ) {
    throw new Error("Invalid media record.");
  }
  if (!input.accessToken.trim()) throw new Error("Authentication required.");
  if (!isSafeStorageObjectPath(input.objectPath)) throw new Error("Invalid media object path.");
  if (isWebsiteMediaReferenced(input.objectPath, input.referenceRecords)) {
    throw new Error(
      "This media item is referenced by CMS content or a saved revision. Replace or remove those references before deleting it.",
    );
  }

  // Persist recovery intent before touching Storage. If this write is rejected or
  // its outcome is ambiguous, do not remove the object.
  await writeAdminRecord(
    {
      accessToken: input.accessToken,
      path: "/rest/v1/media_assets?id=eq." + input.id + "&deletion_status=in.(active,pending)",
      method: "PATCH",
      body: {
        deletion_status: "pending",
        deletion_requested_at: new Date().toISOString(),
      },
      expectedId: input.id,
      operation: "Media deletion request",
    },
    fetchImpl,
  );

  // The pending row is the durable recovery record. Network/storage failures leave it
  // in place; retrying a missing object is safe and metadata deletion remains last.
  await deleteWebsiteMediaObject(input.accessToken, input.objectPath, fetchImpl);
  try {
    await deleteMediaMetadataRow(input.accessToken, input.id, fetchImpl);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "The database response was unavailable.";
    throw new Error(
      `Storage cleanup is complete, but catalogue deletion is still pending for ${input.id}. Retry from the Media Library. ${detail}`,
    );
  }
}
