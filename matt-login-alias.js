/* MATT LOGIN Spark: lokalny alias urządzenia, bez publikowania e-maili w Firestore. */
window.mattLoginAlias = {
 resolve(input) {
  const value = String(input || '').trim();
  if (value.includes('@')) return value;
  try {
   const saved = JSON.parse(localStorage.getItem('matt_login_alias_v1') || '{}');
   return saved[value.toLocaleLowerCase('pl-PL')] || null;
  } catch (_) { return null; }
 },
 remember(nick, email) {
  const key = String(nick || '').trim().toLocaleLowerCase('pl-PL');
  if (!/^[\p{L}\p{N}_.-]{2,40}$/u.test(key) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return;
  try {
   const saved = JSON.parse(localStorage.getItem('matt_login_alias_v1') || '{}');
   saved[key] = email;
   localStorage.setItem('matt_login_alias_v1', JSON.stringify(saved));
  } catch (_) {}
 }
};
