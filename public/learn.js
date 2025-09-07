(function() {
  const games = [
    {
      id: 'flashcard-classic',
      nameKey: 'flashcard_classic',
      link: 'flashcards.html',
      unlocked: true,
      shape: 'square',
      color: 'var(--color-yellow)'
    },
    {
      id: 'flashcard-reverse',
      nameKey: 'flashcard_reverse',
      link: 'flashcards.html?mode=reverse',
      shape: 'diamond',
      color: 'var(--color-blue)'
    },
    {
      id: 'quiz',
      nameKey: 'quiz',
      link: 'quiz.html',
      shape: 'circle',
      color: 'var(--color-pink)'
    },
    {
      id: 'quiz-reverse',
      nameKey: 'quiz_reverse',
      link: 'quiz.html?mode=reverse',
      shape: 'triangle',
      color: 'var(--color-green)'
    }
  ];

  const params = new URLSearchParams(window.location.search);
  const workId = params.get('workId');
  if (workId) {
    games.forEach((game) => {
      const sep = game.link.includes('?') ? '&' : '?';
      game.link = `${game.link}${sep}workId=${encodeURIComponent(workId)}`;
    });
  }

  let progressMax = 0;
  let cookies = 0;

  async function loadProgress() {
    // Prevent unauthenticated users from hitting the progress endpoint.
    if (!localStorage.getItem('email')) {
      return;
    }
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

  function rainShapes(div, shape) {
    const cols = 10;
    const rows = 6;
    const widthStep = 200 / cols;
    const heightStep = 50;
    const angle = 30;
    const dx = 160 * Math.tan((angle * Math.PI) / 180);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const leftPercent = c * widthStep + widthStep / 2;
        const topOffset = -20 - r * heightStep;

        const drop = document.createElement('div');
        drop.className = `identifier ${shape} rain`;
        drop.style.left = `calc(${leftPercent}% - 100px)`;
        drop.style.top = `${topOffset}px`;
        drop.style.setProperty('--dx', `${dx}px`);
        div.appendChild(drop);
        drop.addEventListener('animationend', () => drop.remove());

        for (let i = 0; i < 3; i++) {
          const leftPercentRain = leftPercent + 3*i - 5
          const topOffsetRain = topOffset

          const line = document.createElement('div');
          line.className = 'rain-line';
          line.style.left = `calc(${leftPercentRain}% - 100px)`;
          line.style.top = `calc(${topOffsetRain}px - 20px)`;
          line.style.setProperty('--rotate', `-${angle}deg`);
          line.style.setProperty('--dx', `${dx}px`);
          div.appendChild(line);
          line.addEventListener('animationend', () => line.remove());
        }
      }
    }
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
      div.style.setProperty('--hover-color', game.color);

      const span = document.createElement('span');
      span.setAttribute('data-i18n', game.nameKey);
      span.textContent = i18next.t(game.nameKey);
      div.appendChild(span);

      if (isUnlocked) {
        div.classList.add('unlocked');
      } else {
        div.classList.add('locked');
        div.setAttribute('data-hover', i18next.t('unlock_question', { count: cost }));
        if (cookies < cost) {
          div.classList.add('no-cookie');
        }
      }

      div.addEventListener('click', async () => {
        if (div.classList.contains('locked')) {
          if (cookies < cost) return;
          const ok = await unlockGame(game.id, cost);
          if (ok) window.location.href = game.link;
        } else {
          window.location.href = game.link;
        }
      });

      div.addEventListener('mouseenter', () => {
        if (isUnlocked) {
          const shape = game.id === 'quiz-reverse' ? 'triangle' : (game.shape || '');
          rainShapes(div, shape);
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
