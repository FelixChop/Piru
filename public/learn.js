(function() {
  const games = [
    {
      id: 'flashcard-classic',
      nameKey: 'flashcard_classic',
      link: 'flashcards.html',
      unlocked: true,
      shape: 'square'
    },
    {
      id: 'flashcard-reverse',
      nameKey: 'flashcard_reverse',
      link: 'flashcards.html?mode=reverse',
      shape: 'diamond'
    },
    { id: 'quiz', nameKey: 'quiz', link: '#', shape: 'circle' },
    { id: 'quiz-reverse', nameKey: 'quiz_reverse', link: '#', shape: 'triangle' }
  ];

  let progressMax = 0;
  let cookies = 0;

  async function loadProgress() {
    try {
      const res = await fetch('/progress');
      if (res.ok) {
        const data = await res.json();
        progressMax = data.progressMax;
        cookies = data.cookies;
      }
    } catch (err) {}
  }

  function getUnlocked() {
    try {
      return JSON.parse(localStorage.getItem('unlockedGames') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveUnlocked(arr) {
    localStorage.setItem('unlockedGames', JSON.stringify(arr));
  }

  async function unlockGame(id, cost = 1) {
    if (cookies < cost) {
      alert(i18next.t('not_enough_cookies'));
      return false;
    }
    cookies -= 1;
    try {
      await fetch('/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressMax, cookies })
      });
      window.dispatchEvent(new Event('cookiechange'));
    } catch (err) {}
    const unlocked = getUnlocked();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      saveUnlocked(unlocked);
    }
    renderGames();
    return true;
  }

  function renderGames() {
    const container = document.getElementById('games');
    if (!container) return;
    container.innerHTML = '';
    const unlocked = getUnlocked();
    games.forEach((game) => {
      const isUnlocked = game.unlocked || unlocked.includes(game.id);
      const cost = game.cost || 1;
      const div = document.createElement('div');
      div.className = 'game';
      div.id = game.id;

      const span = document.createElement('span');
      span.setAttribute('data-i18n', game.nameKey);
      span.textContent = i18next.t(game.nameKey);
      div.appendChild(span);

      const shape = document.createElement('div');
      shape.className = `identifier ${game.shape || ''}`;
      div.appendChild(shape);

      let hoverText = '';
      if (isUnlocked) {
        hoverText = i18next.t('play');
      } else {
        div.classList.add('locked');
        if (cookies < cost) {
          div.classList.add('no-cookie');
          hoverText = i18next.t('cookie_count', { count: cost });
        } else {
          hoverText = i18next.t('unlock_question', { count: cost });
        }
      }
      div.setAttribute('data-hover', hoverText);

      div.addEventListener('click', async () => {
        if (div.classList.contains('locked')) {
          if (cookies < cost) return;
          const ok = await unlockGame(game.id, cost);
          if (ok) window.location.href = game.link;
        } else {
          window.location.href = game.link;
        }
      });

      container.appendChild(div);
    });
    if (typeof updateContent === 'function') {
      updateContent();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadProgress();
    const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
    initI18n(defaultLang).then(() => {
      renderGames();
    });
  });
})();
