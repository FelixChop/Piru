(function() {
let current = null;
let correctIndex = 0;
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');
const workId = params.get('workId');
let progress = Number(localStorage.getItem('flashcardProgress') || '0');
let progressMax = 10;
let cookies = 0;

async function loadProgress() {
  if (!localStorage.getItem('email')) {
    updateProgress();
    return;
  }
  try {
    const res = await fetch('/progress', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      progressMax = data.progressMax;
      cookies = data.cookies;
    }
    updateProgress();
  } catch (err) {}
}

function updateProgress() {
  const percent = (progress / progressMax) * 100;
  const bar = document.getElementById('progress-bar');
  if (bar) {
    bar.style.width = `${percent}%`;
  }
  const cookie = document.getElementById('progress-cookie');
  if (cookie) {
    cookie.style.left = `${percent}%`;
  }
}

function incrementProgress() {
  progress += 1;
  if (progress >= progressMax) {
    progress = 0;
    progressMax += 1;
    cookies += 1;
    fetch('/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progressMax, cookies }),
      credentials: 'include',
    }).then(() => window.dispatchEvent(new Event('cookiechange')));
  }
  localStorage.setItem('flashcardProgress', progress);
  updateProgress();
}

loadProgress();
updateProgress();
window.addEventListener('cookiechange', loadProgress);

function showNoWords() {
  const wordEl = document.getElementById('word');
  wordEl.textContent = i18next.t('no_words');
  document.getElementById('quiz-buttons').classList.add('hidden');
  document.getElementById('add-work-btn').classList.remove('hidden');
  document.getElementById('flashcard-section').classList.remove('hidden');
}

async function loadQuestion() {
  const res = await fetch(`/vocab/random?count=4${workId ? `&workId=${encodeURIComponent(workId)}` : ''}` , { credentials: 'include' });
  if (res.status === 401) {
    window.location.href = '/';
    return;
  }
  if (res.status === 200) {
    const words = await res.json();
    if (words.length < 4) {
      showNoWords();
      return;
    }
    correctIndex = Math.floor(Math.random() * words.length);
    current = words[correctIndex];
    const wordEl = document.getElementById('word');
    const defEl = document.getElementById('definition');
    if (mode === 'reverse') {
      wordEl.textContent = current.definition;
      wordEl.classList.add('small-text');
      defEl.classList.add('large-text');
    } else {
      wordEl.textContent = current.word;
      wordEl.classList.remove('small-text');
      defEl.classList.remove('large-text');
    }
    defEl.textContent = '';
    defEl.classList.add('hidden');
    words.forEach((w, i) => {
      const btn = document.querySelector(`#quiz-buttons button[data-index="${i}"]`);
      btn.textContent = mode === 'reverse' ? w.word : w.definition;
      btn.disabled = false;
      if (mode === 'reverse') {
        btn.classList.add('large-text');
      } else {
        btn.classList.remove('large-text');
      }
    });
    document.getElementById('quiz-buttons').classList.remove('hidden');
    document.getElementById('add-work-btn').classList.add('hidden');
    document.getElementById('flashcard-section').classList.remove('hidden');
  } else if (res.status === 204) {
    showNoWords();
  } else {
    window.location.href = '/';
  }
}

function selectOption(idx) {
  const defEl = document.getElementById('definition');
  if (idx === correctIndex) {
    defEl.textContent = '✓';
    incrementProgress();
  } else {
    defEl.textContent = mode === 'reverse' ? current.word : current.definition;
  }
  defEl.classList.remove('hidden');
  document.querySelectorAll('#quiz-buttons button').forEach((b) => (b.disabled = true));
  setTimeout(loadQuestion, 1000);
}

document.querySelectorAll('#quiz-buttons button').forEach((btn) => {
  btn.addEventListener('click', () => selectOption(Number(btn.dataset.index)));
});

document.getElementById('add-work-btn').addEventListener('click', () => {
  window.location.href = '/';
});

const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadQuestion();
});
})();
