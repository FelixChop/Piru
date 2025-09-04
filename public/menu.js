(function() {
  function loadMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return Promise.resolve();

    return fetch('/menu.html')
      .then((res) => res.text())
      .then((html) => {
        menu.innerHTML = html;
        if (typeof updateContent === 'function') {
          updateContent();
        }
        if (localStorage.getItem('email')) {
          setupMenu(menu);
        }
      })
      .catch((err) => {
        console.error('Failed to load menu:', err);
      });
  }

  function setupMenu(menu) {
    const toggle = menu.querySelector('#menu-toggle');
    const options = menu.querySelector('#menu-options');
    const header = document.querySelector('header');
    if (!toggle || !options) return;

    toggle.addEventListener('click', () => {
      options.classList.toggle('hidden');
      toggle.classList.toggle('open');
      const expanded = !options.classList.contains('hidden');
      toggle.setAttribute('aria-expanded', expanded);
      if (header) {
        header.classList.toggle('menu-open', expanded);
      }
    });

    const logoutLink = menu.querySelector('#logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await fetch('/logout', { method: 'POST' });
        } catch (err) {}
        localStorage.removeItem('nativeLanguage');
        localStorage.removeItem('email');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('flashcardProgress');
        localStorage.removeItem('cookieCount');
        window.location.href = '/';
      });
    }

    const cookieDisplay = menu.querySelector('#cookie-count');
    async function renderCookies() {
      if (!cookieDisplay) {
        return;
      }
      // Hide the counter for anonymous users.
      if (!localStorage.getItem('email')) {
        cookieDisplay.classList.add('hidden');
        return;
      }
      try {
        const res = await fetch('/progress');
        if (res.ok) {
          const data = await res.json();
          cookieDisplay.textContent = `🍪${data.cookies}`;
          cookieDisplay.classList.remove('hidden');
        } else {
          cookieDisplay.classList.add('hidden');
        }
      } catch {
        cookieDisplay.classList.add('hidden');
      }
    }
    if (cookieDisplay) {
      cookieDisplay.addEventListener('click', () => {
        alert('Révise ton vocabulaire pour gagner des cookies !');
      });
    }
    renderCookies();
    window.addEventListener('cookiechange', renderCookies);

    // Show menu by default; server-side session determines access.
    menu.classList.remove('hidden');
  }

  window.loadMenu = loadMenu;
  document.addEventListener('DOMContentLoaded', loadMenu);
})();
