(function() {
  let currentWord = null;
  const params = new URLSearchParams(window.location.search);
  const workId = params.get('workId');
  const mode = params.get('mode');
  let progress = Number(localStorage.getItem('flashcardProgress') || '0');
  let progressMax = 10;
  let cookies = 0;

  async function loadProgress() {
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
    if (bar) bar.style.width = `${percent}%`;
    const cookie = document.getElementById('progress-cookie');
    if (cookie) cookie.style.left = `${percent}%`;
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

  async function loadNext() {
    const res = await fetch(`/vocab/next${workId ? `?workId=${workId}` : ''}`);
    if (res.status === 200) {
      currentWord = await res.json();
      displayWord(currentWord);
    } else if (res.status === 204) {
      currentWord = null;
      document.getElementById('word').textContent = i18next.t('no_words');
      document.getElementById('quiz-section').classList.remove('hidden');
    } else {
      window.location.href = '/';
    }
  }

  function displayWord(word) {
    const question = mode === 'reverse' ? word.definition : word.word;
    const answer = mode === 'reverse' ? word.word : word.definition;
    document.getElementById('word').textContent = question;
    const optionTexts = [answer, '???', '???', '???'];
    const prefixes = ['A. ', 'B. ', 'C. ', 'D. '];
    document.querySelectorAll('#options button').forEach((btn, i) => {
      btn.textContent = prefixes[i] + optionTexts[i];
      btn.dataset.correct = i === 0 ? 'true' : 'false';
    });
    document.getElementById('quiz-section').classList.remove('hidden');
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

  function handleAnswer(e) {
    const correct = e.target.dataset.correct === 'true';
    incrementProgress();
    review(correct ? 4 : 1);
  }

  document.querySelectorAll('#options button').forEach((btn) => {
    btn.addEventListener('click', handleAnswer);
  });

  const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
  initI18n(defaultLang).then(() => {
    updateContent();
    loadProgress();
    loadNext();
  });
})();
