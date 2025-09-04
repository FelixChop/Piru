(function() {
let currentWord = null;
let worksById = new Map();
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');
let seenWords = [];
let reviewQueue = [];

let progress = Number(localStorage.getItem('flashcardProgress') || '0');
let progressMax = 10;
let cookies = 0;

async function loadProgress() {
  // Only fetch progress if the user is logged in.
  if (!localStorage.getItem('email')) {
    updateProgress();
    return;
  }
  try {
    const res = await fetch('/progress');
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
    }).then(() => window.dispatchEvent(new Event('cookiechange')));
  }
  localStorage.setItem('flashcardProgress', progress);
  updateProgress();
}

loadProgress();
updateProgress();

window.addEventListener('cookiechange', loadProgress);

async function loadWorks() {
  const res = await fetch('/works');
  if (res.ok) {
    const works = await res.json();
    worksById = new Map(works.map((w) => [w.id, w]));
  } else if (res.status === 401) {
    window.location.href = '/';
  }
}

function formatCitation(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
}

function displayWord(word) {
  const work = worksById.get(word.workId);
  document.getElementById('word').textContent = word.word;
  document.getElementById('citation').innerHTML = formatCitation(word.citation);
  document.getElementById('citation-source').textContent = work
    ? `${work.title}${work.author ? ' — ' + work.author : ''}`
    : '';
  document.getElementById('definition').textContent = word.definition;
  document.getElementById('definition').classList.add('hidden');
  document.getElementById('review-buttons').classList.add('hidden');
  document.getElementById('show-btn').classList.remove('hidden');
  document.getElementById('delete-btn').classList.remove('hidden');
  document.getElementById('add-work-btn').classList.add('hidden');
  document.getElementById('flashcard-section').classList.remove('hidden');
}

async function loadNext() {
  if (reviewQueue.length > 0) {
    currentWord = reviewQueue.shift();
    displayWord(currentWord);
    return;
  }

  const res = await fetch(`/vocab/next${workId ? `?workId=${workId}` : ''}`);
  if (res.status === 200) {
    currentWord = await res.json();
    if (!seenWords.find((w) => w.id === currentWord.id)) {
      seenWords.push(currentWord);
    }
    displayWord(currentWord);
  } else if (res.status === 204) {
    if (seenWords.length > 0) {
      reviewQueue = seenWords.slice();
      currentWord = reviewQueue.shift();
      displayWord(currentWord);
    } else {
      currentWord = null;
      document.getElementById('word').textContent = i18next.t('no_words');
      document.getElementById('citation').innerHTML = '';
      document.getElementById('citation-source').textContent = '';
      document.getElementById('definition').classList.add('hidden');
      document.getElementById('review-buttons').classList.add('hidden');
      document.getElementById('show-btn').classList.add('hidden');
      document.getElementById('delete-btn').classList.add('hidden');
      document.getElementById('add-work-btn').classList.remove('hidden');
      document.getElementById('flashcard-section').classList.remove('hidden');
    }
  } else {
    window.location.href = '/';
  }
}

function showDefinition() {
  incrementProgress();
  document.getElementById('definition').classList.remove('hidden');
  document.getElementById('review-buttons').classList.remove('hidden');
  document.getElementById('show-btn').classList.add('hidden');
  document.getElementById('delete-btn').classList.add('hidden');
}

async function review(quality) {
  if (!currentWord) return;
  await fetch('/vocab/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wordId: currentWord.id, quality })
  });
  loadNext();
}

async function removeWord() {
  if (!currentWord) return;
  try {
    const res = await fetch(`/vocab/${currentWord.id}`, {
      method: 'DELETE',
    });
    if (res.status === 401) {
      window.location.href = '/';
      return;
    }
    if (!res.ok) {
      const retry = confirm('Failed to delete word. Retry?');
      if (retry) return removeWord();
      return;
    }
  } catch (err) {
    const retry = confirm('Failed to delete word. Retry?');
    if (retry) return removeWord();
    return;
  }
  const filter = (w) => w.id !== currentWord.id;
  seenWords = seenWords.filter(filter);
  reviewQueue = reviewQueue.filter(filter);
  loadNext();
}

document.getElementById('show-btn').addEventListener('click', showDefinition);
document.getElementById('delete-btn').addEventListener('click', removeWord);
document.querySelectorAll('#review-buttons button').forEach((btn) => {
  btn.addEventListener('click', () => review(Number(btn.dataset.quality)));
});
document.getElementById('add-work-btn').addEventListener('click', () => {
  window.location.href = '/';
});


const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadWorks().then(loadNext);
});
})();

