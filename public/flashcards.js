(function() {
let currentWord = null;
let worksById = new Map();
const params = new URLSearchParams(window.location.search);
const workId = params.get('workId');
const challengeId = params.get('challengeId');
let score = 0;
let seenWords = [];
let reviewQueue = [];

async function loadWorks() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  const res = await fetch(`/works?userId=${userId}`);
  if (res.ok) {
    const works = await res.json();
    worksById = new Map(works.map((w) => [w.id, w]));
  }
}

function displayWord(word) {
  const work = worksById.get(word.workId);
  document.getElementById('word').textContent = word.word;
  document.getElementById('citation').textContent = word.citation || '';
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
  if (challengeId) {
    document.getElementById('finish-challenge-btn').classList.remove('hidden');
  }
}

async function loadNext() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/';
    return;
  }

  if (reviewQueue.length > 0) {
    currentWord = reviewQueue.shift();
    displayWord(currentWord);
    return;
  }

  const res = await fetch(`/vocab/next?userId=${userId}${workId ? `&workId=${workId}` : ''}`);
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
      document.getElementById('citation').textContent = '';
      document.getElementById('citation-source').textContent = '';
      document.getElementById('definition').classList.add('hidden');
      document.getElementById('review-buttons').classList.add('hidden');
      document.getElementById('show-btn').classList.add('hidden');
      document.getElementById('delete-btn').classList.add('hidden');
      document.getElementById('add-work-btn').classList.remove('hidden');
      document.getElementById('flashcard-section').classList.remove('hidden');
      if (challengeId) {
        document.getElementById('finish-challenge-btn').classList.remove('hidden');
      }
    }
  } else {
    window.location.href = '/';
  }
}

function showDefinition() {
  document.getElementById('definition').classList.remove('hidden');
  document.getElementById('review-buttons').classList.remove('hidden');
  document.getElementById('show-btn').classList.add('hidden');
  document.getElementById('delete-btn').classList.add('hidden');
}

async function review(quality) {
  const userId = localStorage.getItem('userId');
  if (!currentWord) return;
  await fetch('/vocab/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, wordId: currentWord.id, quality })
  });
  if (challengeId && quality >= 4) {
    score++;
  }
  loadNext();
}

async function removeWord() {
  const userId = localStorage.getItem('userId');
  if (!currentWord) return;
  await fetch(`/vocab/${currentWord.id}?userId=${userId}`, { method: 'DELETE' });
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

async function finishChallenge() {
  const userId = localStorage.getItem('userId');
  const res = await fetch(`/challenges/${challengeId}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, score })
  });
  if (res.ok) {
    const data = await fetch(`/challenges/${challengeId}`);
    if (data.ok) {
      const result = await data.json();
      const me = result.scores.find((s) => s.userId === userId);
      const other = result.scores.find((s) => s.userId !== userId);
      document.getElementById('your-score').textContent = `${i18next.t('your_score')} ${me ? me.score : 0}`;
      document.getElementById('opponent-score').textContent = `${i18next.t('opponent_score')} ${other && typeof other.score === 'number' ? other.score : '-'}`;
      const winnerEl = document.getElementById('winner');
      if (result.winner) {
        winnerEl.textContent = i18next.t('winner') + ' ' + (result.winner === userId ? i18next.t('you') : i18next.t('friend'));
      } else {
        winnerEl.textContent = i18next.t('waiting_for_opponent');
      }
      document.getElementById('challenge-results').classList.remove('hidden');
    }
  }
}

if (challengeId) {
  document.getElementById('finish-challenge-btn').addEventListener('click', finishChallenge);
}

const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
initI18n(defaultLang).then(() => {
  updateContent();
  loadWorks().then(loadNext);
});
})();

