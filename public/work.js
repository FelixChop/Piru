(function() {
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');
if (!workId) {
  window.location.href = '/';
  return;
}

function initSubtitleNav(work) {
  if (work.type !== 'movie' && work.type !== 'series') return;
  const vocab = work.vocab || [];
  if (!vocab.length) return;
  const nav = document.getElementById('subtitle-nav');
  nav.classList.remove('hidden');
  const scale = document.getElementById('subtitle-scale');
  scale.innerHTML = '';
  const duration = vocab.length * 5; // fake minutes
  for (let m = 0; m <= duration; m += 5) {
    const tick = document.createElement('div');
    tick.className = 'tick ' + (m % 60 === 0 ? 'big' : 'small');
    tick.style.left = `${(m / duration) * 100}%`;
    scale.appendChild(tick);
  }
  const marker = document.createElement('div');
  marker.id = 'subtitle-progress-marker';
  scale.appendChild(marker);
  let index = 0;
  const wordSpan = document.getElementById('subtitle-current-word');
  function update() {
    const entry = vocab[index];
    wordSpan.textContent = entry ? entry.word : '';
    marker.style.left = `${((index * 5) / duration) * 100}%`;
  }
  document.getElementById('prev-word').addEventListener('click', () => {
    if (index > 0) {
      index--;
      update();
    }
  });
  document.getElementById('next-word').addEventListener('click', () => {
    if (index < vocab.length - 1) {
      index++;
      update();
    }
  });
  update();
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
  initSubtitleNav(work);
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

document.getElementById('challenge-btn').addEventListener('click', async () => {
  const res = await fetch('/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workId })
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
