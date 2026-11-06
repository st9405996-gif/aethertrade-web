import { describe, expect, it, vi } from "vitest";
import { fetchPublicCareerListings } from "@/lib/public-careers.functions";

const recordId = "6a86e6f4-4bdc-4c79-b8ac-3b94d6b7e531";

describe("public career listing reader", () => {
  it("queries only the public listing view with a publishable key", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: recordId,
            title: "Operations Analyst",
            body: "Coordinate operations.",
            location: "Remote",
            type: "Full-time",
            position: 2,
            private_note: "must not be forwarded",
          },
        ]),
        { status: 200 },
      ),
    );

    await expect(
      fetchPublicCareerListings("https://supabase.example.test/", "public-test-key", fetchImpl),
    ).resolves.toEqual([
      {
        id: recordId,
        title: "Operations Analyst",
        body: "Coordinate operations.",
        location: "Remote",
        type: "Full-time",
        position: 2,
      },
    ]);

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    expect(String(requestUrl)).toContain("/rest/v1/public_career_listings?");
    expect(String(requestUrl)).toContain("select=id%2Ctitle%2Cbody%2Clocation%2Ctype%2Cposition");
    expect(requestInit?.headers).toEqual({
      apikey: "public-test-key",
      Authorization: "Bearer public-test-key",
      Accept: "application/json",
    });
  });

  it("reports non-success listing responses instead of returning an empty list", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("denied", { status: 403 }));

    await expect(
      fetchPublicCareerListings("https://supabase.example.test", "public-test-key", fetchImpl),
    ).rejects.toThrow("Public career listing request failed with status 403.");
  });

  it("rejects malformed listing rows", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([{ id: recordId, title: "Missing required fields" }]), {
        status: 200,
      }),
    );

    await expect(
      fetchPublicCareerListings("https://supabase.example.test", "public-test-key", fetchImpl),
    ).rejects.toThrow("Public career listing response contained an invalid record at row 1.");
  });
});
