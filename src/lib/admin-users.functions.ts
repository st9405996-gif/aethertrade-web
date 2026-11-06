import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
<<<<<<< HEAD
=======
import { attemptInvitedUserRevocation } from "@/lib/admin-user-compensation";
import { readServerEnv } from "@/lib/server-env.server";
>>>>>>> origin/main

const OWNER_ID = "bfc5b3bb-aa5d-496a-ad0b-ac14834ea690";
const roleSchema = z.enum(["Administrator", "Content Editor", "Sales Manager", "Viewer"]);
const accessTokenSchema = z.string().min(30).max(4096);
const inviteSchema = z.object({
  email: z.email().max(254),
  role: roleSchema,
  accessToken: accessTokenSchema,
});
const ownerInput = z.object({ accessToken: accessTokenSchema });
const roleUpdateSchema = z.object({
  accessToken: accessTokenSchema,
  targetUserId: z.uuid(),
  role: roleSchema,
});
const removeSchema = z.object({ accessToken: accessTokenSchema, targetUserId: z.uuid() });

type AdminEnvironment = { baseUrl: string; publishableKey: string; serviceKey: string; siteUrl: string };
type AuthUser = { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> };
type RoleRow = { user_id: string; role: string };
export type AdminUserRecord = { userId: string; email: string; displayName: string; role: string; createdAt: string };

async function getAdminEnvironment(): Promise<AdminEnvironment> {
  const { readServerEnv } = await import("@/lib/server-env.server");
  const env = readServerEnv();
  const baseUrl = env["SUPABASE_URL"]?.replace(/\/+$/, "");
  const publishableKey = env["SUPABASE_PUBLISHABLE_KEY"];
  const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];
  const hostname = env["PUBLIC_SITE_HOSTNAME"];
  if (!baseUrl || !publishableKey || !serviceKey || !hostname || !/^[a-z0-9.-]+$/i.test(hostname)) {
    throw new Error("Secure administrator management is not configured on the server.");
  }
  return { baseUrl, publishableKey, serviceKey, siteUrl: "https://" + hostname.toLowerCase() };
}

async function verifyOwner(accessToken: string, env: AdminEnvironment): Promise<void> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const origin = getRequestHeader("origin");
  const host = getRequestHeader("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) throw new Error("Cross-origin administrator request rejected.");
    } catch {
      throw new Error("Administrator request origin could not be validated.");
    }
  }
  const response = await fetch(env.baseUrl + "/auth/v1/user", {
    headers: { apikey: env.publishableKey, Authorization: "Bearer " + accessToken, Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Your administrator session has expired. Sign in again.");
  const user = await response.json() as { id?: string };
  if (user.id !== OWNER_ID) throw new Error("Only the account owner can manage administrator accounts.");
}

function serviceHeaders(env: AdminEnvironment): Record<string, string> {
  return {
    apikey: env.serviceKey,
    Authorization: "Bearer " + env.serviceKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

const inviteRate = new Map<string, { startedAt: number; count: number }>();
function consumeInviteLimit(now = Date.now()): boolean {
  const current = inviteRate.get(OWNER_ID);
  if (!current || now - current.startedAt >= 60 * 60 * 1000) {
    inviteRate.set(OWNER_ID, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export const inviteAdminUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) throw new Error("Enter a valid email and an allowed administrator role.");
    return { ...parsed.data, email: parsed.data.email.trim().toLowerCase() };
  })
  .handler(async ({ data }) => {
    const env = await getAdminEnvironment();
    await verifyOwner(data.accessToken, env);
    if (!consumeInviteLimit()) throw new Error("Invitation limit reached. Try again later.");

    const inviteUrl = new URL(env.baseUrl + "/auth/v1/invite");
    inviteUrl.searchParams.set("redirect_to", env.siteUrl + "/reset-password");
    const response = await fetch(inviteUrl, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify({ email: data.email }),
    });
    const payload = await response.json().catch(() => null) as { id?: string; user?: { id?: string } } | null;
    if (!response.ok) {
      if (response.status === 409 || response.status === 422) throw new Error("This email may already have an account or invitation.");
      throw new Error("Supabase could not send the administrator invitation.");
    }
    const invitedUserId = payload?.id ?? payload?.user?.id;
    if (!invitedUserId || !z.uuid().safeParse(invitedUserId).success) {
      throw new Error("The invitation response did not include a valid user ID.");
    }

    const roleResponse = await fetch(env.baseUrl + "/rest/v1/rpc/admin_manage_user_role", {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify({ p_actor_id: OWNER_ID, p_target_user_id: invitedUserId, p_target_role: data.role, p_operation: "INVITE" }),
    });
    const rolePayload = await roleResponse.json().catch(() => null) as { success?: boolean } | null;
    if (!roleResponse.ok || rolePayload?.success !== true) {
      const revoked = await attemptInvitedUserRevocation(
        env.baseUrl + "/auth/v1/admin/users/" + invitedUserId,
        serviceHeaders(env),
      );
      throw new Error(
        revoked
          ? "The role assignment failed; the invitation was revoked."
          : "The role assignment failed, but invitation revocation could not be confirmed. Contact the project owner before retrying.",
      );
    }
    return { success: true as const, email: data.email, role: data.role };
  });

export const listAdminUsers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = ownerInput.safeParse(input);
    if (!parsed.success) throw new Error("Invalid administrator session.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const env = await getAdminEnvironment();
    await verifyOwner(data.accessToken, env);
    const roleUrl = new URL(env.baseUrl + "/rest/v1/user_roles");
    roleUrl.searchParams.set("select", "user_id,role");
    roleUrl.searchParams.set("order", "role.asc");
    const [rolesResponse, usersResponse] = await Promise.all([
      fetch(roleUrl, { headers: serviceHeaders(env) }),
      fetch(env.baseUrl + "/auth/v1/admin/users?page=1&per_page=100", { headers: serviceHeaders(env) }),
    ]);
    if (!rolesResponse.ok || !usersResponse.ok) throw new Error("Administrator list could not be loaded.");
    const roleRows = z.array(z.object({ user_id: z.uuid(), role: z.string() })).safeParse(await rolesResponse.json());
    const userPayload = await usersResponse.json() as { users?: AuthUser[] };
    if (!roleRows.success || !Array.isArray(userPayload.users)) throw new Error("Administrator list response was invalid.");
    return roleRows.data.map((row): AdminUserRecord => {
      const user = userPayload.users?.find(candidate => candidate.id === row.user_id);
      const metadataName = typeof user?.user_metadata?.["full_name"] === "string" ? user.user_metadata["full_name"] as string : "";
      return {
        userId: row.user_id,
        email: user?.email ?? "Email unavailable",
        displayName: metadataName || user?.email || "Administrator",
        role: row.role,
        createdAt: user?.created_at ?? "",
      };
    });
  });

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = roleUpdateSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid role change request.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const env = await getAdminEnvironment();
    await verifyOwner(data.accessToken, env);
    if (data.targetUserId === OWNER_ID) throw new Error("The owner account role cannot be changed.");
    const response = await fetch(env.baseUrl + "/rest/v1/rpc/admin_manage_user_role", {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify({ p_actor_id: OWNER_ID, p_target_user_id: data.targetUserId, p_target_role: data.role, p_operation: "ROLE_UPDATE" }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean } | null;
    if (!response.ok || payload?.success !== true) throw new Error("Administrator role could not be updated.");
    return { success: true as const, role: data.role };
  });

export const removeAdminUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = removeSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid administrator removal request.");
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const env = await getAdminEnvironment();
    await verifyOwner(data.accessToken, env);
    if (data.targetUserId === OWNER_ID) throw new Error("The owner account cannot be removed.");
    const response = await fetch(env.baseUrl + "/rest/v1/rpc/admin_manage_user_role", {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify({ p_actor_id: OWNER_ID, p_target_user_id: data.targetUserId, p_target_role: null, p_operation: "ROLE_REVOKE" }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean } | null;
    if (!response.ok || payload?.success !== true) throw new Error("Administrator access could not be revoked.");
    return { success: true as const };
  });
