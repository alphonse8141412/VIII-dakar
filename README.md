# Jeunes Éco-Acteurs de Pikine — plateforme de signalement et de suivi

Application web (téléphone et ordinateur) du projet des Scouts Groupe VIIIe Dakar :
signaler un site sale (photo + position), suivre son statut (signalé → vérifié → nettoyé → réhabilité),
tenir le registre des pesées et afficher le tableau de bord des kilos collectés.

## Pages
| URL | Rôle |
| --- | --- |
| `/accueil` | Objectif 600 kg, indicateurs, accès au signalement |
| `/signaler` | Photo, position GPS, type de déchets, gravité, quartier |
| `/carte` | Carte OpenStreetMap des sites, filtre par statut |
| `/site/:id` | Photos avant/après, suivi, actions de l'équipe |
| `/pesees` | Registre des pesées (saisie réservée à l'équipe) |
| `/bilan` | Tableau de bord : kg par volet, conformité, signalements par statut et quartier |

## Développement
```sh
npm i
npm run dev
```

En développement, le code équipe est `scout8` et les données vont dans `./donnees-serveur/`.

## Serveur (VPS)
Les données sont partagées entre tous les téléphones : base SQLite (`node:sqlite`, Node ≥ 22.5)
et photos JPEG sur le disque, dans `DOSSIER_DONNEES`.

```sh
npm ci && npm run build
CODE_EQUIPE='...' SECRET_SESSION='une-longue-chaine-aleatoire' \
DOSSIER_DONNEES=/var/lib/eco-pikine PORT=3000 npm start
```

| Variable | Rôle |
| --- | --- |
| `CODE_EQUIPE` | Code du mode équipe, vérifié par le serveur (obligatoire en production) |
| `SECRET_SESSION` | Clé de signature du cookie équipe (obligatoire, 32 caractères ou plus) |
| `DOSSIER_DONNEES` | Dossier de la base et des photos (à sauvegarder) |
| `DONNEES_DEMO=1` | Ajoute les données de démonstration à la création de la base |
| `PORT` | Port d'écoute (3000 par défaut) |

Mettez l'app derrière Caddy ou Nginx en **https** : sans https, la caméra et le GPS sont bloqués
par les téléphones. Sauvegarde : copier `DOSSIER_DONNEES` (base + photos).
