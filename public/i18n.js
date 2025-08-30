(function() {
const i18nResources = {
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
      language_unavailable: 'Language not available',
      statistics: 'Statistics',
      total_words_encountered: 'Total words encountered:',
      mastered_words: 'Mastered words:',
      review_vocabulary: 'Review Vocabulary',
      learn: 'Learn',
      view_stats: 'View Stats',
      logout: 'Logout',
      vocabulary_review: 'Vocabulary Review',
      show_definition: 'Show Definition',
      again: 'Again',
      good: 'Good'
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
      language_unavailable: "Cette langue n'est pas disponible",
      statistics: 'Statistiques',
      total_words_encountered: 'Nombre total de mots rencontrés :',
      mastered_words: 'Mots maîtrisés :',
      review_vocabulary: 'Réviser le vocabulaire',
      learn: 'Apprendre',
      view_stats: 'Voir ses stats',
      logout: 'Déconnexion',
      vocabulary_review: 'Révision du vocabulaire',
      show_definition: 'Afficher la définition',
      again: 'Encore',
      good: 'Bien'
    }
  },
  es: {
    translation: {
      site_name: 'Piru',
      tagline: 'Consume medios en idiomas extranjeros.',
      login: 'Iniciar sesión',
      sign_up: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      native_language: 'Idioma nativo',
      learning_language: 'Idioma a aprender',
      select_language: 'Seleccionar idioma',
      your_works: 'Tus obras',
      title: 'Título',
      author: 'Autor',
      content: 'Contenido',
      add_work: 'Agregar obra',
      account_created: 'Cuenta creada. Ahora puedes iniciar sesión.',
      language_unavailable: 'Idioma no disponible',
      statistics: 'Estadísticas',
      total_words_encountered: 'Total de palabras encontradas:',
      mastered_words: 'Palabras dominadas:',
      review_vocabulary: 'Repasar vocabulario',
      learn: 'Aprender',
      view_stats: 'Ver estadísticas',
      logout: 'Cerrar sesión',
      vocabulary_review: 'Revisión de vocabulario',
      show_definition: 'Mostrar definición',
      again: 'De nuevo',
      good: 'Bien'
    }
  },
  it: {
    translation: {
      site_name: 'Piru',
      tagline: 'Consuma media in lingue straniere.',
      login: 'Accesso',
      sign_up: 'Registrati',
      email: 'Email',
      password: 'Password',
      native_language: 'Lingua madre',
      learning_language: 'Lingua da imparare',
      select_language: 'Seleziona lingua',
      your_works: 'Le tue opere',
      title: 'Titolo',
      author: 'Autore',
      content: 'Contenuto',
      add_work: 'Aggiungi opera',
      account_created: 'Account creato. Ora puoi accedere.',
      language_unavailable: 'Lingua non disponibile',
      statistics: 'Statistiche',
      total_words_encountered: 'Totale parole incontrate:',
      mastered_words: 'Parole padroneggiate:',
      review_vocabulary: 'Ripassa il vocabolario',
      learn: 'Imparare',
      view_stats: 'Vedi statistiche',
      logout: 'Esci',
      vocabulary_review: 'Revisione del vocabolario',
      show_definition: 'Mostra definizione',
      again: 'Di nuovo',
      good: 'Bene'
    }
  },
  de: {
    translation: {
      site_name: 'Piru',
      tagline: 'Konsumiere Medien in Fremdsprachen.',
      login: 'Anmelden',
      sign_up: 'Registrieren',
      email: 'E-Mail',
      password: 'Passwort',
      native_language: 'Muttersprache',
      learning_language: 'Zu lernende Sprache',
      select_language: 'Sprache auswählen',
      your_works: 'Deine Werke',
      title: 'Titel',
      author: 'Autor',
      content: 'Inhalt',
      add_work: 'Werk hinzufügen',
      account_created: 'Konto erstellt. Du kannst dich jetzt anmelden.',
      language_unavailable: 'Sprache nicht verfügbar',
      statistics: 'Statistiken',
      total_words_encountered: 'Gesamtzahl der Wörter:',
      mastered_words: 'Beherrschte Wörter:',
      review_vocabulary: 'Vokabeln wiederholen',
      learn: 'Lernen',
      view_stats: 'Statistiken ansehen',
      logout: 'Abmelden',
      vocabulary_review: 'Vokabelwiederholung',
      show_definition: 'Definition anzeigen',
      again: 'Nochmals',
      good: 'Gut'
    }
  }
};

function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18next.t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = i18next.t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = i18next.language;
}

function initI18n(defaultLang = 'en', resourcesData = i18nResources) {
  return i18next.init({ lng: defaultLang, resources: resourcesData }).then(() => {
    updateContent();
  });
}

window.updateContent = updateContent;
window.initI18n = initI18n;
})();
