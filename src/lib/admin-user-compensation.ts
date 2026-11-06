export async function attemptInvitedUserRevocation(
  url: string,
  headers: HeadersInit,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(url, { method: "DELETE", headers });
    return response.ok;
  } catch {
    return false;
  }
}
