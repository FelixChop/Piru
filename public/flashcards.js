(function() {
const flashcardResources = {
  en: {
    translation: {
      vocabulary_review: 'Vocabulary Review',
      paste_text_here: 'Paste text here',
      extract_vocabulary: 'Extract Vocabulary',
      show_definition: 'Show Definition',
      again: 'Again',
      good: 'Good'
    }
  },
  fr: {
    translation: {
      vocabulary_review: 'Révision du vocabulaire',
      paste_text_here: 'Collez le texte ici',
      extract_vocabulary: 'Extraire le vocabulaire',
      show_definition: 'Afficher la définition',
      again: 'Encore',
      good: 'Bon'
    }
  }
};

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

initI18n().then(() => {
  Object.keys(flashcardResources).forEach(lang => {
    i18next.addResourceBundle(lang, 'translation', flashcardResources[lang].translation, true, true);
  });
  updateContent();
  loadNext();
});
})();
