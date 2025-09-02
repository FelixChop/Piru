(function() {
let currentWord = null;
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');

async function loadNext() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/';
    return;
  }
  const res = await fetch(`/vocab/next?userId=${userId}${workId ? `&workId=${workId}` : ''}`);
  if (res.status === 200) {
    currentWord = await res.json();
    document.getElementById('word').textContent = currentWord.word;
    document.getElementById('citation').textContent = currentWord.citation || '';
    document.getElementById('citation').classList.remove('hidden');
    document.getElementById('definition').textContent = currentWord.definition;
    document.getElementById('flashcard-section').classList.remove('hidden');
    document.getElementById('definition').classList.add('hidden');
    document.getElementById('review-buttons').classList.add('hidden');
    document.getElementById('show-btn').classList.remove('hidden');
    document.getElementById('add-work-btn').classList.add('hidden');
  } else if (res.status === 204) {
    currentWord = null;
    document.getElementById('word').textContent = i18next.t('no_words');
    document.getElementById('citation').textContent = '';
    document.getElementById('citation').classList.add('hidden');
    document.getElementById('flashcard-section').classList.remove('hidden');
    document.getElementById('definition').classList.add('hidden');
    document.getElementById('review-buttons').classList.add('hidden');
    document.getElementById('show-btn').classList.add('hidden');
    document.getElementById('add-work-btn').classList.remove('hidden');
  } else {
    window.location.href = '/';
  }
}

function showDefinition() {
  document.getElementById('definition').classList.remove('hidden');
  document.getElementById('review-buttons').classList.remove('hidden');
  document.getElementById('show-btn').classList.add('hidden');
}

async function review(quality) {
  const userId = localStorage.getItem('userId');
  if (!currentWord) return;
  await fetch('/vocab/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, wordId: currentWord.id, quality })
  });
  loadNext();
}
document.getElementById('show-btn').addEventListener('click', showDefinition);
document.querySelectorAll('#review-buttons button').forEach((btn) => {
  btn.addEventListener('click', () => review(Number(btn.dataset.quality)));
});
document.getElementById('add-work-btn').addEventListener('click', () => {
  window.location.href = '/';
});

const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadNext();
});
})();
