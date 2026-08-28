// Panel moderatora - przygotowane pod backend JWT/Supabase.
// Nie przechowujemy haseł w kodzie produkcyjnym.
const SESSION_KEY='farymvp_admin_session';
function requireLogin(){if(!sessionStorage.getItem(SESSION_KEY)){location.href='login.html';}}
function logout(){sessionStorage.removeItem(SESSION_KEY);location.href='login.html';}
