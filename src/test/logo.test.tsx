import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Logo } from "@/components/site/logo";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("AETHER-TRADE logo", () => {
  it("preserves the original mark and wordmark independently of CMS labels", () => {
    render(<Logo />);

    const link = screen.getByRole("link", { name: "AETHER-TRADE home" });
    expect(link).toHaveTextContent("AETHER-TRADE");
    expect(link).toHaveTextContent("GLOBAL TRADE TECHNOLOGY");
    expect(link.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("Company identity")).not.toBeInTheDocument();
  });
});
