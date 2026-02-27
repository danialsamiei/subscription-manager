import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get current session on server side
export async function getSession() {
  return await getServerSession(authOptions);
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

// Get current user info
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;
  return {
    id: (session.user as any).id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    preferredUsername: (session.user as any).preferred_username,
    groups: (session as any).groups || [],
    accessToken: (session as any).accessToken,
  };
}
