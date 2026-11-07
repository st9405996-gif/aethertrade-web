import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "supabase", "migrations");

describe("timestamped Supabase migrations", () => {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  it("uses the 14-digit timestamp naming convention", () => {
    for (const file of files) {
      expect(file, file).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
    }
  });

  it("has unique versions so no two migrations share a timestamp", () => {
    const versions = files.map((file) => file.slice(0, 14));
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("includes the public careers listing view required by the Careers page", () => {
    const careers = files.find((file) => file.includes("public_career_listing_view"));
    expect(careers).toBeDefined();
    const sql = readFileSync(join(migrationsDir, careers as string), "utf8");
    expect(sql).toContain("create or replace view public.public_career_listings");
    expect(sql).toContain(
      "revoke all on public.public_career_listings from public, anon, authenticated, service_role",
    );
  });

  it("does not reintroduce direct anonymous access to careers content rows", () => {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf8").toLowerCase();
      expect(sql, file).not.toMatch(/grant\s+select[^;]*on\s+public\.content_records\s+to\s+anon/);
    }
  });
});
