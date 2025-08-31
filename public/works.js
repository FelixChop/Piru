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
    const title = book.title || 'Untitled';
    const author = (book.author_name && book.author_name[0]) || 'Unknown';
    li.textContent = `${title} by ${author} `;
    const btn = document.createElement('button');
    btn.textContent = i18next.t('add_work');
    btn.addEventListener('click', async () => {
      const content = Array.isArray(book.first_sentence)
        ? book.first_sentence[0]
        : book.first_sentence || '';
      const res = await fetch('/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, author, content })
      });
      if (res.ok) {
        loadWorks();
      }
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

document.getElementById('book-search-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('book-search-input').value.trim();
  if (!query) return;
  const results = await searchBooks(query);
  renderBookResults(results);
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
    li.textContent = `${movie.Title} (${movie.Year}) `;
    const btn = document.createElement('button');
    btn.textContent = i18next.t('add_work');
    btn.addEventListener('click', async () => {
      const detailRes = await fetch(`https://www.omdbapi.com/?apikey=thewdb&i=${movie.imdbID}&plot=full`);
      const detail = await detailRes.json();
      const content = detail.Plot || '';
      const res = await fetch('/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: detail.Title, author: '', content })
      });
      if (res.ok) {
        loadWorks();
      }
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

document.getElementById('movie-search-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('movie-search-input').value.trim();
  if (!query) return;
  const results = await searchMovies(query);
  renderMovieResults(results);
});
