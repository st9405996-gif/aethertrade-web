import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CmsPageRenderer } from "@/components/site/cms-page-renderer";
import type { PublishedCmsPage } from "@/lib/public-cms.functions";

const page: PublishedCmsPage = {
  slug: "custom-page",
  title: "Custom Page",
  body: "Contact support@aethertrade.cloud or visit https://aethertrade.cloud/help.",
  seoTitle: "",
  seoDescription: "",
  canonical: "",
  noindex: false,
  sections: [
    {
      id: "shipment-documents",
      title: "Shipment documents",
      body: "Review the uploaded document.",
      imageUrl: "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
      imageAlt: "Bill of lading",
      icon: "",
      group: "",
    },
  ],
  heroEyebrow: "",
  heroTitle: "",
  heroDescription: "",
  ctaTitle: "",
  ctaDescription: "",
};

describe("CMS page renderer media", () => {
  it("renders a same-origin image with its saved alt text and caption", () => {
    render(<CmsPageRenderer page={page} />);

    const image = screen.getByRole("img", { name: "Bill of lading" });
    expect(image).toHaveAttribute(
      "src",
      "/api/admin-supabase/storage/v1/object/public/website-media/user-1/photo.png",
    );
    expect(image).toHaveAttribute("loading", "lazy");
    expect(screen.getByText("Bill of lading")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "support@aethertrade.cloud" })).toHaveAttribute(
      "href",
      "mailto:support@aethertrade.cloud",
    );
    expect(screen.getByRole("link", { name: "https://aethertrade.cloud/help" })).toHaveAttribute(
      "href",
      "https://aethertrade.cloud/help",
    );
  });
});
