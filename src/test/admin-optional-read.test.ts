import { describe, expect, it, vi } from "vitest";
import {
  keepPreviousOnFailure,
  readOptionalRows,
  summarizeLoadFailures,
} from "@/lib/admin-optional-read";

const rows = [{ id: "a" }, { id: "b" }];

describe("readOptionalRows", () => {
  it("returns every row when the read succeeds", async () => {
    await expect(readOptionalRows("Analytics", async () => rows)).resolves.toEqual({
      status: "ok",
      rows,
    });
  });

  it("treats an empty list as a real success, not a failure", async () => {
    await expect(readOptionalRows("Analytics", async () => [])).resolves.toEqual({
      status: "ok",
      rows: [],
    });
  });

  it("reports a failed request with a generic message and no raw detail", async () => {
    const result = await readOptionalRows("Subscribers", async () => {
      throw new Error("relation newsletter_subscribers does not exist; SELECT * FROM secret");
    });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.message).toContain("Subscribers could not be loaded");
      expect(result.message).not.toContain("relation");
      expect(result.message).not.toContain("SELECT");
    }
  });

  it("treats a non-list or malformed response as a failure", async () => {
    expect((await readOptionalRows("Revisions", async () => ({ message: "x" }))).status).toBe(
      "failed",
    );
    expect((await readOptionalRows("Revisions", async () => [1, 2])).status).toBe("failed");
  });

  it("succeeds on retry after an earlier failure", async () => {
    const read = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(rows);
    expect((await readOptionalRows("Notes", read)).status).toBe("failed");
    expect(await readOptionalRows("Notes", read)).toEqual({ status: "ok", rows });
  });
});

describe("keepPreviousOnFailure", () => {
  const previous = [{ id: "old" }];
  const map = (input: { id?: unknown }[]) => input.map((r) => ({ id: String(r.id) }));

  it("replaces previous data with a successful result", () => {
    expect(keepPreviousOnFailure(previous, { status: "ok", rows }, map)).toEqual([
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("replaces previous data with a successful empty result", () => {
    expect(keepPreviousOnFailure(previous, { status: "ok", rows: [] }, map)).toEqual([]);
  });

  it("keeps previously loaded data after a failed refresh", () => {
    const failed = { status: "failed" as const, label: "Media", message: "x" };
    expect(keepPreviousOnFailure(previous, failed, map)).toBe(previous);
  });
});

describe("summarizeLoadFailures", () => {
  it("is empty when nothing failed", () => {
    expect(summarizeLoadFailures([])).toBe("");
  });

  it("lists every failed module in one message", () => {
    const message = summarizeLoadFailures(["Revisions", "Analytics"]);
    expect(message).toContain("Revisions, Analytics");
    expect(message).toContain("Other modules are available");
  });
});
