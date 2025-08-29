let userId = null;

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
  const learningLanguages = document.getElementById('signup-learning').value.split(',').map(l => l.trim());
  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nativeLanguage, learningLanguages })
  });
  const data = await res.json();
  if (res.ok) {
    alert('Account created. You can now log in.');
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
