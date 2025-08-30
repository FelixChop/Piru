(function() {

async function loadStats() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/';
    return;
  }
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
