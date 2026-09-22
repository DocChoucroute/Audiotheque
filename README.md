# Audiothèque

Application perso pour écouter tes propres enregistrements de livres, chapitre
par chapitre — avec une interface d'écoute sobre et un espace admin pour
uploader les fichiers audio.

- **Stack** : React + Vite + Tailwind CSS v4, [Supabase](https://supabase.com)
  (base de données + stockage des fichiers audio + authentification admin).
- **Déploiement** : GitHub + Vercel (comme tes autres projets).

Le premier livre (*Le Hobbit*) est déjà créé par le script SQL de mise en
route ; il ne reste qu'à ajouter les chapitres depuis l'espace admin au fur
et à mesure de tes enregistrements.

---

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un compte (gratuit).
2. Crée un nouveau projet (choisis une région proche de toi, ex. Europe).
   Note le mot de passe de base de données généré, tu n'en auras pas besoin
   ici mais garde-le de côté.
3. Une fois le projet prêt, va dans **SQL Editor** (menu de gauche) → **New
   query**, colle le contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql)
   de ce dépôt, puis clique sur **Run**.
   Ça crée les tables `books` et `chapters`, les règles de sécurité (lecture
   publique, écriture réservée à l'admin), le bucket de stockage
   `audio-chapters`, et ajoute *Le Hobbit* comme premier livre.

## 2. Créer le compte admin

L'interface `/admin` ne demande qu'un mot de passe, mais en coulisses elle
s'appuie sur un vrai compte Supabase Auth (plus sûr qu'un mot de passe
vérifié uniquement côté navigateur).

1. Dans le dashboard Supabase : **Authentication** → **Users** → **Add
   user** → **Create new user**.
2. Email : choisis n'importe quelle adresse, par exemple
   `admin@audiotheque.local` (elle n'a pas besoin d'exister réellement, ce
   n'est qu'un identifiant technique — tu ne la verras jamais dans
   l'interface).
3. Mot de passe : choisis le mot de passe que tu utiliseras pour te
   connecter à `/admin`.
4. Coche **Auto Confirm User** pour éviter d'avoir à confirmer l'email.

Retiens bien l'email choisi à l'étape 2 : c'est la valeur de
`VITE_ADMIN_EMAIL` à l'étape suivante.

## 3. Configurer les variables d'environnement

1. Copie `.env.example` en `.env` :
   ```
   cp .env.example .env
   ```
2. Remplis les trois valeurs :
   - `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` : dans le dashboard
     Supabase → **Project Settings** → **API**.
   - `VITE_ADMIN_EMAIL` : l'email choisi à l'étape 2.

## 4. Lancer en local

```
npm install
npm run dev
```

L'appli est disponible sur `http://localhost:5173`. Va sur `/admin`,
connecte-toi avec le mot de passe choisi, et ajoute les chapitres du Hobbit
au fur et à mesure de tes enregistrements (titre + fichier audio).

## 5. Déployer sur Vercel

1. Pousse ce projet sur un dépôt GitHub (comme PokéRank / PokéList).
2. Sur [vercel.com](https://vercel.com), **Add New** → **Project** → importe
   le dépôt.
3. Dans les réglages du projet Vercel, ajoute les 3 variables d'environnement
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`) avec
   les mêmes valeurs que ton `.env`.
4. Déploie. Les prochains push sur la branche principale redéploient
   automatiquement.

---

## Limites du plan gratuit Supabase à connaître

- **1 Go de stockage** au total pour les fichiers audio. Largement de quoi
  démarrer avec un livre ou deux ; à surveiller si tu ajoutes beaucoup de
  livres avec beaucoup de chapitres.
- **50 Mo max par fichier uploadé**. L'appli refuse l'upload et te prévient
  si un fichier dépasse cette taille. Pour de la voix seule (sans musique),
  un export MP3 mono à 64–96 kbps tient très largement dans cette limite
  pour un chapitre classique (à 64 kbps, ça fait environ 1h45 de voix pour
  50 Mo) ; inutile d'exporter en qualité CD.
- **Pause après 7 jours d'inactivité** : si personne n'utilise l'appli
  pendant une semaine, Supabase met le projet en pause automatiquement. Il
  suffit d'ouvrir le dashboard Supabase pour le relancer (bouton "Restore"),
  aucune donnée n'est perdue. Si ça devient gênant à l'usage, le plan payant
  (à partir de 25 $/mois) lève cette limite — mais pour un usage perso ça ne
  devrait pas être nécessaire.

Ces limites sont vérifiées auprès de Supabase à la conception de ce projet
(septembre 2026) ; vaut le coup de les revérifier sur
[supabase.com/pricing](https://supabase.com/pricing) si elles semblent avoir
changé.

## Et le "prompteur" (texte qui suit la lecture) ?

Cette version n'inclut pas encore le suivi du texte en direct — on avait
convenu de d'abord poser une base solide pour écouter et gérer les livres,
et d'ajouter cette fonctionnalité dans un second temps.

Pour ne pas avoir à tout redessiner plus tard, la table `chapters` a déjà
deux colonnes prêtes à l'emploi mais inutilisées pour l'instant :
- `transcript` : le texte intégral du chapitre.
- `transcript_segments` : un tableau JSON du type
  `[{ "start": 12.4, "end": 15.1, "text": "..." }, ...]` donnant, pour
  chaque segment de texte, l'instant où il commence et se termine dans
  l'audio.

Le jour où on s'y attaque, deux approches possibles :
1. **Synchronisation manuelle** — tu fournis le texte, et un petit outil
   dans l'admin permet de caler des repères de temps approximatifs en
   écoutant l'audio.
2. **Alignement automatique** — un outil de reconnaissance vocale (ex.
   Whisper) transcrit l'audio et donne les timestamps mot par mot ou
   phrase par phrase automatiquement, à partir du texte original du livre.
   Plus précis, mais demande plus de mise en place (traitement à lancer par
   livre, potentiellement hors du navigateur).

On pourra en rediscuter une fois que l'appli de base tourne bien avec tes
premiers chapitres du Hobbit.
