async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  await supabase.auth.signOut();
}

async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return profile;
}

async function refreshAuthUI() {
  const profile = await getCurrentProfile();
  const loggedOutEls = document.querySelectorAll('[data-auth="out"]');
  const loggedInEls = document.querySelectorAll('[data-auth="in"]');
  const adminEls = document.querySelectorAll('[data-auth="admin"]');
  const nameEls = document.querySelectorAll('[data-auth="name"]');

  if (profile) {
    loggedOutEls.forEach(el => el.style.display = 'none');
    loggedInEls.forEach(el => el.style.display = '');
    adminEls.forEach(el => el.style.display = (profile.role === 'admin' || profile.role === 'moderator') ? '' : 'none');
    nameEls.forEach(el => el.textContent = profile.display_name);
  } else {
    loggedOutEls.forEach(el => el.style.display = '');
    loggedInEls.forEach(el => el.style.display = 'none');
    adminEls.forEach(el => el.style.display = 'none');
  }
  return profile;
}
