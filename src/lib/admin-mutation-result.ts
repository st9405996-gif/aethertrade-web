export type AdminMutationOutcome = { status: "success" } | { status: "failure"; error: unknown };

export async function executeAdminMutation(
  operation: () => void | Promise<void>,
): Promise<AdminMutationOutcome> {
  try {
    await operation();
    return { status: "success" };
  } catch (error) {
    return { status: "failure", error };
  }
}
