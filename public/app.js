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
      learning_language: 'Language to learn',
      select_language: 'Select language',
      your_works: 'Your Works',
      title: 'Title',
      author: 'Author',
      content: 'Content',
      add_work: 'Add Work',
      account_created: 'Account created. You can now log in.',
      language_unavailable: 'Language not available'
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
      learning_language: 'Langue à apprendre',
      select_language: 'Choisir une langue',
      your_works: 'Vos œuvres',
      title: 'Titre',
      author: 'Auteur',
      content: 'Contenu',
      add_work: 'Ajouter une œuvre',
      account_created: 'Compte créé. Vous pouvez maintenant vous connecter.',
      language_unavailable: "Cette langue n'est pas disponible"
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
const signupButton = document.querySelector('#signup-form button[type="submit"]');
const languageError = document.getElementById('signup-language-error');
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
signupButton.disabled = true;

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
  const lang = e.target.value;
  i18next.changeLanguage(lang);
  updateContent();
  if (lang !== 'fr') {
    signupButton.disabled = true;
    languageError.classList.remove('hidden');
  } else {
    signupButton.disabled = false;
    languageError.classList.add('hidden');
  }
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
    localStorage.setItem('userId', userId);
    if (data.nativeLanguage) {
      localStorage.setItem('nativeLanguage', data.nativeLanguage);
    }
    window.location.href = 'stats.html';
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
  try {
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
  } catch (err) {
    alert('An error occurred while signing up. Please try again later.');
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
