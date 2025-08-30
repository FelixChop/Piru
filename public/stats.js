const resources = {
  en: {
    translation: {
      stats_title: 'Statistics',
      total_words: 'Total words encountered',
      mastered_words: 'Mastered words',
      review_vocabulary: 'Review Vocabulary',
      logout: 'Logout'
    }
  },
  fr: {
    translation: {
      stats_title: 'Statistiques',
      total_words: 'Nombre total de mots rencontrés',
      mastered_words: 'Mots maîtrisés',
      review_vocabulary: 'Réviser le vocabulaire',
      logout: 'Déconnexion'
    }
  }
};

function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18next.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = i18next.t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = i18next.language;
}

async function loadStats() {
  const userId = localStorage.getItem('userId');
  const logoutButton = document.getElementById('logout-button');
  if (!userId) {
    window.location.href = '/';
    return;
  }
  logoutButton.classList.remove('hidden');
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('nativeLanguage');
    window.location.href = '/';
  });
  const res = await fetch(`/stats/overview?userId=${userId}`);
  if (res.ok) {
    const data = await res.json();
    document.getElementById('total-words').textContent = data.totalWords;
    document.getElementById('mastered-words').textContent = data.masteredWords;
  }
}

initI18n().then(loadStats);
