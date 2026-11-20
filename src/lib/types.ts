/** Types et référentiels partagés par le navigateur et le serveur. */

// ---------- Types ----------

/** « cible » : site repéré par le projet, pas encore signalé ni pris en charge (bleu sur la carte). */
export type Statut = "cible" | "signale" | "verifie" | "nettoye" | "rehabilite";
export type TypeDechet = "plastique" | "menagers" | "gravats" | "mixte";
export type Gravite = 1 | 2 | 3;
export type Volet = "ecoles" | "espaces_publics" | "nettoyage";

export type Signalement = {
  id: string;
  cree_le: string; // ISO
  lat: number;
  lon: number;
  quartier: string;
  type_dechet: TypeDechet;
  gravite: Gravite;
  commentaire: string;
  photo_avant: string; // data URL (étape 2) puis URL de fichier (étape 4)
  photo_apres: string | null;
  statut: Statut;
  maj_le: string;
};

export type Pesee = {
  id: string;
  date: string; // AAAA-MM-JJ
  volet: Volet;
  lieu: string; // nom de l'école, n° de poubelle ou site de nettoyage
  kg_conformes: number;
  kg_retires: number;
  saisi_par: string; // groupe ou prénom du scout
};

// ---------- Référentiels issus de la demande de microsubvention ----------

export const STATUTS: Record<Statut, { label: string; couleur: string; fonce: string }> = {
  cible: { label: "Site cible", couleur: "#60A5FA", fonce: "#1D4ED8" },
  signale: { label: "Signalé", couleur: "#F87171", fonce: "#B91C1C" },
  verifie: { label: "Vérifié", couleur: "#FBBF24", fonce: "#B45309" },
  nettoye: { label: "Nettoyé", couleur: "#4ADE80", fonce: "#15803D" },
  rehabilite: { label: "Réhabilité", couleur: "#A78BFA", fonce: "#6D28D9" },
};
/** Étapes du suivi d'un site signalé (un site cible n'a encore franchi aucune étape). */
export const ORDRE_STATUTS: Statut[] = ["signale", "verifie", "nettoye", "rehabilite"];

export const estCible = (s: { statut: Statut }) => s.statut === "cible";

/** Photo provisoire d'un site cible, remplacée par la vraie photo « avant » de l'équipe. */
export const PHOTO_SITE_CIBLE = "/site-cible.svg";

export const TYPES_DECHET: Record<TypeDechet, string> = {
  plastique: "Plastique",
  menagers: "Ordures ménagères",
  gravats: "Gravats",
  mixte: "Mélangés",
};

export const GRAVITES: Record<Gravite, string> = {
  1: "Faible",
  2: "Moyenne",
  3: "Forte",
};

/**
 * Objectifs du projet (nouveau calcul, 6 semaines de collecte) :
 *   Écoles                4 établissements × 1,5 kg par semaine × 6 semaines (≈ 1 440 bouteilles) = 36 kg
 *   Espaces publics       20 poubelles × 0,3 kg par semaine × 6 semaines                         = 36 kg
 *   Journées de nettoyage 2 journées × 100 volontaires × 0,15 kg                                 = 30 kg
 *   Total                 102 kg, arrondi à 100 kg
 */
export const VOLETS: Record<Volet, { label: string; objectif_kg: number }> = {
  ecoles: { label: "Écoles", objectif_kg: 36 },
  espaces_publics: { label: "Espaces publics", objectif_kg: 36 },
  nettoyage: { label: "Journées de nettoyage", objectif_kg: 30 },
};
export const OBJECTIF_TOTAL_KG = 100;
/** Seuil minimum affiché sur la jauge : la moitié de l'objectif. */
export const SEUIL_MINIMUM_KG = 50;
export const OBJECTIF_CONFORMITE = 0.8;

export const ECOLES = [
  "Pikine Sud",
  "Mame Yelli Badiane",
  "Fadilou Diop",
  "Notre-Dame du Cap-Vert",
];
/** 20 poubelles à plastique dans les espaces publics. */
export const POUBELLES = Array.from(
  { length: 20 },
  (_, i) => `Poubelle P${String(i + 1).padStart(3, "0")}`,
);

export const QUARTIERS = [
  "Bountou Pikine",
  "Pikine Est",
  "Pikine Ouest",
  "Pikine Nord",
  "Pikine Sud",
  "Thiaroye",
  "Dalifort",
  "Guinaw Rails",
  "Plage de Pikine",
  "Autre",
];

/** Secteur de Bountou Pikine (premier site repéré, section 3.3) : 14° 44' 52.1" N, 17° 24' 01.8" O. */
export const POSITION_BOUNTOU: [number, number] = [14.74781, -17.40051];

/** Photos « avant » du site de Bountou Pikine, prises sur le terrain le 19 novembre 2026. */
export const PHOTOS_AVANT_BOUNTOU = [1, 2, 3, 4].map((n) => `/bountou-avant-${n}.jpg`);

/** Photos « avant » supplémentaires par site (la première est aussi enregistrée dans photo_avant). */
export const GALERIES_AVANT: Record<string, string[]> = {
  "bountou-pikine": PHOTOS_AVANT_BOUNTOU,
};

/** Centre par défaut de la carte : le secteur de Bountou Pikine. */
export const CENTRE_PIKINE: [number, number] = POSITION_BOUNTOU;
