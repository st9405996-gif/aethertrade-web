export interface ConnectionReadiness {
  database: "Loaded this session" | "Not checked";
  authentication: "Session verified" | "No verified session";
  mediaStorage: "Not probed";
  worker: "Not probed";
}

export interface DeliveryReadiness {
  status: "Checking" | "Configured · not tested" | "Unavailable";
  description: string;
}

export function getConnectionReadiness(authenticated: boolean): ConnectionReadiness {
  return {
    database: authenticated ? "Loaded this session" : "Not checked",
    authentication: authenticated ? "Session verified" : "No verified session",
    mediaStorage: "Not probed",
    worker: "Not probed",
  };
}

export function getInquiryDeliveryReadiness(
  delivery: { mode: "live" | "demo" } | undefined,
  failed: boolean,
): DeliveryReadiness {
  if (failed) {
    return {
      status: "Unavailable",
      description: "The server-side inquiry delivery configuration could not be checked.",
    };
  }
  if (!delivery) {
    return {
      status: "Checking",
      description: "Checking the server-side inquiry delivery configuration.",
    };
  }
  if (delivery.mode === "live") {
    return {
      status: "Configured · not tested",
      description:
        "Server configuration reports live mode. Actual email deliverability has not been verified with a test message.",
    };
  }
  return {
    status: "Unavailable",
    description:
      "The inquiry service is not configured for live delivery; the public form will not claim that submissions are sent.",
  };
}
