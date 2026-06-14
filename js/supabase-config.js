const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getUserProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function requireAuth(redirectTo = 'login.html') {
  const session = await getSession();
  if (!session) { window.location.href = redirectTo; return null; }
  return session;
}

async function requireRole(roles, redirectTo = 'dashboard.html') {
  const session = await requireAuth();
  if (!session) return null;
  const profile = await getUserProfile(session.user.id);
  if (!profile || !roles.includes(profile.role)) {
    window.location.href = redirectTo;
    return null;
  }
  return { session, profile };
}
