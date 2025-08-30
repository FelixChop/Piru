(function() {

async function loadStats() {
  const userId = localStorage.getItem('userId');
  const logoutButton = document.getElementById('logout-button');
  if (!userId) {
    window.location.href = '/';
    return;
  }
  logoutButton.classList.remove('hidden');
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('nativeLanguage');
    window.location.href = '/';
  });
  const res = await fetch(`/stats/overview?userId=${userId}`);
  if (res.ok) {
    const data = await res.json();
    document.getElementById('total-words').textContent = data.totalWords;
    document.getElementById('mastered-words').textContent = data.masteredWords;
  }
}

const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadStats();
});
})();
