(function() {
  function setupMenu() {
    const menu = document.getElementById('menu');
    const toggle = document.getElementById('menu-toggle');
    const options = document.getElementById('menu-options');
    if (!menu || !toggle || !options) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      menu.classList.add('hidden');
      return;
    }
    menu.classList.remove('hidden');
    toggle.addEventListener('click', () => {
      options.classList.toggle('hidden');
    });
    document.getElementById('learn-button').addEventListener('click', () => {
      window.location.href = 'flashcards.html';
    });
    document.getElementById('stats-button').addEventListener('click', () => {
      window.location.href = 'stats.html';
    });
    document.getElementById('logout-button').addEventListener('click', () => {
      localStorage.removeItem('userId');
      localStorage.removeItem('nativeLanguage');
      window.location.href = '/';
    });
  }
  document.addEventListener('DOMContentLoaded', setupMenu);
})();
