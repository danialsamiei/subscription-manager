import NextAuth, { NextAuthOptions } from 'next-auth';

// Orcest AI SSO - OIDC Provider (Authentik at login.orcest.ai)
// Uses LOGIN_SSO_URL from Render env group (orcest-ai-shared-apis)
const SSO_BASE = process.env.LOGIN_SSO_URL || process.env.ORCEST_SSO_ISSUER || 'https://login.orcest.ai';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'orcest-sso',
      name: 'Orcest AI SSO',
      type: 'oauth',
      wellKnown: `${SSO_BASE}/application/o/subcorist/.well-known/openid-configuration`,
      clientId: process.env.ORCEST_SSO_CLIENT_ID || 'subcorist',
      clientSecret: process.env.ORCEST_SSO_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture || null,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;
      }
      if (profile) {
        token.preferred_username = (profile as any).preferred_username;
        token.groups = (profile as any).groups || [];
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).provider = token.provider;
      (session as any).groups = token.groups || [];
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).preferred_username = token.preferred_username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'subcorist-orcest-ai-secret-key-change-in-production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
