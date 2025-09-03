(function() {
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');
const userId = localStorage.getItem('userId');
if (!userId || !workId) {
  window.location.href = '/';
  return;
}

async function loadWork() {
  const res = await fetch(`/works?userId=${userId}`);
  const works = await res.json();
  const work = works.find(w => w.id === workId);
  if (!work) {
    window.location.href = '/';
    return;
  }
  document.getElementById('work-title').textContent = work.title || '';
}

document.getElementById('learn-btn').addEventListener('click', () => {
  window.location.href = `flashcards.html?workId=${encodeURIComponent(workId)}`;
});

document.getElementById('delete-btn').addEventListener('click', async () => {
  if (!confirm(i18next.t('confirm_delete_work'))) return;
  const res = await fetch(`/works/${encodeURIComponent(workId)}?userId=${userId}`, { method: 'DELETE' });
  if (res.ok) {
    window.location.href = '/';
  }
});

document.getElementById('challenge-btn').addEventListener('click', async () => {
  const res = await fetch('/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, workId })
  });
  if (res.ok) {
    const data = await res.json();
    const link = `${window.location.origin}/flashcards.html?workId=${encodeURIComponent(workId)}&challengeId=${encodeURIComponent(data.id)}`;
    const linkInput = document.getElementById('challenge-link');
    linkInput.value = link;
    document.getElementById('challenge-section').classList.remove('hidden');
  }
});

const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadWork();
});
})();
