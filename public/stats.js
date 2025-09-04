(function() {

async function loadStats() {
  const res = await fetch('/stats/overview');
  if (res.ok) {
    const data = await res.json();
    document.getElementById('total-words').textContent = data.totalWords;
    document.getElementById('mastered-words').textContent = data.masteredWords;
  } else if (res.status === 401) {
    window.location.href = '/';
  }
}

document.getElementById('review-vocab-button').addEventListener('click', () => {
  window.location.href = 'learn.html';
});

const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadStats();
});
})();
