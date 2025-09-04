(function() {
  function loadMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;

    fetch('/menu.html')
      .then((res) => res.text())
      .then((html) => {
        menu.innerHTML = html;
        if (typeof updateContent === 'function') {
          updateContent();
        }
        setupMenu(menu);
      })
      .catch((err) => console.error('Failed to load menu:', err));
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
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userId');
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
      if (cookieDisplay) {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          cookieDisplay.textContent = '🍪0';
          return;
        }
        const res = await fetch(`/progress?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          cookieDisplay.textContent = `🍪${data.cookies}`;
        }
      }
    }
    if (cookieDisplay) {
      cookieDisplay.addEventListener('click', () => {
        alert('Révise ton vocabulaire pour gagner des cookies !');
      });
    }
    renderCookies();
    window.addEventListener('cookiechange', renderCookies);

    const userId = localStorage.getItem('userId');
    if (!userId) {
      menu.classList.add('hidden');
    } else {
      menu.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', loadMenu);
})();
