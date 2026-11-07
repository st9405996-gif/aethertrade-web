import { describe, expect, it, vi } from "vitest";
import {
  deleteWebsiteMediaAsset,
  deleteWebsiteMediaObject,
  isWebsiteMediaReferenced,
  uploadAndSaveWebsiteMedia,
  validateWebsiteMediaUpload,
  writeAdminRecord,
} from "@/lib/admin-mutations";

const recordId = "6a86e6f4-4bdc-4c79-b8ac-3b94d6b7e531";
const objectPath = recordId + "/photo.png";

function imageFile(type = "image/png", size = 1): File {
  return new File([new Uint8Array(size)], "photo.png", { type });
}

function request(fetchImpl: typeof fetch) {
  return writeAdminRecord(
    {
      accessToken: "test-access-token",
      path: "/rest/v1/content_records?id=eq." + recordId,
      method: "PATCH",
      body: { title: "Updated title" },
      expectedId: recordId,
      operation: "Content save",
    },
    fetchImpl,
  );
}

describe("admin CMS mutation response", () => {
  it.each(["POST", "PATCH", "DELETE"] as const)(
    "accepts a returned row for a %s mutation",
    async (method) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }));
      const mutation = {
        accessToken: "test-access-token",
        path: "/rest/v1/content_records?id=eq." + recordId,
        method,
        ...(method === "DELETE" ? {} : { body: { title: "Updated title" } }),
        expectedId: recordId,
        operation: "Content mutation",
      };

      await expect(writeAdminRecord(mutation, fetchImpl)).resolves.toEqual({ id: recordId });
    },
  );

  it("accepts a single inserted row when the database generates its ID", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify([{ id: recordId }]), { status: 201 }));

    await expect(
      writeAdminRecord(
        {
          accessToken: "test-access-token",
          path: "/rest/v1/inquiry_notes",
          method: "POST",
          body: { inquiry_id: recordId, body: "Follow-up" },
          operation: "Inquiry note save",
        },
        fetchImpl,
      ),
    ).resolves.toEqual({ id: recordId });
  });

  it("accepts exactly one returned record matching the requested ID", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([{ id: recordId, title: "Updated title" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(request(fetchImpl)).resolves.toEqual({
      id: recordId,
      title: "Updated title",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/admin-supabase/rest/v1/content_records?id=eq." + recordId,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
          Prefer: "return=representation",
        }),
      }),
    );
  });

  it("rejects a successful response with no affected rows", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("[]", { status: 200 }));

    await expect(request(fetchImpl)).rejects.toThrow("expected one affected record");
  });

  it("reports row-level security errors instead of treating them as success", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "row-level security policy denied the write" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(request(fetchImpl)).rejects.toThrow("row-level security policy denied the write");
  });

  it("propagates network failures", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));

    await expect(request(fetchImpl)).rejects.toThrow("fetch failed");
  });

  it("rejects malformed successful JSON", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("{", { status: 200 }));

    await expect(request(fetchImpl)).rejects.toThrow("returned invalid JSON");
  });

  it("rejects a returned record that does not match the requested ID", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify([{ id: "another-record" }]), { status: 200 }));

    await expect(request(fetchImpl)).rejects.toThrow("returned record did not match");
  });
});

describe("website media object cleanup", () => {
  it("validates MIME type, nonempty size, maximum size, and required alt text", () => {
    expect(() => validateWebsiteMediaUpload(imageFile(), "A shipment document")).not.toThrow();
    expect(() =>
      validateWebsiteMediaUpload(imageFile("image/png", 2_097_152), "A shipment document"),
    ).not.toThrow();
    expect(() => validateWebsiteMediaUpload(imageFile("image/gif"), "A shipment document")).toThrow(
      "Only JPG, PNG or WebP images up to 2 MB are accepted.",
    );
    expect(() =>
      validateWebsiteMediaUpload(imageFile("image/png", 0), "A shipment document"),
    ).toThrow("Only JPG, PNG or WebP images up to 2 MB are accepted.");
    expect(() =>
      validateWebsiteMediaUpload(imageFile("image/png", 2_097_153), "A shipment document"),
    ).toThrow("Only JPG, PNG or WebP images up to 2 MB are accepted.");
    expect(() => validateWebsiteMediaUpload(imageFile(), "   ")).toThrow(
      "Add descriptive alt text before uploading this image.",
    );
  });

  it("uploads with authorization and saves metadata only after a successful storage response", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Key: "website-media/" + objectPath })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: recordId,
              bucket_id: "website-media",
              object_path: objectPath,
              owner_id: recordId,
            },
          ]),
          {
            status: 201,
          },
        ),
      );

    await expect(
      uploadAndSaveWebsiteMedia(
        {
          accessToken: "test-access-token",
          ownerId: recordId,
          objectPath,
          file: imageFile(),
          altText: "  Shipment document  ",
        },
        fetchImpl,
      ),
    ).resolves.toMatchObject({
      id: recordId,
      bucket_id: "website-media",
      object_path: objectPath,
      owner_id: recordId,
    });

    const uploadCall = fetchImpl.mock.calls[0];
    expect(uploadCall?.[0]).toBe(
      "/api/admin-supabase/storage/v1/object/website-media/" + objectPath,
    );
    expect(uploadCall?.[1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer test-access-token",
        "Content-Type": "image/png",
        "x-upsert": "false",
      },
    });
    const metadataBody = JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body)) as {
      object_path: string;
      alt_text: string;
      owner_id: string;
    };
    expect(metadataBody).toMatchObject({
      object_path: objectPath,
      alt_text: "Shipment document",
      owner_id: recordId,
    });
  });

  it("reports storage upload errors and does not attempt metadata creation", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "Storage rejected the upload." }), { status: 413 }),
      );

    await expect(
      uploadAndSaveWebsiteMedia(
        {
          accessToken: "test-access-token",
          ownerId: recordId,
          objectPath,
          file: imageFile(),
          altText: "Shipment document",
        },
        fetchImpl,
      ),
    ).rejects.toThrow("Storage rejected the upload.");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing authentication", { accessToken: "" }],
    ["unsafe path", { objectPath: "../photo.png" }],
    ["path outside the authenticated user's folder", { objectPath: "other-user/photo.png" }],
  ])("rejects %s before making a storage request", async (_label, overrides) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      uploadAndSaveWebsiteMedia(
        {
          accessToken: "test-access-token",
          ownerId: recordId,
          objectPath,
          file: imageFile(),
          altText: "Shipment document",
          ...overrides,
        },
        fetchImpl,
      ),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("cleans up an uploaded object if metadata creation fails", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Key: "website-media/" + objectPath })))
      .mockResolvedValueOnce(new Response("[]", { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      uploadAndSaveWebsiteMedia(
        {
          accessToken: "test-access-token",
          ownerId: recordId,
          objectPath,
          file: imageFile(),
          altText: "Shipment document",
        },
        fetchImpl,
      ),
    ).rejects.toThrow("expected one affected record");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[2]?.[0]).toBe(
      "/api/admin-supabase/storage/v1/object/website-media",
    );
    expect(fetchImpl.mock.calls[2]?.[1]?.body).toBe(JSON.stringify({ prefixes: [objectPath] }));
  });

  it("cleans up when the returned metadata does not match the uploaded object", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Key: "website-media/" + objectPath })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: recordId,
              bucket_id: "website-media",
              object_path: "another-user/other.png",
              owner_id: recordId,
            },
          ]),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      uploadAndSaveWebsiteMedia(
        {
          accessToken: "test-access-token",
          ownerId: recordId,
          objectPath,
          file: imageFile(),
          altText: "Shipment document",
        },
        fetchImpl,
      ),
    ).rejects.toThrow("Media metadata did not match the uploaded object.");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("reports the uploaded object path if metadata failure cleanup also fails", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Key: "website-media/" + objectPath })))
      .mockResolvedValueOnce(new Response("[]", { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    await expect(
      uploadAndSaveWebsiteMedia(
        {
          accessToken: "test-access-token",
          ownerId: recordId,
          objectPath,
          file: imageFile(),
          altText: "Shipment document",
        },
        fetchImpl,
      ),
    ).rejects.toThrow(
      `Uploaded object cleanup failed for ${objectPath}: Storage object deletion failed with status 500.`,
    );
  });

  it("rejects unsafe cleanup paths without issuing a request", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      deleteWebsiteMediaObject("test-access-token", "../secret", fetchImpl),
    ).rejects.toThrow("Invalid media object path.");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects missing cleanup authentication without issuing a request", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(deleteWebsiteMediaObject("", objectPath, fetchImpl)).rejects.toThrow(
      "Authentication required.",
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("deletes only the requested object prefix through the admin proxy", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      deleteWebsiteMediaObject("test-access-token", "user-id/image.webp", fetchImpl),
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/admin-supabase/storage/v1/object/website-media",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ prefixes: ["user-id/image.webp"] }),
      }),
    );
  });

  it("reports an unsuccessful storage cleanup response", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      deleteWebsiteMediaObject("test-access-token", "user-id/image.webp", fetchImpl),
    ).rejects.toThrow("status 500");
  });

  it("propagates network failures during storage cleanup", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      deleteWebsiteMediaObject("test-access-token", "user-id/image.webp", fetchImpl),
    ).rejects.toThrow("fetch failed");
  });

  it("detects media references in content and revision snapshots", () => {
    expect(
      isWebsiteMediaReferenced(objectPath, [
        {
          fields: {
            sections: JSON.stringify([
              {
                imageUrl:
                  "/api/admin-supabase/storage/v1/object/public/website-media/" + objectPath,
              },
            ]),
          },
        },
        { snapshot: { record: { fields: { heroImage: encodeURIComponent(objectPath) } } } },
      ]),
    ).toBe(true);
    expect(isWebsiteMediaReferenced(objectPath, [{ fields: { sections: "[]" } }])).toBe(false);
  });

  it("blocks deletion of referenced media before storage or metadata requests", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      deleteWebsiteMediaAsset(
        {
          accessToken: "test-access-token",
          id: recordId,
          objectPath,
          referenceRecords: [{ fields: { image: objectPath } }],
        },
        fetchImpl,
      ),
    ).rejects.toThrow("referenced by CMS content or a saved revision");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("persists pending state before deleting storage and the catalogue row", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }));

    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).resolves.toBeUndefined();
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "/api/admin-supabase/rest/v1/media_assets?id=eq." + recordId + "&deletion_status=in.(active,pending)",
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toMatchObject({
      deletion_status: "pending",
    });
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "/api/admin-supabase/storage/v1/object/website-media",
    );
    expect(fetchImpl.mock.calls[2]?.[0]).toBe(
      "/api/admin-supabase/rest/v1/media_assets?id=eq." + recordId,
    );
  });

  it("does not touch storage when persisting recovery state fails", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "RLS denied" }), { status: 403 }),
    );
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).rejects.toThrow("RLS denied");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("leaves the row pending when storage deletion fails", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).rejects.toThrow("Storage object deletion failed with status 503.");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("leaves the row pending when catalogue deletion fails after storage succeeds", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).rejects.toThrow("catalogue deletion is still pending");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("recovers when storage was already deleted by an earlier attempt", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }));
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).resolves.toBeUndefined();
  });

  it("keeps recovery state after an ambiguous storage network timeout", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }))
      .mockRejectedValueOnce(new TypeError("network timeout"));
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).rejects.toThrow("network timeout");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not persist deletion intent for CMS-referenced media", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      deleteWebsiteMediaAsset(
        {
          accessToken: "test-access-token",
          id: recordId,
          objectPath,
          referenceRecords: [{ fields: { image: objectPath } }],
        },
        fetchImpl,
      ),
    ).rejects.toThrow("referenced by CMS content or a saved revision");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("treats an already-removed catalogue row as successful on retry", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: recordId }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "test-access-token", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).resolves.toBeUndefined();
  });

  it("refuses unauthenticated deletion before any request is sent", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      deleteWebsiteMediaAsset(
        { accessToken: "", id: recordId, objectPath, referenceRecords: [] },
        fetchImpl,
      ),
    ).rejects.toThrow("Authentication required.");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
