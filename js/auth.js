function toast(msg, type = '') {
  const c = document.getElementById('toast');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'toast-item' + (type ? ' ' + type : '');
  d.textContent = msg;
  c.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}

function showPanel(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
}

async function handleSignUp(e) {
  e.preventDefault();
  const name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const role = document.getElementById('su-role')?.value || 'learner';
  const companyKey = document.getElementById('su-company-key')?.value.trim() || '';

  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Creating account...'; btn.disabled = true;

  try {
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
    if (data.user) {
      const profileData = { id: data.user.id, full_name: name, email, role: 'learner' };
      if (companyKey) {
        const { data: company } = await sb.from('companies').select('id').eq('admin_key', companyKey).single();
        if (company) { profileData.company_id = company.id; profileData.role = 'learner'; }
      }
      await sb.from('profiles').upsert(profileData);
      toast('Account created! Check your email to verify.', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    }
  } catch(err) {
    toast(err.message || 'Sign up failed', 'error');
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
}

async function handleSignIn(e) {
  e.preventDefault();
  const email = document.getElementById('si-email').value.trim();
  const password = document.getElementById('si-password').value;
  const btn = e.target.querySelector('[type=submit]');
  btn.textContent = 'Signing in...'; btn.disabled = true;

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await getUserProfile(data.user.id);
    if (profile?.role === 'super_admin') window.location.href = 'superadmin.html';
    else if (profile?.role === 'company_admin' || profile?.role === 'manager') window.location.href = 'admin.html';
    else window.location.href = 'dashboard.html';
  } catch(err) {
    toast(err.message || 'Sign in failed', 'error');
    btn.textContent = 'Sign In'; btn.disabled = false;
  }
}

async function handleSignOut() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.addEventListener('click', () => showPanel(t.dataset.tab));
  });
  document.getElementById('signup-form')?.addEventListener('submit', handleSignUp);
  document.getElementById('signin-form')?.addEventListener('submit', handleSignIn);
  document.getElementById('signout-btn')?.addEventListener('click', handleSignOut);
});
