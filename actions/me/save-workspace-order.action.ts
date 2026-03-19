'use server';

import { getSession } from '@/lib/auth';

export async function saveWorkspaceOrderAction(
  companyId: string,
  workspaceIds: string[],
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/workspace-order`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId, workspaceIds }),
    });
  } catch {
    // fire-and-forget — silently ignore errors
  }
}
