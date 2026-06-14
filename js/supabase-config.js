const SUPABASE_URL = 'https://todzlszlihqzytihejiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHpsc3psaWhxenl0aWhlamlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjY3NTAsImV4cCI6MjA5MzkwMjc1MH0.PHP6lxns3R-jrL05pce7V4NoKwSUGgEx6fy27WJ0Ack';

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
