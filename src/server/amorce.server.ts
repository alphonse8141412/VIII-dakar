/** Données d'amorçage de la base : le site de Bountou (toujours) et la démonstration (DONNEES_DEMO=1). */
import {
  PHOTOS_AVANT_BOUNTOU,
  POSITION_BOUNTOU,
  type Gravite,
  type Pesee,
  type Signalement,
  type Statut,
  type TypeDechet,
  type Volet,
} from "@/lib/types";

/** Bountou Pikine : premier site repéré dans la demande (section 3.3), vérifié et en attente d'intervention. */
export const SITE_BOUNTOU: Signalement = {
  id: "bountou-pikine",
  cree_le: "2026-11-19T00:00:00.000Z",
  maj_le: "2026-11-19T00:00:00.000Z",
  lat: POSITION_BOUNTOU[0],
  lon: POSITION_BOUNTOU[1],
  quartier: "Bountou Pikine",
  type_dechet: "mixte",
  gravite: 3,
  commentaire:
    "Dépôt de déchets près de l'école Notre-Dame du Cap-Vert — en attente d'intervention.",
  photo_avant: PHOTOS_AVANT_BOUNTOU[0],
  photo_apres: null,
  statut: "verifie",
};

// ---------- Données simulées (démonstration) ----------

/** Données fictives pour présenter la plateforme avant le terrain (activées par DONNEES_DEMO=1). */
const PHOTO_DEMO = "/exemple-site-sale.svg";

const jour = (j: string) => `${j}T09:00:00.000Z`;

/** Positions exactes de chaque secteur (centre de commune / point côtier officiel). */
export const SIGNALEMENTS_DEMO: Signalement[] = [
  [
    "demo-s1",
    "2026-10-27",
    14.755999,
    -17.389165,
    "Pikine Est",
    "plastique",
    2,
    "signale",
    "Sacs plastiques le long du canal.",
  ],
  [
    "demo-s3",
    "2026-11-03",
    14.760463,
    -17.395533,
    "Pikine Nord",
    "mixte",
    2,
    "signale",
    "Terrain vague utilisé comme décharge.",
  ],
  [
    "demo-s5",
    "2026-11-10",
    14.74122,
    -17.37497,
    "Thiaroye",
    "gravats",
    2,
    "signale",
    "Gravats et plastiques en bord de route.",
  ],
  [
    "demo-s8",
    "2026-11-17",
    14.734063,
    -17.412187,
    "Plage de Pikine",
    "plastique",
    3,
    "signale",
    "Déchets plastiques ramenés par la mer.",
  ],
].map(([id, date, lat, lon, quartier, type_dechet, gravite, statut, commentaire]) => ({
  id: id as string,
  cree_le: jour(date as string),
  maj_le: jour(date as string),
  lat: lat as number,
  lon: lon as number,
  quartier: quartier as string,
  type_dechet: type_dechet as TypeDechet,
  gravite: gravite as Gravite,
  commentaire: commentaire as string,
  photo_avant: PHOTO_DEMO,
  photo_apres: null,
  statut: statut as Statut,
}));

export const PESEES_DEMO: Pesee[] = [
  // Écoles (objectif 150 kg)
  ["2026-10-28", "ecoles", "Pikine Sud", 11.5, 1.5],
  ["2026-10-29", "ecoles", "Mame Yelli Badiane", 9, 2],
  ["2026-11-04", "ecoles", "Fadilou Diop", 12.5, 1],
  ["2026-11-05", "ecoles", "Notre-Dame du Cap-Vert", 14, 2.5],
  ["2026-11-11", "ecoles", "Pikine Sud", 13, 1.5],
  ["2026-11-12", "ecoles", "Mame Yelli Badiane", 10.5, 2],
  ["2026-11-18", "ecoles", "Fadilou Diop", 12, 1],
  ["2026-11-18", "ecoles", "Notre-Dame du Cap-Vert", 15.5, 2],
  // Espaces publics (objectif 324 kg)
  ["2026-10-31", "espaces_publics", "Poubelle P001", 18, 4],
  ["2026-11-01", "espaces_publics", "Poubelle P014", 15.5, 3],
  ["2026-11-07", "espaces_publics", "Poubelle P027", 21, 5.5],
  ["2026-11-08", "espaces_publics", "Poubelle P052", 17, 2.5],
  ["2026-11-14", "espaces_publics", "Poubelle P088", 19.5, 4],
  ["2026-11-15", "espaces_publics", "Poubelle P103", 16, 3.5],
  ["2026-11-19", "espaces_publics", "Poubelle P140", 22.5, 4.5],
].map(([date, volet, lieu, kg_conformes, kg_retires], i) => ({
  id: `demo-p${i + 1}`,
  date: date as string,
  volet: volet as Volet,
  lieu: lieu as string,
  kg_conformes: kg_conformes as number,
  kg_retires: kg_retires as number,
  saisi_par: "Données de démonstration",
}));
