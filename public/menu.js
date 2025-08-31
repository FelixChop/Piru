(function() {
  function setupMenu() {
    const menu = document.getElementById('menu');
    const toggle = document.getElementById('menu-toggle');
    const options = document.getElementById('menu-options');
    if (!menu || !toggle || !options) return;

    toggle.addEventListener('click', () => {
      options.classList.toggle('hidden');
    });

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userId');
        localStorage.removeItem('nativeLanguage');
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
  document.addEventListener('DOMContentLoaded', setupMenu);
})();
