// Handles search for books and movies/series and adding them as works

async function searchBooks(query) {
  const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=5`);
  const data = await res.json();
  return data.docs || [];
}

function renderBookResults(results) {
  const list = document.getElementById('book-results');
  list.innerHTML = '';
  results.forEach(book => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = i18next.t('add');
    const title = book.title || 'Untitled';
    const author = (book.author_name && book.author_name[0]) || 'Unknown';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = i18next.t('added');
      const content = Array.isArray(book.first_sentence)
        ? book.first_sentence[0]
        : book.first_sentence || '';
      const res = await fetch('/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, author, content, type: 'book' })
      });
      if (res.ok) {
        loadWorks();
      } else {
        btn.disabled = false;
        btn.textContent = i18next.t('add');
      }
    });
    li.appendChild(btn);
    li.appendChild(document.createTextNode(`${title} by ${author}`));
    list.appendChild(li);
  });
}

document.getElementById('book-search-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('book-search-input');
  const button = e.target.querySelector('button[type="submit"]');
  const spinner = document.getElementById('book-search-spinner');
  const query = input.value.trim();
  if (!query) return;
  button.disabled = true;
  input.disabled = true;
  spinner.classList.remove('hidden');
  try {
    const results = await searchBooks(query);
    renderBookResults(results);
  } finally {
    button.disabled = false;
    input.disabled = false;
    spinner.classList.add('hidden');
  }
});

async function searchMovies(query) {
  const res = await fetch(`https://www.omdbapi.com/?apikey=thewdb&s=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.Search || [];
}

function renderMovieResults(results) {
  const list = document.getElementById('movie-results');
  list.innerHTML = '';
  results.forEach(movie => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = i18next.t('add');
    const type = movie.Type === 'series' ? 'series' : 'movie';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = i18next.t('added');
      const detailRes = await fetch(`https://www.omdbapi.com/?apikey=thewdb&i=${movie.imdbID}&plot=full`);
      const detail = await detailRes.json();
      const content = detail.Plot || '';
      const res = await fetch('/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: detail.Title, author: '', content, type })
      });
      if (res.ok) {
        loadWorks();
      } else {
        btn.disabled = false;
        btn.textContent = i18next.t('add');
      }
    });
    li.appendChild(btn);
    li.appendChild(document.createTextNode(`${movie.Title} (${movie.Year})`));
    list.appendChild(li);
  });
}

document.getElementById('movie-search-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('movie-search-input');
  const button = e.target.querySelector('button[type="submit"]');
  const spinner = document.getElementById('movie-search-spinner');
  const query = input.value.trim();
  if (!query) return;
  button.disabled = true;
  input.disabled = true;
  spinner.classList.remove('hidden');
  try {
    const results = await searchMovies(query);
    renderMovieResults(results);
  } finally {
    button.disabled = false;
    input.disabled = false;
    spinner.classList.add('hidden');
  }
});

async function searchLyrics(query) {
  try {
    const res = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('Failed to fetch lyrics:', err);
    try {
      await fetch('/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: err.message })
      });
    } catch (logErr) {
      // optional: ignore logging errors
    }
    return err.message;
  }
}

function renderLyricsResults(results) {
  const list = document.getElementById('lyrics-results');
  list.innerHTML = '';
  results.forEach(song => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = i18next.t('add');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = i18next.t('added');
      try {
        const lyricRes = await fetch(
          `/api/lyrics/text?artist=${encodeURIComponent(song.artist.name)}&title=${encodeURIComponent(song.title)}`
        );
        if (!lyricRes.ok) throw new Error('Lyrics fetch failed');
        const lyricData = await lyricRes.json();
        const content = lyricData.lyrics || '';
        const res = await fetch('/works', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: song.title,
            author: song.artist.name,
            content,
            type: 'song'
          })
        });
        if (res.ok) {
          loadWorks();
        } else {
          throw new Error('Add failed');
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = i18next.t('add');
        alert('Failed to add song');
      }
    });
    li.appendChild(btn);
    li.appendChild(document.createTextNode(`${song.title} - ${song.artist.name}`));
    list.appendChild(li);
  });
}

document.getElementById('lyrics-search-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('lyrics-search-input');
  const button = e.target.querySelector('button[type="submit"]');
  const spinner = document.getElementById('lyrics-search-spinner');
  const query = input.value.trim();
  if (!query) return;
  button.disabled = true;
  input.disabled = true;
  spinner.classList.remove('hidden');
  try {
    const results = await searchLyrics(query);
    if (Array.isArray(results)) {
      renderLyricsResults(results);
    } else {
      alert(i18next.t('lyrics_fetch_failed'));
    }
  } finally {
    button.disabled = false;
    input.disabled = false;
    spinner.classList.add('hidden');
  }
});

document.querySelectorAll('#add-work-menu button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#add-work-menu button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.getAttribute('data-target');
    document.querySelectorAll('#add-work-container .search-container').forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById(target)?.classList.remove('hidden');
  });
});
