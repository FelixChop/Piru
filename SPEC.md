# 📘 Spécification Produit & Technique – Piru (MVP)

## 1. 🎯 Objectif
Apprentissage du vocabulaire lié aux œuvres (livres, films, séries) à travers un espace individuel où l’utilisateur colle du texte, extrait automatiquement les mots difficiles, et révise via flashcards avec algorithme SM-2.

## 2. 🧑‍💻 Utilisateur & parcours
### Onboarding
- Compte via Google OAuth ou email+mot de passe.
- Choix de la langue natale (langue dans laquelle l'utilisateur verra les traductions).
- Choix des langues (une ou plusieurs).
- Niveau estimé choisi manuellement (A1–C2).

### Ajout d’œuvre
- Bloc texte libre : l’utilisateur colle un extrait de son livre (ex: un chapitre de *The Bluest Eye*). Ajout manuel de titre et auteur.
- Extraction automatique du vocabulaire difficile par LLM (ChatGPT API) qui analyse le texte et extrait les mots « difficiles » en fonction du niveau déclaré et fournit les définitions.

### Vocabulaire personnel
- Chaque mot extrait devient une entrée avec :
  - mot/lemme
  - langue d'origine
  - niveau de difficulté du mot dans la langue cible
  - définition générée par LLM (non éditable en MVP) dans la langue natale de l'utilisateur
  - citations (au moins une, extraite du texte collé)
  - statut : nouveau, en cours, maîtrisé, ne pas apprendre, appris définitivement
  - tag : à apprendre / à ne pas apprendre

### Révision
- Flashcards SM-2 (style Anki).
- Recto : mot/expression.
- Verso : définition + citation(s).
- Feedback utilisateur :
  - Connais (progresse dans l’algorithme)
  - Ne me rappelle pas (reset/replanifie)
  - Appris, ne plus me le montrer (archivé définitivement)
  - Ne pas apprendre (archivé comme « à ignorer »)
- Pas de limite quotidienne, l’utilisateur révise autant qu’il veut.

### Progression
Statistiques visibles :
- % de vocabulaire maîtrisé d’une œuvre (ex : *The Bluest Eye* : 60/180 mots → 33 %).
- % de difficulté estimée d’une œuvre.
- Nombre total de mots rencontrés.
- Nombre de mots maîtrisés.
- Streak (jours de révision consécutifs).

## 3. ⚙️ Fonctionnalités MVP
- Espace utilisateur (multi-langues).
- Connexion (OAuth/email).
- Bloc texte + métadonnées (titre/auteur).
- Analyse automatique par LLM : extraction mots difficiles, définition, citation associée.
- Liste vocabulaire personnelle (filtre par œuvre, statut, langue).
- Révision flashcards SM-2.
- Statistiques personnelles (% appris, progression, difficulté œuvre).
- Gestion statut des mots (nouveau/en cours/maîtrisé/etc.).
- Suppression de compte (RGPD).

## 4. 🖼 Modèles de données
Tables principales (simplifiées) :

| Table | Champs principaux |
|-------|------------------|
| users | id, email, password_hash, created_at |
| user_languages | id, user_id, code, level (A1–C2) |
| works | id, user_id, title, author, language, created_at |
| vocab_entries | id, user_id, work_id, word, lemma, language, definition, status, tag, created_at |
| citations | id, vocab_entry_id, work_id, text_excerpt, location (page/timecode), created_at |
| reviews | id, vocab_entry_id, reviewed_at, result (connais/oublié/etc.), sm2_interval, sm2_easiness, sm2_repetitions, next_due |

## 5. 📡 API (MVP)
### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Œuvres
- `POST /works` (titre, auteur, texte collé → retour : mots extraits)
- `GET /works` (liste user)

### Vocabulaire
- `GET /vocab?work_id=&status=`
- `POST /vocab/{id}/status` (changer statut)

### Révisions
- `GET /reviews/today` (batch cartes du jour)
- `POST /reviews/{id}` (résultat flashcard, update SM-2)

### Stats
- `GET /stats/overview` (totaux)
- `GET /stats/work/{id}` (% appris, difficulté, progression)

### Compte
- `DELETE /me` (suppression)

## 6. 🔧 Stack technique
- Frontend : Next.js + Tailwind + shadcn/ui (responsive web, priorité mobile).
- Backend : Supabase (Postgres + Auth + Edge Functions).
- LLM API : ChatGPT (analyse + définitions).
- Mobile : web responsive dès MVP, exploration app React Native (multi-plateforme) dès V1.

## 7. 🚀 Roadmap
### MVP (3–4 mois)
- Auth (multi-langues)
- Bloc texte + extraction vocabulaire via LLM
- Stockage + affichage vocabulaire par œuvre
- Flashcards SM-2 + stats basiques
- Progression utilisateur

### V1 (6–8 mois)
- Upload PDF (OCR extraction)
- UX mobile optimisée / app React Native
- Stats avancées (rétention, comparatif entre langues)
- Paiement premium (illimité vocabulaire + multi-langues)

### V2 (12 mois)
- Sous-titres films/séries (via API OpenSubtitles)
- Évaluation de niveau automatisée (test adaptatif)
- Partage collaboratif (optionnel, avec contrôle des droits)

## 8. 💰 Modèle économique
**Freemium** :
- Gratuit : quota de vocabulaire stocké limité (~200 mots), 1 langue max.
- Premium : vocabulaire illimité + multi-langues + stats avancées.

**Tarif** :
- 100 €/an (≈8,3 €/mois).
- Paiement via Stripe.
