import { describe, expect, it, vi } from "vitest";
import { writeAdminRecord } from "@/lib/admin-mutations";

const recordId = "6a86e6f4-4bdc-4c79-b8ac-3b94d6b7e531";

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
