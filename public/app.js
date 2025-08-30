let userId = null;

const resources = {
  en: {
    translation: {
      site_name: 'Piru',
      tagline: 'Consume media in foreign languages.',
      login: 'Login',
      sign_up: 'Sign Up',
      email: 'Email',
      password: 'Password',
      native_language: 'Native language',
      learning_language: 'Learning language',
      select_language: 'Select language',
      your_works: 'Your Works',
      title: 'Title',
      author: 'Author',
      content: 'Content',
      add_work: 'Add Work',
      account_created: 'Account created. You can now log in.'
    }
  },
  fr: {
    translation: {
      site_name: 'Piru',
      tagline: 'Consommez des médias en langues étrangères.',
      login: 'Connexion',
      sign_up: 'Inscription',
      email: 'Email',
      password: 'Mot de passe',
      native_language: 'Langue maternelle',
      learning_language: 'Langue apprise',
      select_language: 'Choisir une langue',
      your_works: 'Vos œuvres',
      title: 'Titre',
      author: 'Auteur',
      content: 'Contenu',
      add_work: 'Ajouter une œuvre',
      account_created: 'Compte créé. Vous pouvez maintenant vous connecter.'
    }
  }
};

const nativeLanguages = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' }
];

const learningLanguages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'it', label: '🇮🇹 Italiano' }
];

const nativeSelect = document.getElementById('signup-native');
nativeLanguages.forEach(({ code, label }) => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = label;
  nativeSelect.appendChild(option);
});

const learningSelect = document.getElementById('signup-learning');
learningLanguages.forEach(({ code, label }) => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = label;
  learningSelect.appendChild(option);
});

// Ensure the placeholder option remains selected by default
nativeSelect.value = '';
learningSelect.value = '';

const defaultLang = nativeSelect.value || 'en';
i18next.init({ lng: defaultLang, resources }).then(() => {
  updateContent();
});

function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18next.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = i18next.t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = i18next.language;
}

document.getElementById('signup-native').addEventListener('change', (e) => {
  i18next.changeLanguage(e.target.value);
  updateContent();
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    userId = data.id;
    i18next.changeLanguage(data.nativeLanguage);
    updateContent();
    document.getElementById('auth').classList.add('hidden');
    document.getElementById('works').classList.remove('hidden');
    loadWorks();
  } else {
    alert(data.error);
  }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const nativeLanguage = document.getElementById('signup-native').value;
  const learningLanguage = document.getElementById('signup-learning').value;
  if (!learningLanguage) {
    alert(i18next.t('select_language'));
    return;
  }
  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nativeLanguage, learningLanguages: [learningLanguage] })
  });
  const data = await res.json();
  if (res.ok) {
    alert(i18next.t('account_created'));
  } else {
    alert(data.error);
  }
});

document.getElementById('work-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('work-title').value;
  const author = document.getElementById('work-author').value;
  const content = document.getElementById('work-content').value;
  const res = await fetch('/works', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, title, author, content })
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById('work-form').reset();
    loadWorks();
  } else {
    alert(data.error);
  }
});

async function loadWorks() {
  const res = await fetch(`/works?userId=${userId}`);
  const works = await res.json();
  const list = document.getElementById('work-list');
  list.innerHTML = '';
  works.forEach(w => {
    const li = document.createElement('li');
    li.textContent = `${w.title || 'Untitled'} by ${w.author || 'Unknown'}`;
    list.appendChild(li);
  });
}
