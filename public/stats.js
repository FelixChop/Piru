 (function() {
const statsResources = {
  en: {
    translation: {
      statistics: 'Statistics',
      total_words_encountered: 'Total words encountered',
      mastered_words: 'Mastered words',
      review_vocabulary: 'Review Vocabulary',
      logout: 'Logout'
    }
  },
  fr: {
    translation: {
      statistics: 'Statistiques',
      total_words_encountered: 'Nombre total de mots rencontrés',
      mastered_words: 'Mots maîtrisés',
      review_vocabulary: 'Réviser le vocabulaire',
      logout: 'Déconnexion'
    }
  }
};

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

initI18n().then(() => {
  Object.keys(statsResources).forEach(lang => {
    i18next.addResourceBundle(lang, 'translation', statsResources[lang].translation, true, true);
  });
  updateContent();
  loadStats();
});
})();
