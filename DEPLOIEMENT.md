# Déploiement d'Éco-acteurs Pikine

## En résumé

Cette application **n'est pas un site statique** : elle a son propre serveur. Les signalements, les pesées
et le mode équipe sont enregistrés dans une base **SQLite** (node:sqlite) et les photos dans des fichiers
**JPEG sur le disque**. Elle doit donc tourner sur un **serveur Node avec un disque durable** (un VPS).

## Pourquoi pas Vercel

Sur Vercel, le code s'exécute dans des fonctions temporaires dont le disque est effacé régulièrement.
Une base SQLite et des photos écrites sur le disque y seraient perdues, et le build ne produit pas
le format attendu par Vercel (nitro avec le preset node-server dans vite.config.ts).

**Conséquence :** le dépôt est relié à Vercel, donc chaque push y déclenche un build qui peut échouer.
Ce n'est pas un défaut de l'application : Vercel n'est simplement pas la cible de ce projet.
Erreur observée sur Vercel : STATIC_BUILD_NO_OUT_DIR (Vercel cherche un dossier statique « dist »,
alors que ce projet produit un serveur Node dans .output).
Les déploiements automatiques sont donc désactivés par vercel.json (git.deploymentEnabled à false).

## Où elle tourne

Sur le serveur ubuntu-robit (DigitalOcean), qui héberge déjà d'autres services en production.
Ce serveur a peu de mémoire (environ 1 Go au total, dont une petite partie libre). L'application est donc
lancée dans un conteneur Docker avec une **limite de mémoire**, pour ne pas fragiliser les autres services.

## Architecture visée

    téléphone  -- https -->  Caddy (ports 80 et 443, certificat automatique)
                                  |
                                  v
                       application Node (conteneur Docker)
                                  |
                                  v
                          dossier de données
                    (eco-pikine.sqlite + dossier photos)

- L'application n'est **jamais exposée directement** : seul Caddy reçoit le trafic.
- Le **HTTPS est obligatoire** : sans lui, les téléphones bloquent l'appareil photo et la géolocalisation.
- Le build est fait **sur un ordinateur de développement** (npm run build, environ 4 Mo dans .output),
  puis le dossier .output est copié sur le serveur. Rien n'est compilé sur le serveur.

## Réglages (variables d'environnement)

| Variable | Rôle |
| --- | --- |
| CODE_EQUIPE | Code du mode équipe, vérifié par le serveur (obligatoire en production) |
| SECRET_SESSION | Clé de signature du cookie équipe (obligatoire, 32 caractères ou plus) |
| DOSSIER_DONNEES | Dossier de la base et des photos (à sauvegarder) |
| DONNEES_DEMO=1 | Ajoute les données de démonstration à la création de la base (à éviter en production) |
| PORT | Port d'écoute de l'application |

Les valeurs de CODE_EQUIPE et SECRET_SESSION sont dans un fichier .env **sur le serveur uniquement**
(permissions 600). Elles ne doivent **jamais** être commitées, ni envoyées par message.

## Avancement

- [x] Build de production vérifié en local (serveur Node autonome, réponse HTTP 200)
- [ ] Dossiers et fichier .env créés sur le serveur
- [ ] Choix du nom de domaine ou sous-domaine (enregistrement DNS de type A vers le serveur)
- [ ] Envoi du dossier .output sur le serveur
- [ ] Conteneur de l'application avec limite de mémoire et dossier de données monté à part
- [ ] Caddy en conteneur, avec le certificat HTTPS
- [ ] Test réel : créer un signalement avec photo depuis un téléphone, puis vérifier la base et le fichier
- [ ] Sauvegarde régulière du dossier de données
- [x] Désactiver les déploiements automatiques Vercel pour ce dépôt

## Sauvegarde

Il suffit de copier DOSSIER_DONNEES : la base (avec ses fichiers -wal et -shm) et le dossier photos.
Idéalement, arrêter l'application ou utiliser la sauvegarde SQLite pendant la copie.

## Points de vigilance

- Surveiller la mémoire du serveur après la mise en ligne (docker stats) : elle est très juste.
- Mettre à jour l'application = refaire le build, remplacer .output sur le serveur, redémarrer le conteneur.
  Le dossier de données n'est pas touché.
