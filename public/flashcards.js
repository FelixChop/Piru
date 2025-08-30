const resources = {
  en: {
    translation: {
      vocab_review: 'Vocabulary Review',
      paste_text: 'Paste text here',
      extract_vocabulary: 'Extract Vocabulary',
      show_definition: 'Show Definition',
      again: 'Again',
      good: 'Good'
    }
  },
  fr: {
    translation: {
      vocab_review: 'Révision du vocabulaire',
      paste_text: 'Collez le texte ici',
      extract_vocabulary: 'Extraire le vocabulaire',
      show_definition: 'Afficher la définition',
      again: 'Encore',
      good: 'Bon'
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

let currentWord = null;

async function extractVocabulary() {
  const text = document.getElementById('input-text').value;
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/';
    return;
  }
  if (!text.trim()) return;
  await fetch('/vocab/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text })
  });
  document.getElementById('input-text').value = '';
  loadNext();
}

async function loadNext() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/';
    return;
  }
  const res = await fetch(`/vocab/next?userId=${userId}`);
  if (res.status === 200) {
    currentWord = await res.json();
    document.getElementById('word').textContent = currentWord.word;
    document.getElementById('definition').textContent = currentWord.definition;
    document.getElementById('flashcard-section').classList.remove('hidden');
    document.getElementById('definition').classList.add('hidden');
    document.getElementById('review-buttons').classList.add('hidden');
    document.getElementById('show-btn').classList.remove('hidden');
  } else {
    document.getElementById('flashcard-section').classList.add('hidden');
  }
}

function showDefinition() {
  document.getElementById('definition').classList.remove('hidden');
  document.getElementById('review-buttons').classList.remove('hidden');
  document.getElementById('show-btn').classList.add('hidden');
}

async function review(quality) {
  const userId = localStorage.getItem('userId');
  if (!currentWord) return;
  await fetch('/vocab/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, wordId: currentWord.id, quality })
  });
  loadNext();
}

document.getElementById('extract-btn').addEventListener('click', extractVocabulary);
document.getElementById('show-btn').addEventListener('click', showDefinition);
document.querySelectorAll('#review-buttons button').forEach((btn) => {
  btn.addEventListener('click', () => review(Number(btn.dataset.quality)));
});

const lang = localStorage.getItem('nativeLanguage') || 'en';
i18next.init({ lng: lang, resources }).then(() => {
  updateContent();
  loadNext();
});
