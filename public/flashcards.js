(function() {
let currentWord = null;

async function loadNext() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/';
    return;
  }
  const res = await fetch(`/vocab/next?userId=${userId}`);
  if (res.status === 200) {
    currentWord = await res.json();
    document.getElementById('word').textContent = currentWord.word;
    document.getElementById('definition').textContent = currentWord.definition;
    document.getElementById('flashcard-section').classList.remove('hidden');
    document.getElementById('definition').classList.add('hidden');
    document.getElementById('review-buttons').classList.add('hidden');
    document.getElementById('show-btn').classList.remove('hidden');
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

initI18n().then(() => {
  updateContent();
  loadNext();
});
})();
