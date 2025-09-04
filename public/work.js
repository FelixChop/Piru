(function() {
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');
if (!workId) {
  window.location.href = '/';
  return;
}

async function loadWork() {
  const res = await fetch('/works');
  if (!res.ok) {
    window.location.href = '/';
    return;
  }
  const works = await res.json();
  const work = works.find(w => w.id === workId);
  if (!work) {
    window.location.href = '/';
    return;
  }
  document.getElementById('work-title').textContent = work.title || '';
  if (work.thumbnail) {
    const img = document.getElementById('work-thumb');
    img.src = work.thumbnail;
    img.classList.remove('hidden');
  }
  const total = work.vocabCount || (work.vocab ? work.vocab.length : 0);
  const learned = work.learnedCount || 0;
  const percent = total ? Math.round((learned / total) * 100) : 0;
  document.getElementById('vocab-stats').textContent = `${total} mots de vocabulaire – ${learned} appris (${percent}%)`;
}

document.getElementById('learn-btn').addEventListener('click', () => {
  window.location.href = `flashcards.html?workId=${encodeURIComponent(workId)}`;
});

document.getElementById('delete-btn').addEventListener('click', async () => {
  if (!confirm(i18next.t('confirm_delete_work'))) return;
  const res = await fetch(`/works/${encodeURIComponent(workId)}`, { method: 'DELETE' });
  if (res.ok) {
    window.location.href = '/';
  }
});


const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadWork();
});
})();
