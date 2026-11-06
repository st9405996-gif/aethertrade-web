import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseAvailabilityStatus, type AvailabilityStatus } from "@/lib/availability-status";
import { StatusBadge } from "@/components/site/status-badge";

const statuses: readonly (readonly [AvailabilityStatus, string])[] = [
  ["Available", "bg-success/10"],
  ["In Development", "bg-warning/10"],
  ["Custom Build", "bg-primary/10"],
  ["Planned", "bg-planned/10"],
];

describe("CMS availability statuses", () => {
  it.each(statuses)("renders %s with its matching style", (status, style) => {
    const { container } = render(<StatusBadge status={status} />);

    expect(container.firstChild).toHaveClass(style);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it.each(statuses)("parses %s as a supported status", (status) => {
    expect(parseAvailabilityStatus(status)).toBe(status);
  });

  it("does not interpret unknown CMS values as a supported status", () => {
    expect(parseAvailabilityStatus("Unavailable")).toBeUndefined();
  });
});
