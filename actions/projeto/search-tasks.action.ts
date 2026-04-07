'use server';

import { getMyTasksAction } from '@/actions/me/get-my-tasks.action';

export async function searchTasksAction(companyId: string, query: string) {
  return getMyTasksAction(companyId, 1, 10, query);
}
