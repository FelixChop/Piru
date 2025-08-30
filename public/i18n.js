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
      language_unavailable: 'Language not available',
      statistics: 'Statistics',
      total_words_encountered: 'Total words encountered:',
      mastered_words: 'Mastered words:',
      review_vocabulary: 'Review Vocabulary',
      logout: 'Logout',
      vocabulary_review: 'Vocabulary Review',
      paste_text_here: 'Paste text here',
      extract_vocabulary: 'Extract Vocabulary',
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
      logout: 'Déconnexion',
      vocabulary_review: 'Révision du vocabulaire',
      paste_text_here: 'Collez le texte ici',
      extract_vocabulary: 'Extraire le vocabulaire',
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
      logout: 'Cerrar sesión',
      vocabulary_review: 'Revisión de vocabulario',
      paste_text_here: 'Pega el texto aquí',
      extract_vocabulary: 'Extraer vocabulario',
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
      logout: 'Esci',
      vocabulary_review: 'Revisione del vocabolario',
      paste_text_here: 'Incolla il testo qui',
      extract_vocabulary: 'Estrai vocabolario',
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
      logout: 'Abmelden',
      vocabulary_review: 'Vokabelwiederholung',
      paste_text_here: 'Text hier einfügen',
      extract_vocabulary: 'Vokabeln extrahieren',
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

function initI18n(defaultLang = 'en') {
  return i18next.init({ lng: defaultLang, resources }).then(() => {
    updateContent();
  });
}
