import { describe, expect, it } from "vitest";
import {
  createSubscriberSubscriptionPlan,
  createSubscriberUnsubscribePlan,
  parseExistingSubscriberLookup,
} from "@/lib/subscriber-consent";

const subscriberId = "6a86e6f4-4bdc-4c79-b8ac-3b94d6b7e531";

describe("subscriber consent lifecycle", () => {
  it("parses only an exact, unique lookup result", () => {
    expect(
      parseExistingSubscriberLookup(
        [{ id: subscriberId, email: "reviewer@example.com", status: "unsubscribed" }],
        "reviewer@example.com",
      ),
    ).toEqual({
      id: subscriberId,
      email: "reviewer@example.com",
      status: "unsubscribed",
    });
    expect(() => parseExistingSubscriberLookup({}, "reviewer@example.com")).toThrow(
      "Subscriber lookup returned an invalid response.",
    );
    expect(() =>
      parseExistingSubscriberLookup(
        [
          { id: subscriberId, email: "reviewer@example.com", status: "unsubscribed" },
          { id: subscriberId, email: "reviewer@example.com", status: "unsubscribed" },
        ],
        "reviewer@example.com",
      ),
    ).toThrow("Subscriber lookup returned an invalid response.");
    expect(() =>
      parseExistingSubscriberLookup(
        [{ id: subscriberId, email: "other@example.com", status: "unsubscribed" }],
        "reviewer@example.com",
      ),
    ).toThrow("Subscriber lookup returned an unexpected email.");
  });

  it("normalizes the email and requires consent before creating a subscription", () => {
    expect(createSubscriberSubscriptionPlan("  REVIEWER@EXAMPLE.COM ", true, null)).toEqual({
      email: "reviewer@example.com",
      existingId: null,
    });
    expect(() => createSubscriberSubscriptionPlan("reviewer@example.com", false, null)).toThrow(
      "Confirm that the email owner gave permission",
    );
  });

  it("rejects malformed email addresses", () => {
    expect(() => createSubscriberSubscriptionPlan("not-an-email", true, null)).toThrow(
      "Enter a valid email address.",
    );
  });

  it("prevents duplicate active subscriptions", () => {
    expect(() =>
      createSubscriberSubscriptionPlan("reviewer@example.com", true, {
        id: subscriberId,
        email: "reviewer@example.com",
        status: "subscribed",
      }),
    ).toThrow("This email is already subscribed.");
  });

  it("allows re-subscription only for a valid previously unsubscribed record and fresh consent", () => {
    expect(
      createSubscriberSubscriptionPlan("reviewer@example.com", true, {
        id: subscriberId,
        email: "reviewer@example.com",
        status: "unsubscribed",
      }),
    ).toEqual({ email: "reviewer@example.com", existingId: subscriberId });
    expect(() =>
      createSubscriberSubscriptionPlan("reviewer@example.com", false, {
        id: subscriberId,
        email: "reviewer@example.com",
        status: "unsubscribed",
      }),
    ).toThrow("Confirm that the email owner gave permission");
  });

  it("fails closed for malformed subscriber lookup records", () => {
    expect(() =>
      createSubscriberSubscriptionPlan("reviewer@example.com", true, {
        id: "invalid-id",
        email: "reviewer@example.com",
        status: "unsubscribed",
      }),
    ).toThrow("Subscriber lookup returned an invalid record.");
    expect(() =>
      createSubscriberSubscriptionPlan("reviewer@example.com", true, {
        id: subscriberId,
        email: "reviewer@example.com",
        status: "unknown",
      }),
    ).toThrow("Subscriber lookup returned an invalid status.");
  });

  it("allows unsubscribe but rejects re-subscription through the status mutation", () => {
    expect(createSubscriberUnsubscribePlan(subscriberId, "unsubscribed")).toEqual({
      id: subscriberId,
      status: "unsubscribed",
    });
    expect(() => createSubscriberUnsubscribePlan(subscriberId, "subscribed")).toThrow(
      "Re-subscribing requires confirming fresh consent",
    );
    expect(() => createSubscriberUnsubscribePlan("invalid-id", "unsubscribed")).toThrow(
      "Invalid subscriber record.",
    );
  });
});
