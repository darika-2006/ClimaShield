/**
 * Supabase Client Initialization for Google OAuth 2.0 PKCE
 */
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://jfgavbihpdwcwintphdv.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2F2YmlocGR3Y3dpbnRwaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExOTI3OTUsImV4cCI6MjEwNjc2ODc5NX0.GZEy6lzh86BtKrv8FXk7-joLN2Dd9CC-6d1r5OGXCxE';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = {
  auth: {
    signInWithOAuth: async ({ provider = 'google', options = {} }) => {
      const redirectTo = options?.redirectTo || `${window.location.origin}/auth/callback`;
      const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
      window.location.href = authorizeUrl;
      return { data: { url: authorizeUrl }, error: null };
    },
    getSession: async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');

      if (accessToken) {
        try {
          const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: supabaseAnonKey,
            },
          });
          const user = await res.json();
          if (user && user.email) {
            return { data: { session: { user, access_token: accessToken } }, error: null };
          }
        } catch (e) {
          console.error('Error fetching Supabase user:', e);
        }
      }
      return { data: { session: null }, error: null };
    },
  },
};
