import { describe, expect, it } from "vitest";
import { restoreRevisionAsDraft } from "@/lib/revision-restore";
import { makeRecord } from "@/lib/workspace-model";

describe("restoreRevisionAsDraft", () => {
  it("preserves the historical record fields while restoring only as a draft", () => {
    const snapshot = {
      ...makeRecord("pages", "Existing page", "Historical body", 4),
      publication: "Published" as const,
      seoTitle: "Historical title",
      fields: { hero: "Historical hero" },
    };

    expect(restoreRevisionAsDraft(snapshot)).toEqual({
      ...snapshot,
      publication: "Draft",
    });
    expect(snapshot.publication).toBe("Published");
  });
});
