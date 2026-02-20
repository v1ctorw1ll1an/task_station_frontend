import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  isSuperuser: boolean;
  mustResetPassword: boolean;
}

export interface Session {
  token: string;
  user: SessionUser;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const userRaw = cookieStore.get('user')?.value;

  if (!token || !userRaw) return null;

  try {
    const user = JSON.parse(userRaw) as SessionUser;
    return { token, user };
  } catch {
    return null;
  }
}
