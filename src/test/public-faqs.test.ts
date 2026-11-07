import { describe, expect, it } from "vitest";
import { resolvePublicFaqs } from "@/lib/public-faqs";

describe("resolvePublicFaqs", () => {
  it("returns no public FAQ content when the published CMS result is empty", () => {
    expect(resolvePublicFaqs(undefined)).toEqual([]);
    expect(resolvePublicFaqs([])).toEqual([]);
  });

  it("maps published CMS FAQ titles and bodies", () => {
    expect(resolvePublicFaqs([{ title: "CMS question", body: "CMS answer" }])).toEqual([
      { q: "CMS question", a: "CMS answer" },
    ]);
  });
});
