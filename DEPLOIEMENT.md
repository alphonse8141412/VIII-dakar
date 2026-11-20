# Déploiement d'Éco-acteurs Pikine

## En résumé

L'application tourne sur **Vercel**. Elle a son propre serveur (fonctions Vercel) et stocke :

- les signalements, les pesées et les réglages dans une base **Turso** (libSQL, compatible SQLite) ;
- les photos dans **Vercel Blob** (adresses publiques, cache long).

Le disque des fonctions Vercel est temporaire : sans Turso et Blob, rien ne serait conservé.
Le code refuse donc de démarrer sur Vercel si `TURSO_DATABASE_URL` ou `BLOB_READ_WRITE_TOKEN` manque.

## Compilation

- `vite.config.ts` choisit le preset nitro selon l'environnement : `vercel` quand la variable `VERCEL`
  est définie (c'est le cas pendant la compilation sur Vercel), `node-server` sinon.
- Le preset `vercel` produit `.vercel/output` (Build Output API) : Vercel le prend tel quel,
  aucun dossier `dist` n'est attendu (c'était la cause de l'ancienne erreur STATIC_BUILD_NO_OUT_DIR).
- `vercel.json` impose `npm ci` puis `npm run build` (le dépôt contient aussi `bun.lock` pour Lovable).
- Tester la compilation Vercel en local : `VERCEL=1 npm run build`.

## Mise en place (une seule fois)

1. **Turso** : créer une base (région proche de l'Europe/Afrique de l'Ouest, par ex. Paris ou Francfort),
   puis récupérer son adresse `libsql://…` et créer un jeton.
2. **Vercel → Storage** : créer un **Blob store** public et le relier au projet
   (la variable `BLOB_READ_WRITE_TOKEN` est ajoutée automatiquement).
3. **Vercel → Settings → Environment Variables** (environnement Production, et Preview si besoin) :

| Variable | Rôle |
| --- | --- |
| TURSO_DATABASE_URL | Adresse de la base Turso (`libsql://…`) |
| TURSO_AUTH_TOKEN | Jeton d'accès Turso |
| BLOB_READ_WRITE_TOKEN | Ajouté par Vercel en reliant le Blob store |
| CODE_EQUIPE | Code du mode équipe (obligatoire, autre que `scout8`) |
| SECRET_SESSION | Clé de signature du cookie équipe (obligatoire, 32 caractères ou plus) |
| DONNEES_DEMO=1 | Facultatif : données de démonstration à la création de la base (à éviter en production) |

4. Pousser sur la branche reliée (ou « Redeploy ») : les tables et le site de Bountou sont créés
   au premier appel.

Les valeurs secrètes ne sont **jamais** commitées ni envoyées par message : uniquement dans Vercel.

## Avancement

- [x] Stockage réécrit : Turso (libSQL) pour la base, Vercel Blob pour les photos
- [x] Compilation Vercel vérifiée en local (`VERCEL=1 npm run build`, module natif libSQL inclus)
- [x] Stockage testé en local (fichier SQLite) : lecture, ajout, suppression, modification, photo
- [x] Déploiements automatiques Vercel réactivés (vercel.json)
- [ ] Base Turso créée et variables TURSO_* ajoutées dans Vercel
- [ ] Blob store créé et relié au projet
- [ ] CODE_EQUIPE et SECRET_SESSION ajoutés dans Vercel
- [ ] Test réel : créer un signalement avec photo depuis un téléphone, puis vérifier la base Turso et le Blob

## Sauvegarde

- Base : `turso db shell <base> .dump > sauvegarde.sql` (Turso garde aussi un historique restaurable).
- Photos : elles restent dans le Blob store ; leurs adresses sont enregistrées dans la base.

## Sans Vercel (développement ou VPS)

Sans `TURSO_DATABASE_URL` ni `BLOB_READ_WRITE_TOKEN`, l'application utilise un fichier SQLite et des photos
JPEG sur le disque, dans `DOSSIER_DONNEES` (défaut `./donnees-serveur`), servies par `/photos/<nom>`.
`npm run build && npm start` lance alors un serveur Node autonome.
