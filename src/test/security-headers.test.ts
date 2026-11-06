import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, withSecurityHeaders } from "@/lib/security-headers";

describe("withSecurityHeaders", () => {
  it("adds the baseline headers to HTML responses and keeps the body", async () => {
    const original = new Response("<h1>ok</h1>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
    const secured = withSecurityHeaders(original);

    expect(secured.status).toBe(200);
    expect(secured.headers.get("content-type")).toBe("text/html");
    expect(secured.headers.get("x-frame-options")).toBe("DENY");
    expect(secured.headers.get("x-content-type-options")).toBe("nosniff");
    expect(secured.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(secured.headers.get("strict-transport-security")).toContain("max-age=");
    expect(await secured.text()).toBe("<h1>ok</h1>");
  });

  it("does not overwrite a header a route has already set", () => {
    const original = new Response("x", { headers: { "x-frame-options": "SAMEORIGIN" } });
    expect(withSecurityHeaders(original).headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });

  it("prohibits framing and restricts object embedding in the content security policy", () => {
    const csp = SECURITY_HEADERS["Content-Security-Policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("default-src 'self'");
  });
});

describe("content security policy for the production architecture", () => {
  it("allows Turnstile script, widget frame and API calls, and nothing else external", () => {
    const csp = SECURITY_HEADERS["Content-Security-Policy"] ?? "";
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).toContain("connect-src 'self' https://challenges.cloudflare.com");
    const directives = Object.fromEntries(csp.split(";").map((d) => d.trim().split(" ")));
    const imgSrcDirective = csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("img-src "));
    expect(imgSrcDirective).toBe("img-src 'self' data: blob:");
    expect(directives["form-action"]).toBe("'self'");
  });
});
