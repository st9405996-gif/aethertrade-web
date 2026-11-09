import { describe, expect, it } from "vitest";
import { createCmsPagePreview } from "@/lib/cms-page-preview";
import type { ContentRecord, MediaRecord } from "@/lib/workspace-model";

const page: ContentRecord = {
  id: "page-1",
  module: "pages",
  title: "About AETHER-TRADE",
  slug: "about",
  body: " Page introduction ",
  category: "",
  publication: "Draft",
  availability: "Planned",
  seoTitle: "About",
  seoDescription: "About our company",
  canonical: "",
  noindex: true,
  position: 0,
  scheduledAt: "",
  updatedAt: "",
  fields: {
    sections: JSON.stringify([
      {
        id: "section-one",
        title: "Our approach",
        body: "Operational automation",
        imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/page/approach.png",
        imageAlt: "Operations dashboard",
      },
    ]),
  },
};

const media: MediaRecord[] = [
  {
    id: "media-1",
    name: "approach.png",
    type: "image/png",
    size: 1024,
    alt: "Operations dashboard",
    url: "/api/admin-supabase/storage/v1/object/public/website-media/page/approach.png",
    bucketId: "website-media",
    objectPath: "page/approach.png",
    deletionStatus: "active",
  },
];

describe("createCmsPagePreview", () => {
  it("maps draft page content to the public renderer shape and preserves ordered sections", () => {
    expect(createCmsPagePreview(page, media)).toEqual({
      slug: "about",
      title: "About AETHER-TRADE",
      body: "Page introduction",
      seoTitle: "About",
      seoDescription: "About our company",
      canonical: "",
      noindex: true,
      sections: [
        {
          id: "section-one",
          title: "Our approach",
          body: "Operational automation",
          imageUrl: media[0]!.url,
          imageAlt: "Operations dashboard",
          icon: "",
          group: "",
        },
      ],
      heroEyebrow: "",
      heroTitle: "",
      heroDescription: "",
      ctaTitle: "",
      ctaDescription: "",
    });
  });

  it("omits unregistered and malformed image URLs", () => {
    const source = {
      ...page,
      fields: {
        sections: JSON.stringify([
          { title: "External", imageUrl: "https://images.example.test/photo.png" },
          {
            title: "Unregistered",
            imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/other.png",
          },
        ]),
      },
    };

    expect(createCmsPagePreview(source, media)?.sections).toEqual([
      {
        id: "section-0",
        title: "External",
        body: "",
        imageUrl: "",
        imageAlt: "External",
        icon: "",
        group: "",
      },
      {
        id: "section-1",
        title: "Unregistered",
        body: "",
        imageUrl: "",
        imageAlt: "Unregistered",
        icon: "",
        group: "",
      },
    ]);
  });

  it("fails safely for malformed section JSON and declines non-page modules", () => {
    expect(createCmsPagePreview({ ...page, fields: { sections: "{" } }, media)?.sections).toEqual(
      [],
    );
    expect(createCmsPagePreview({ ...page, module: "services" }, media)).toBeNull();
  });
});
