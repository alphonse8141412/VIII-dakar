/** Données d'amorçage de la base : le site de Bountou (toujours) et la démonstration (DONNEES_DEMO=1). */
import {
  PHOTO_SITE_CIBLE,
  PHOTOS_AVANT_BOUNTOU,
  POSITION_BOUNTOU,
  type Pesee,
  type Signalement,
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

// ---------- Sites cibles ----------

/**
 * Sites cibles du projet : repérés à l'avance, pas encore signalés ni pris en charge.
 * Bleus sur la carte jusqu'à ce que l'équipe les passe à « Signalé » ou « Vérifié ».
 * Positions exactes de chaque secteur (centre de commune / point côtier officiel).
 */
export const SITES_CIBLES: Signalement[] = (
  [
    ["cible-pikine-est", 14.755999, -17.389165, "Pikine Est"],
    ["cible-pikine-nord", 14.760463, -17.395533, "Pikine Nord"],
    ["cible-thiaroye", 14.74122, -17.37497, "Thiaroye"],
    ["cible-plage-pikine", 14.734063, -17.412187, "Plage de Pikine"],
  ] as const
).map(([id, lat, lon, quartier]) => ({
  id,
  cree_le: "2026-11-19T00:00:00.000Z",
  maj_le: "2026-11-19T00:00:00.000Z",
  lat,
  lon,
  quartier,
  type_dechet: "mixte",
  gravite: 2,
  commentaire: "Site cible du projet — à vérifier sur le terrain.",
  photo_avant: PHOTO_SITE_CIBLE,
  photo_apres: null,
  statut: "cible",
}));

// ---------- Données simulées (démonstration) ----------

/** Pesées fictives pour présenter la plateforme avant le terrain (activées par DONNEES_DEMO=1). */
export const PESEES_DEMO: Pesee[] = [
  // Écoles (objectif 36 kg : 4 établissements × 1,5 kg par semaine)
  ["2026-11-04", "ecoles", "Pikine Sud", 1.4, 0.2],
  ["2026-11-05", "ecoles", "Mame Yelli Badiane", 1.2, 0.3],
  ["2026-11-11", "ecoles", "Fadilou Diop", 1.6, 0.1],
  ["2026-11-12", "ecoles", "Notre-Dame du Cap-Vert", 1.5, 0.2],
  ["2026-11-18", "ecoles", "Pikine Sud", 1.5, 0.2],
  // Espaces publics (objectif 36 kg : 20 poubelles × 0,3 kg par semaine)
  ["2026-11-07", "espaces_publics", "Poubelle P003", 0.3, 0.1],
  ["2026-11-08", "espaces_publics", "Poubelle P011", 0.4, 0.1],
  ["2026-11-14", "espaces_publics", "Poubelle P017", 0.3, 0],
  ["2026-11-19", "espaces_publics", "Poubelle P020", 0.25, 0.05],
].map(([date, volet, lieu, kg_conformes, kg_retires], i) => ({
  id: `demo-p${i + 1}`,
  date: date as string,
  volet: volet as Volet,
  lieu: lieu as string,
  kg_conformes: kg_conformes as number,
  kg_retires: kg_retires as number,
  saisi_par: "Données de démonstration",
}));
