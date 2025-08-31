const adminId = localStorage.getItem('userId');

async function loadUsers() {
  const res = await fetch(`/admin/users?userId=${adminId}`);
  const users = await res.json();
  const list = document.getElementById('user-list');
  list.innerHTML = '';
  users.forEach((u) => {
    const li = document.createElement('li');
    li.textContent = `${u.email} (${u.id})`;
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.addEventListener('click', async () => {
      await fetch(`/admin/users/${u.id}?userId=${adminId}`, { method: 'DELETE' });
      loadUsers();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

async function loadWorks() {
  const res = await fetch(`/admin/works?userId=${adminId}`);
  const works = await res.json();
  const list = document.getElementById('admin-work-list');
  list.innerHTML = '';
  works.forEach((w) => {
    const li = document.createElement('li');
    li.textContent = `${w.title || 'Untitled'} by ${w.author || 'Unknown'}`;
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.addEventListener('click', async () => {
      await fetch(`/admin/works/${w.id}?userId=${adminId}`, { method: 'DELETE' });
      loadWorks();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
  loadWorks();
});
