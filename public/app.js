let userId = localStorage.getItem('userId');
const storedNativeLanguage = localStorage.getItem('nativeLanguage');

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

const DEFAULT_THUMBNAILS = {
  movie: '/default-thumbnails/movie.svg',
  series: '/default-thumbnails/movie.svg',
  book: '/default-thumbnails/book.svg',
  song: '/default-thumbnails/song.svg',
  custom: '/default-thumbnails/custom.svg'
};

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

const defaultLang = storedNativeLanguage || 'en';
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
    if (data.email) {
      localStorage.setItem('email', data.email);
    }
    if (data.nativeLanguage) {
      localStorage.setItem('nativeLanguage', data.nativeLanguage);
      i18next.changeLanguage(data.nativeLanguage);
      updateContent();
    }
    if (typeof data.isAdmin !== 'undefined') {
      localStorage.setItem('isAdmin', data.isAdmin);
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
  const type = document.getElementById('work-type').value;
  const content = document.getElementById('work-content').value;
  const progress = startProgress(estimateRequestCount(content));
  try {
    const res = await fetch('/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, author, content, type })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('work-form').reset();
      loadWorks();
    } else {
      alert(data.error);
    }
  } finally {
    stopProgress(progress);
  }
});

async function loadWorks() {
  const res = await fetch(`/works?userId=${userId}`);
  const works = await res.json();
  const container = document.getElementById('my-works-container');
  const carousel = document.getElementById('work-carousel');
  carousel.innerHTML = '';
// <<<<<<< codex/add-default-thumbnail-by-item-type
//   works.forEach((w) => {
//     const item = document.createElement('div');
//     item.className = 'work-item';
//     if (w.thumbnail) {
//       const img = document.createElement('img');
//       img.src = w.thumbnail;
//       img.alt = w.title || 'thumbnail';
//       item.appendChild(img);
//     } else {
//       const img = document.createElement('img');
//       img.src = DEFAULT_THUMBNAILS[w.type] || DEFAULT_THUMBNAILS.custom;
//       img.alt = w.title || 'thumbnail';
//       item.appendChild(img);
//     }
//     const caption = document.createElement('div');
//     caption.className = 'work-caption';
//     caption.textContent = w.title || 'Untitled';
//     item.appendChild(caption);
//     const learnBtn = document.createElement('button');
//     learnBtn.className = 'learn-btn';
//     learnBtn.textContent = i18next.t('learn');
//     learnBtn.addEventListener('click', () => {
//       window.location.href = `flashcards.html?workId=${encodeURIComponent(w.id)}`;
// =======
  if (works.length === 0) {
    container.classList.add('hidden');
  } else {
    container.classList.remove('hidden');
    works.forEach((w) => {
      const item = document.createElement('div');
      item.className = 'work-item';

      const thumb = document.createElement('div');
      thumb.className = 'work-thumb';
      if (w.thumbnail) {
        const img = document.createElement('img');
        img.src = w.thumbnail;
        img.alt = w.title || 'thumbnail';
        thumb.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'work-placeholder';
        placeholder.textContent = i18next.t(w.type);
        thumb.appendChild(placeholder);
      }

      const learnBtn = document.createElement('button');
      learnBtn.className = 'learn-btn';
      learnBtn.textContent = i18next.t('learn');
      learnBtn.addEventListener('click', () => {
        window.location.href = `flashcards.html?workId=${encodeURIComponent(w.id)}`;
      });
      thumb.appendChild(learnBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = i18next.t('delete');
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(i18next.t('confirm_delete_work'))) return;
        const res = await fetch(`/works/${encodeURIComponent(w.id)}?userId=${userId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          loadWorks();
        }
      });
      thumb.appendChild(deleteBtn);

      item.appendChild(thumb);

      const caption = document.createElement('div');
      caption.className = 'work-caption';
      caption.textContent = w.title || 'Untitled';
      item.appendChild(caption);

      carousel.appendChild(item);
    });
  }
  if (typeof updateContent === 'function') {
    updateContent();
  }
}

function initAuthenticatedState() {
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('works').classList.remove('hidden');
  const email = localStorage.getItem('email');
  const options = document.getElementById('menu-options');
  if (email && options && !document.getElementById('menu-email')) {
    const emailDiv = document.createElement('div');
    emailDiv.id = 'menu-email';
    emailDiv.textContent = email;
    options.prepend(emailDiv);
  }
  if (options && localStorage.getItem('isAdmin') === 'true' && !document.getElementById('admin-link')) {
    const adminLink = document.createElement('a');
    adminLink.id = 'admin-link';
    adminLink.href = 'admin.html';
    adminLink.textContent = 'Admin';
    options.appendChild(adminLink);
  }
  loadWorks();
}

if (userId) {
  initAuthenticatedState();
}
