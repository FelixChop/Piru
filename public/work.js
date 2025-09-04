(function() {
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');
if (!workId) {
  window.location.href = '/';
  return;
}

function initSubtitleNav(work) {
  if (work.type !== 'movie' && work.type !== 'series') return;
  const vocab = (work.vocab || [])
    .filter((v) => typeof v.timestamp === 'number')
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!vocab.length) return;
  const nav = document.getElementById('subtitle-nav');
  nav.classList.remove('hidden');
  const scale = document.getElementById('subtitle-scale');
  const hist = document.getElementById('subtitle-hist');
  scale.innerHTML = '';
  hist.innerHTML = '';
  const durationSec = work.subtitleDuration || Math.max(...vocab.map((v) => v.timestamp));
  const roundedDurationSec = Math.ceil(durationSec / 300) * 300 || 300;
  const bins = Math.ceil(roundedDurationSec / 300);
  const counts = new Array(bins).fill(0);
  vocab.forEach((entry) => {
    const bin = Math.floor((entry.timestamp || 0) / 300);
    if (bin < counts.length) counts[bin]++;
  });
  const maxCount = Math.max(...counts, 1);
  counts.forEach((count, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.left = `${(i / bins) * 100}%`;
    bar.style.width = `${100 / bins}%`;
    bar.style.height = `${(count / maxCount) * 100}%`;
    hist.appendChild(bar);
  });
  const maxLabel = document.createElement('div');
  maxLabel.className = 'axis-label';
  maxLabel.style.top = '0';
  maxLabel.textContent = maxCount;
  hist.appendChild(maxLabel);
  const zeroLabel = document.createElement('div');
  zeroLabel.className = 'axis-label';
  zeroLabel.style.bottom = '0';
  zeroLabel.textContent = '0';
  hist.appendChild(zeroLabel);

  for (let t = 0; t <= roundedDurationSec; t += 300) {
    const tick = document.createElement('div');
    tick.className = 'tick ' + (t % 1800 === 0 ? 'big' : 'small');
    tick.style.left = `${(t / roundedDurationSec) * 100}%`;
    if (t === 300 || (t % 1800 === 0 && t !== 0)) {
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = t === 300 ? '5 min' : `${t / 60} min`;
      tick.appendChild(label);
    }
    scale.appendChild(tick);
  }
  const marker = document.createElement('div');
  marker.id = 'subtitle-progress-marker';
  scale.appendChild(marker);
  let index = 0;
  const wordSpan = document.getElementById('subtitle-current-word');
  const timeSpan = document.getElementById('subtitle-timestamp');
  const snippetSpan = document.getElementById('subtitle-snippet');
  function update() {
    const entry = vocab[index];
    wordSpan.textContent = entry ? entry.word : '';
    snippetSpan.textContent = entry && entry.citation ? entry.citation : '';
    const time = entry ? entry.timestamp : 0;
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    timeSpan.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    marker.style.left = `${(time / roundedDurationSec) * 100}%`;
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
  window.location.href = `learn.html?workId=${encodeURIComponent(workId)}`;
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
