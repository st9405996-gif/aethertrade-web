import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readAuditRows } from "@/lib/admin-audit";

const foundationSql = readFileSync(
  join(process.cwd(), "docs", "database", "001-foundation.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("readAuditRows", () => {
  it("preserves a valid empty result as available", async () => {
    await expect(readAuditRows(async () => [])).resolves.toEqual({
      status: "available",
      rows: [],
      error: "",
    });
  });

  it("returns valid database audit rows as available", async () => {
    const rows = [
      {
        id: "audit-1",
        action: "UPDATE",
        module: "pages",
        created_at: "2026-11-06T12:00:00Z",
      },
    ];

    await expect(readAuditRows(async () => rows)).resolves.toEqual({
      status: "available",
      rows,
      error: "",
    });
  });

  it.each([
    [
      "request failure",
      async () => {
        throw new Error("database denied");
      },
    ],
    ["non-list response", async () => ({ records: [] })],
    ["malformed row", async () => [null]],
    ["incomplete row", async () => [{ id: "audit-1" }]],
  ])("returns an explicit unavailable state for %s", async (_label, read) => {
    await expect(readAuditRows(read)).resolves.toEqual({
      status: "unavailable",
      rows: [],
      error: "Audit history could not be loaded. Check access and connection.",
    });
  });

  describe("audit log SQL contract", () => {
    it("restricts audit reads to authenticated users with publish permission", () => {
      expect(foundationSql).toContain(
        "create policy \"administrators read audit\" on public.audit_logs for select to authenticated using(public.has_permission('publish'))",
      );
      expect(foundationSql).toContain("alter table public.audit_logs enable row level security");
      expect(foundationSql).not.toMatch(/grant [^;]*on public\.audit_logs to anon/);
    });

    it("records content-record create, update, and delete operations", () => {
      expect(foundationSql).toContain(
        "create trigger content_change_audit after insert or update or delete on public.content_records",
      );
      expect(foundationSql).toContain(
        "insert into public.audit_logs(actor_id,action,record_id,module)",
      );
    });
  });
});
