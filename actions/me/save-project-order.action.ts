'use server';

import { getSession } from '@/lib/auth';

export async function saveProjectOrderAction(
  workspaceId: string,
  projectIds: string[],
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/project-order`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspaceId, projectIds }),
    });
  } catch {
    // fire-and-forget — silently ignore errors
  }
}
