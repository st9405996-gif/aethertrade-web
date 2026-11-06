import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundationSql = readFileSync(
  join(process.cwd(), "docs", "database", "001-foundation.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();
const grantsSql = readFileSync(
  join(process.cwd(), "docs", "database", "005-harden-table-grants.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("content revision SQL contract", () => {
  it("stores an immutable row snapshot with its record and module identifiers", () => {
    const table = foundationSql.match(/create table public\.content_revisions \((.*?)\);/)?.[1];

    expect(table).toContain("record_id uuid not null");
    expect(table).toContain("module text not null");
    expect(table).toContain("snapshot jsonb not null");
    expect(table).not.toContain("on delete cascade");
  });

  it("limits revision reads to authenticated editors through RLS", () => {
    expect(foundationSql).toContain(
      'create policy "editors read content history" on public.content_revisions for select to authenticated',
    );
    expect(foundationSql).toContain(
      "alter table public.content_revisions enable row level security",
    );
    expect(grantsSql).toContain("grant select on public.content_revisions to authenticated");
    expect(grantsSql).not.toMatch(/grant [^;]*on public\.content_revisions to anon/);
  });

  it("captures the old content row atomically for both updates and deletes", () => {
    const functionBody = foundationSql.match(
      /create function public\.audit_content_change\(\).*?\$\$(.*?)\$\$;/,
    )?.[1];

    expect(functionBody).toContain("tg_op in ('update','delete')");
    expect(functionBody).toContain("to_jsonb(old)");
    expect(functionBody).toContain("return old");
    expect(foundationSql).toContain(
      "create trigger content_change_audit after insert or update or delete on public.content_records",
    );
  });

  it("does not grant anonymous access to the revision table", () => {
    expect(foundationSql).not.toMatch(/grant [^;]*on public\.content_revisions to anon/);
    expect(grantsSql).toContain(
      "revoke all on all tables in schema public from anon, authenticated",
    );
  });
});
