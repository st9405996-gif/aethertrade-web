const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ExistingSubscriber {
  id: unknown;
  status: unknown;
  email: unknown;
}

export function parseExistingSubscriberLookup(
  value: unknown,
  expectedEmail: string,
): ExistingSubscriber | null {
  if (!Array.isArray(value) || value.length > 1) {
    throw new Error("Subscriber lookup returned an invalid response.");
  }
  if (value.length === 0) return null;

  const record = value[0];
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    throw new Error("Subscriber lookup returned an invalid record.");
  }
  const subscriber = record as Record<string, unknown>;
  if (subscriber["email"] !== expectedEmail) {
    throw new Error("Subscriber lookup returned an unexpected email.");
  }
  return {
    id: subscriber["id"],
    status: subscriber["status"],
    email: subscriber["email"],
  };
}

export interface SubscriberSubscriptionPlan {
  email: string;
  existingId: string | null;
}

export function createSubscriberSubscriptionPlan(
  email: string,
  consentConfirmed: boolean,
  existing: ExistingSubscriber | null,
): SubscriberSubscriptionPlan {
  if (!consentConfirmed) {
    throw new Error("Confirm that the email owner gave permission before adding them.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (
    normalizedEmail.length < 5 ||
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw new Error("Enter a valid email address.");
  }

  if (!existing) return { email: normalizedEmail, existingId: null };
  if (typeof existing.id !== "string" || !uuidPattern.test(existing.id)) {
    throw new Error("Subscriber lookup returned an invalid record.");
  }
  if (existing.email !== normalizedEmail) {
    throw new Error("Subscriber lookup returned an unexpected email.");
  }
  if (existing.status === "subscribed") {
    throw new Error("This email is already subscribed.");
  }
  if (existing.status !== "unsubscribed") {
    throw new Error("Subscriber lookup returned an invalid status.");
  }
  return { email: normalizedEmail, existingId: existing.id };
}

export function createSubscriberUnsubscribePlan(
  id: string,
  status: string,
): { id: string; status: "unsubscribed" } {
  if (!uuidPattern.test(id)) throw new Error("Invalid subscriber record.");
  if (status !== "unsubscribed") {
    throw new Error(
      "Re-subscribing requires confirming fresh consent through the add-subscriber form.",
    );
  }
  return { id, status: "unsubscribed" };
}
