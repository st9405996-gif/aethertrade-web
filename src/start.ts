import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// The largest legitimate submission is a few kilobytes of validated form fields;
// anything larger is abuse and is rejected before the body is parsed. Requests
// without a content-length header (chunked) are bounded by the platform and the WAF.
const MAX_BODY_BYTES = 128 * 1024;
const bodySizeMiddleware = createMiddleware().server(async ({ request, handlerType, next }) => {
  const declared = request.headers.get("content-length");
  if (handlerType === "serverFn" && declared !== null && Number(declared) > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "content-type": "application/json" },
    });
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, bodySizeMiddleware, csrfMiddleware],
}));
