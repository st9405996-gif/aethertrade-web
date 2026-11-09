import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkifiedText } from "@/components/site/linkified-text";

describe("LinkifiedText", () => {
  it("turns email addresses into mailto links", () => {
    render(<p><LinkifiedText text="Email business@aethertrade.cloud for details." /></p>);
    expect(screen.getByRole("link", { name: "business@aethertrade.cloud" })).toHaveAttribute(
      "href",
      "mailto:business@aethertrade.cloud",
    );
  });

  it("turns phone numbers into tel links", () => {
    render(<p><LinkifiedText text="Call +92 300 1234567 today." /></p>);
    expect(screen.getByRole("link", { name: "+92 300 1234567" })).toHaveAttribute(
      "href",
      "tel:+923001234567",
    );
  });

  it("turns web addresses into safe external links and keeps trailing punctuation", () => {
    const { container } = render(<p><LinkifiedText text="Visit https://example.com/about." /></p>);
    const link = screen.getByRole("link", { name: "https://example.com/about" });
    expect(link).toHaveAttribute("href", "https://example.com/about");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector("p")?.textContent).toBe("Visit https://example.com/about.");
  });

  it("does not convert unsupported schemes into links", () => {
    render(<p><LinkifiedText text="javascript:alert(1)" /></p>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
