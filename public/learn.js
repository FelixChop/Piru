(function() {
  const games = [
    {
      id: 'flashcard-classic',
      nameKey: 'flashcard_classic',
      link: 'flashcards.html',
      unlocked: true
    },
    {
      id: 'flashcard-reverse',
      nameKey: 'flashcard_reverse',
      link: 'flashcards.html?mode=reverse'
    },
    { id: 'quiz', nameKey: 'quiz', link: '#' },
    { id: 'quiz-reverse', nameKey: 'quiz_reverse', link: '#' }
  ];

  let progressMax = 0;
  let cookies = 0;

  async function loadProgress() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
      const res = await fetch(`/progress?userId=${userId}`);
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

  async function unlockGame(id) {
    if (cookies < 1) {
      alert(i18next.t('not_enough_cookies'));
      return;
    }
    cookies -= 1;
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        await fetch('/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, progressMax, cookies })
        });
        window.dispatchEvent(new Event('cookiechange'));
      } catch (err) {}
    }
    const unlocked = getUnlocked();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      saveUnlocked(unlocked);
    }
    renderGames();
  }

  function renderGames() {
    const container = document.getElementById('games');
    if (!container) return;
    container.innerHTML = '';
    const unlocked = getUnlocked();
    games.forEach((game) => {
      const isUnlocked = game.unlocked || unlocked.includes(game.id);
      const div = document.createElement('div');
      div.className = 'game';
      const span = document.createElement('span');
      span.setAttribute('data-i18n', game.nameKey);
      span.textContent = i18next.t(game.nameKey);
      div.appendChild(span);
      if (isUnlocked) {
        const link = document.createElement('a');
        link.href = game.link;
        link.className = 'btn-main';
        link.setAttribute('data-i18n', 'play');
        link.textContent = i18next.t('play');
        if (game.link === '#') {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Coming soon!');
          });
        }
        div.appendChild(link);
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn-main';
        btn.setAttribute('data-i18n', 'unlock_for_cookie');
        btn.textContent = i18next.t('unlock_for_cookie');
        btn.addEventListener('click', () => unlockGame(game.id));
        div.appendChild(btn);
      }
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
