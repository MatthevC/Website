// MATT WORLD: logowanie nickiem przez Cloudflare Worker + Firebase Auth.
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('loginBtn');
  const nick = document.getElementById('nick');
  const pass = document.getElementById('pass');
  const msg = document.getElementById('msg');
  const gateway = 'https://matt-world-auth.mateuszchrusciel95.workers.dev/login';
  const adminUid = '6UYgp0Lj7NMDRbIK3UBr40oNRLq2';

  async function login() {
    if (btn.disabled) return;
    const username = nick.value.trim();
    const password = pass.value;
    if (!username || !password) {
      msg.textContent = 'Podaj nick i hasło.';
      return;
    }
    btn.disabled = true;
    msg.textContent = 'Logowanie...';
    try {
      // Worker sprawdza nick i hasło; zwraca e-mail Auth dopiero po weryfikacji.
      const response = await fetch(gateway, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
      });
      const result = await response.json();
      if (!response.ok || !result.ok || typeof result.email !== 'string') {
        if (response.status === 429) throw new Error('Za dużo prób. Spróbuj ponownie za 15 minut.');
        if (response.status === 503) throw new Error('Logowanie jest chwilowo niedostępne.');
        throw new Error('Nieprawidłowy nick lub hasło.');
      }
      const authResult = await firebaseClient.auth.signInWithPassword({
        email: result.email,
        password
      });
      if (authResult.error) throw new Error('Nie udało się zalogować do Firebase.');
      const sessionResult = await firebaseClient.auth.getSession();
      const uid = sessionResult.data?.session?.user?.id;
      if (uid !== adminUid) {
        await firebaseClient.auth.signOut();
        throw new Error('Brak uprawnień administratora.');
      }
      const profile = await firebaseClient.from('profiles')
        .select('role').eq('id', uid).maybeSingle();
      if (profile.error || profile.data?.role !== 'admin') {
        await firebaseClient.auth.signOut();
        throw new Error('Nie można potwierdzić roli administratora w Firestore.');
      }
      pass.value = '';
      location.href = '../index.html';
    } catch (error) {
      msg.textContent = error instanceof TypeError
        ? 'Nie można połączyć się z usługą logowania.'
        : (error.message || 'Błąd logowania.');
    } finally {
      btn.disabled = false;
    }
  }
  btn.addEventListener('click', login);
  [nick, pass].forEach(el => el.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  }));
});
