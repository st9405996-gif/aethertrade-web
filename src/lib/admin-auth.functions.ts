import { createServerFn } from "@tanstack/react-start";
import { readServerEnv } from "@/lib/server-env.server";

/** Returns only the public Supabase connection details. Never exposes the service-role key. */
export const getAdminPublicConfig = createServerFn({ method: "GET" }).handler(() => {
  const env = readServerEnv();
  const url = env["SUPABASE_URL"]?.replace(/\/$/, "");
  const key = env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key)
    throw new Error("Supabase public connection settings are missing from the Cloudflare Worker.");
  return { url, key };
});
