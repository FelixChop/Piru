(function() {
  const btn = document.getElementById('delete-account');
  if (btn) {
    btn.addEventListener('click', async () => {
      if (!confirm(i18next.t('confirm_delete_account'))) return;
      const userId = localStorage.getItem('userId');
      if (!userId) {
        window.location.href = '/';
        return;
      }
      const res = await fetch(`/auth/account?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        localStorage.removeItem('userId');
        localStorage.removeItem('nativeLanguage');
        localStorage.removeItem('email');
        localStorage.removeItem('isAdmin');
        window.location.href = '/';
      } else {
        alert('Failed to delete account');
      }
    });
  }
  const defaultLang = localStorage.getItem('nativeLanguage') || 'en';
  initI18n(defaultLang).then(() => {
    updateContent();
  });
})();
