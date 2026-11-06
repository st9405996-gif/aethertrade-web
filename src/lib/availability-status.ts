export type AvailabilityStatus = "Available" | "In Development" | "Custom Build" | "Planned";

export function parseAvailabilityStatus(value: string): AvailabilityStatus | undefined {
  const status = value.trim();
  switch (status) {
    case "Available":
    case "In Development":
    case "Custom Build":
    case "Planned":
      return status;
    default:
      return undefined;
  }
}
