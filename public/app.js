let userId = localStorage.getItem('userId');

const nativeLanguages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'it', label: '🇮🇹 Italiano' }
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
initI18n(defaultLang);

document.getElementById('signup-native').addEventListener('change', (e) => {
  const lang = e.target.value;
  i18next.changeLanguage(lang);
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
    localStorage.setItem('userId', userId);
    if (data.nativeLanguage) {
      localStorage.setItem('nativeLanguage', data.nativeLanguage);
    }
    initAuthenticatedState();
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

function initAuthenticatedState() {
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('works').classList.remove('hidden');
  loadWorks();
}

if (userId) {
  initAuthenticatedState();
}
