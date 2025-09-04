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
  document.getElementById('question').textContent = i18next.t('no_words');
  document.getElementById('options').classList.add('hidden');
  document.getElementById('add-work-btn').classList.remove('hidden');
  document.getElementById('quiz-section').classList.remove('hidden');
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
    const questionEl = document.getElementById('question');
    if (mode === 'reverse') {
      questionEl.textContent = current.definition;
    } else {
      questionEl.textContent = current.word;
    }
    words.forEach((w, i) => {
      const btn = document.querySelector(`#options button[data-index="${i}"]`);
      btn.textContent = mode === 'reverse' ? w.word : w.definition;
      btn.disabled = false;
    });
    const resultEl = document.getElementById('result');
    if (mode === 'reverse') {
      questionEl.classList.add('small-text');
      document.querySelectorAll('#options button').forEach((b) => b.classList.add('large-text'));
      resultEl.classList.add('large-text');
    } else {
      questionEl.classList.remove('small-text');
      document.querySelectorAll('#options button').forEach((b) => b.classList.remove('large-text'));
      resultEl.classList.remove('large-text');
    }
    resultEl.textContent = '';
    document.getElementById('options').classList.remove('hidden');
    document.getElementById('add-work-btn').classList.add('hidden');
    document.getElementById('quiz-section').classList.remove('hidden');
  } else if (res.status === 204) {
    showNoWords();
  } else {
    window.location.href = '/';
  }
}

function selectOption(idx) {
  const result = document.getElementById('result');
  if (idx === correctIndex) {
    result.textContent = '✓';
    incrementProgress();
  } else {
    result.textContent = mode === 'reverse' ? current.word : current.definition;
  }
  document.querySelectorAll('#options button').forEach((b) => (b.disabled = true));
  setTimeout(loadQuestion, 1000);
}

document.querySelectorAll('#options button').forEach((btn) => {
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
