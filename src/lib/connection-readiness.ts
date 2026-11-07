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

export interface WorkspaceSessionReadiness {
  label: "Checking" | "Session loaded" | "Not verified";
  description: string;
}

export function getWorkspaceSessionReadiness(
  ready: boolean,
  authenticated: boolean,
): WorkspaceSessionReadiness {
  if (!ready) {
    return {
      label: "Checking",
      description: "Verifying the administrator session and loading workspace data.",
    };
  }
  if (!authenticated) {
    return {
      label: "Not verified",
      description: "No verified administrator session is available.",
    };
  }
  return {
    label: "Session loaded",
    description:
      "Workspace data was loaded for this authenticated session. This is not a continuous health check.",
  };
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
