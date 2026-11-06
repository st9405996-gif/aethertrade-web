import { describe, expect, it } from "vitest";
import { FAQS } from "@/content/site-content";
import { resolvePublicFaqs } from "@/lib/public-faqs";

describe("resolvePublicFaqs", () => {
  it("uses the static FAQs when CMS items are missing or empty", () => {
    expect(resolvePublicFaqs(undefined)).toBe(FAQS);
    expect(resolvePublicFaqs([])).toBe(FAQS);
  });

  it("maps published CMS FAQ titles and bodies", () => {
    expect(resolvePublicFaqs([{ title: "CMS question", body: "CMS answer" }])).toEqual([
      { q: "CMS question", a: "CMS answer" },
    ]);
  });
});
