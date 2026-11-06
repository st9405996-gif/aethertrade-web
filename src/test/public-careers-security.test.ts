import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundationSql = readFileSync(
  join(process.cwd(), "docs", "database", "001-foundation.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();
const migrationSql = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20261106120000_public_career_listing_view.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("public Careers SQL security contract", () => {
  it("keeps anonymous table RLS limited to the existing published modules", () => {
    const policy = foundationSql.match(/create policy "published content only"[^;]*;/)?.[0];

    expect(policy).toBeDefined();
    expect(policy).toContain("publication='published'");
    expect(policy).toContain("module in");
    expect(policy).not.toContain("'careers'");
    expect(migrationSql).not.toMatch(/create policy[^;]*on public\.content_records/);
    expect(migrationSql).not.toMatch(/grant [^;]*on public\.content_records/);
  });

  it("uses an explicitly owner-backed security-barrier view with strict filters", () => {
    expect(migrationSql).toContain("alter view public.public_website_settings owner to postgres");
    expect(migrationSql).toContain(
      "alter view public.public_website_settings set (security_barrier = true, security_invoker = false)",
    );
    expect(migrationSql).toContain("with (security_barrier = true, security_invoker = false)");
    expect(migrationSql).toContain("alter view public.public_career_listings owner to postgres");
    expect(migrationSql).toContain("jobs.module = 'careers'");
    expect(migrationSql).toContain("jobs.publication = 'published'::public.publication_status");
    expect(migrationSql).toContain("jobs.noindex = false");
    expect(migrationSql).toContain("settings.careers_enabled is true");
  });

  it("exposes only the approved listing columns through the view", () => {
    const viewDefinition = migrationSql.match(
      /create or replace view public\.public_career_listings[\s\S]*?;/,
    )?.[0];

    expect(viewDefinition).toBeDefined();
    for (const column of [
      "jobs.id",
      "jobs.title",
      "jobs.body",
      "jobs.fields ->> 'location'",
      "jobs.fields ->> 'type'",
      "jobs.position",
    ]) {
      expect(viewDefinition).toContain(column);
    }
    expect(viewDefinition).not.toContain("jobs.fields,");
    expect(viewDefinition).not.toContain("jobs.slug");
    expect(viewDefinition).not.toContain("jobs.category");
    expect(viewDefinition).not.toContain("job_applications");
  });

  it("grants anonymous reads only on the filtered view and leaves applications untouched", () => {
    expect(migrationSql).toContain(
      "revoke all on public.public_career_listings from public, anon, authenticated, service_role",
    );
    expect(migrationSql).toContain("grant select on public.public_career_listings to anon");
    expect(migrationSql).not.toContain("job_applications");
    expect(foundationSql).toContain("grant all on public.job_applications to service_role");
  });
});
