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
    if (!toggle || !options) return;

    toggle.addEventListener('click', () => {
      options.classList.toggle('hidden');
    });

    const logoutLink = menu.querySelector('#logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userId');
        localStorage.removeItem('nativeLanguage');
        localStorage.removeItem('email');
        localStorage.removeItem('isAdmin');
        window.location.href = '/';
      });
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      menu.classList.add('hidden');
    } else {
      menu.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', loadMenu);
})();
