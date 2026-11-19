/* MATT'S WORLD — jednorazowe połączenie Gmail, tylko administrator. */
(() => {
  'use strict';
  const WORKER = 'https://matt-world-auth.mateuszchrusciel95.workers.dev';
  const ID = 'mattGmailOAuthBtn';
  function syncButton() {
    const menu = document.getElementById('userMenu');
    if (!menu) return;
    let button = document.getElementById(ID);
    if (!button) {
      button = document.createElement('button');
      button.id = ID;
      button.type = 'button';
      button.textContent = 'Połącz Gmail API';
      button.hidden = true;
      const logout = document.getElementById('logoutBtn');
      menu.insertBefore(button, logout || null);
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Łączenie z Google…';
        try {
          const result = await window.firebaseClient.auth.getSession();
          const token = result?.data?.session?.access_token;
          if (!token) throw new Error('Zaloguj się ponownie na konto administratora.');
          const response = await fetch(WORKER + '/oauth/google/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: '{}'
          });
          const data = await response.json();
          if (!response.ok || !data.ok || !data.authorizationUrl) {
            throw new Error(data.error || 'Nie udało się rozpocząć autoryzacji.');
          }
          const url = new URL(data.authorizationUrl);
          if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com') {
            throw new Error('Worker zwrócił nieprawidłowy adres autoryzacji.');
          }
          window.location.assign(url.href);
        } catch (error) {
          alert('Gmail API: ' + (error.message || 'Nieznany błąd'));
          button.disabled = false;
          button.textContent = 'Połącz Gmail API';
        }
      });
    }
    button.hidden = window.currentUserRole !== 'admin';
  }
  document.addEventListener('DOMContentLoaded', syncButton);
  window.addEventListener('matt-auth-change', syncButton);
  if (document.readyState !== 'loading') syncButton();
})();
