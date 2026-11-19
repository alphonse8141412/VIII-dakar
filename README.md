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

Code équipe par défaut : `scout8` (variable `VITE_CODE_EQUIPE`). Les données sont pour l'instant
stockées dans le navigateur (`src/lib/donnees.ts`) ; elles passeront sur un stockage partagé à l'étape 4.
