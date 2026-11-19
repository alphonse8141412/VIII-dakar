/**
 * Couche de données de la plateforme Jeunes Éco-Acteurs de Pikine.
 *
 * Étape 2 : stockage local (navigateur) pour construire et tester l'interface.
 * Étape 4 : ces fonctions seront branchées sur un stockage partagé (base de données + photos)
 * sans changer les pages, qui n'utilisent que les hooks exportés ici.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---------- Types ----------

export type Statut = "signale" | "verifie" | "nettoye" | "rehabilite";
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
  signale: { label: "Signalé", couleur: "#F87171", fonce: "#B91C1C" },
  verifie: { label: "Vérifié", couleur: "#FBBF24", fonce: "#B45309" },
  nettoye: { label: "Nettoyé", couleur: "#4ADE80", fonce: "#15803D" },
  rehabilite: { label: "Réhabilité", couleur: "#60A5FA", fonce: "#1D4ED8" },
};
export const ORDRE_STATUTS: Statut[] = ["signale", "verifie", "nettoye", "rehabilite"];

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

/** Objectifs du tableau « Résultats du projet » (section 7). */
export const VOLETS: Record<Volet, { label: string; objectif_kg: number }> = {
  ecoles: { label: "Écoles", objectif_kg: 150 },
  espaces_publics: { label: "Espaces publics", objectif_kg: 324 },
  nettoyage: { label: "Journées de nettoyage", objectif_kg: 150 },
};
export const OBJECTIF_TOTAL_KG = 600;
export const SEUIL_MINIMUM_KG = 300;
export const OBJECTIF_CONFORMITE = 0.8;

export const ECOLES = [
  "Pikine Sud",
  "Mame Yelli Badiane",
  "Fadilou Diop",
  "Notre-Dame du Cap-Vert",
];
export const POUBELLES = Array.from(
  { length: 200 },
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

/** Secteur de Bountou Pikine (premier site repéré, section 3.3) : 14° 44' 44" N, 17° 24' 03" O — Plus Code 7C64PHWX+7J. */
export const POSITION_BOUNTOU: [number, number] = [14.74565, -17.40093];

/** Centre par défaut de la carte : le secteur de Bountou Pikine. */
export const CENTRE_PIKINE: [number, number] = POSITION_BOUNTOU;

// ---------- Stockage local ----------

const CLE_SIGNALEMENTS = "eco-pikine:signalements";
const CLE_PESEES = "eco-pikine:pesees";

function lire<T>(cle: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(cle) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function ecrire<T>(cle: string, valeurs: T[]) {
  try {
    window.localStorage.setItem(cle, JSON.stringify(valeurs));
  } catch {
    throw new Error("Espace de stockage plein : la photo est peut-être trop lourde.");
  }
}

const nouvelId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ---------- Sites déjà connus ----------

const CLE_AMORCE = "eco-pikine:amorce-bountou";

/** Bountou Pikine : premier site repéré dans la demande (section 3.3), vérifié et en attente d'intervention. */
const SITE_BOUNTOU: Signalement = {
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
  photo_avant: "/bountou-avant.svg",
  photo_apres: null,
  statut: "verifie",
};

// ---------- Données simulées (démonstration) ----------

/**
 * Données fictives pour présenter la plateforme avant le terrain.
 * Volontairement à zéro : sites nettoyés, sites réhabilités et journées de nettoyage.
 * Pour les retirer : passer DONNEES_DEMO à false et vider le stockage du navigateur.
 */
export const DONNEES_DEMO = true;
const CLE_DEMO = "eco-pikine:demo-v2";
const PHOTO_DEMO = "/exemple-site-sale.svg";

const jour = (j: string) => `${j}T09:00:00.000Z`;

/** Positions approximatives dans chaque quartier. */
const SIGNALEMENTS_DEMO: Signalement[] = [
  [
    "demo-s1",
    "2026-10-27",
    14.7562,
    -17.3831,
    "Pikine Est",
    "plastique",
    2,
    "signale",
    "Sacs plastiques le long du canal.",
  ],
  [
    "demo-s3",
    "2026-11-03",
    14.7648,
    -17.3935,
    "Pikine Nord",
    "mixte",
    2,
    "signale",
    "Terrain vague utilisé comme décharge.",
  ],
  [
    "demo-s5",
    "2026-11-10",
    14.7553,
    -17.3748,
    "Thiaroye",
    "gravats",
    2,
    "signale",
    "Gravats et plastiques en bord de route.",
  ],
  [
    "demo-s8",
    "2026-11-17",
    14.7395,
    -17.399,
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

const PESEES_DEMO: Pesee[] = [
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

/** Ajoute une seule fois les sites déjà connus (et la démo) ; ensuite l'équipe les fait évoluer comme les autres. */
function amorcer() {
  if (typeof window === "undefined") return;
  try {
    if (!window.localStorage.getItem(CLE_AMORCE)) {
      const liste = lire<Signalement>(CLE_SIGNALEMENTS);
      if (!liste.some((s) => s.id === SITE_BOUNTOU.id))
        ecrire(CLE_SIGNALEMENTS, [...liste, SITE_BOUNTOU]);
      window.localStorage.setItem(CLE_AMORCE, "1");
    }
    if (DONNEES_DEMO && !window.localStorage.getItem(CLE_DEMO)) {
      // Nouvelle version de la démo : on remplace les sites simulés (et Bountou) d'une version précédente
      const sites = lire<Signalement>(CLE_SIGNALEMENTS).filter(
        (s) => !s.id.startsWith("demo-s") && s.id !== SITE_BOUNTOU.id,
      );
      ecrire(CLE_SIGNALEMENTS, [...sites, SITE_BOUNTOU, ...SIGNALEMENTS_DEMO]);
      const pesees = lire<Pesee>(CLE_PESEES);
      const idsPesees = new Set(pesees.map((p) => p.id));
      ecrire(CLE_PESEES, [...pesees, ...PESEES_DEMO.filter((p) => !idsPesees.has(p.id))]);
      window.localStorage.setItem(CLE_DEMO, "1");
    }
  } catch {
    // Stockage indisponible : l'application reste utilisable sans ces données
  }
}

// ---------- Hooks ----------

export function useSignalements() {
  return useQuery({
    queryKey: ["signalements"],
    queryFn: async () => {
      amorcer();
      return lire<Signalement>(CLE_SIGNALEMENTS).sort((a, b) => b.cree_le.localeCompare(a.cree_le));
    },
  });
}

export function useSignalement(id: string) {
  const { data, ...reste } = useSignalements();
  return { data: data?.find((s) => s.id === id), ...reste };
}

export type NouveauSignalement = Omit<
  Signalement,
  "id" | "cree_le" | "maj_le" | "statut" | "photo_apres"
>;

export function useCreerSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: NouveauSignalement) => {
      const maintenant = new Date().toISOString();
      const complet: Signalement = {
        ...s,
        id: nouvelId(),
        cree_le: maintenant,
        maj_le: maintenant,
        statut: "signale",
        photo_apres: null,
      };
      ecrire(CLE_SIGNALEMENTS, [...lire<Signalement>(CLE_SIGNALEMENTS), complet]);
      return complet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signalements"] }),
  });
}

export function useMajSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...modif
    }: {
      id: string;
      statut?: Statut;
      photo_apres?: string | null;
    }) => {
      const liste = lire<Signalement>(CLE_SIGNALEMENTS).map((s) =>
        s.id === id ? { ...s, ...modif, maj_le: new Date().toISOString() } : s,
      );
      ecrire(CLE_SIGNALEMENTS, liste);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signalements"] }),
  });
}

export function usePesees() {
  return useQuery({
    queryKey: ["pesees"],
    queryFn: async () => {
      amorcer();
      return lire<Pesee>(CLE_PESEES).sort((a, b) => b.date.localeCompare(a.date));
    },
  });
}

export function useAjouterPesee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Pesee, "id">) => {
      ecrire(CLE_PESEES, [...lire<Pesee>(CLE_PESEES), { ...p, id: nouvelId() }]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pesees"] }),
  });
}

export function useSupprimerPesee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      ecrire(
        CLE_PESEES,
        lire<Pesee>(CLE_PESEES).filter((p) => p.id !== id),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pesees"] }),
  });
}

// ---------- Calculs du tableau de bord ----------

export function bilanPesees(pesees: Pesee[]) {
  const parVolet = (Object.keys(VOLETS) as Volet[]).map((v) => {
    const kg = pesees.filter((p) => p.volet === v).reduce((t, p) => t + p.kg_conformes, 0);
    return { volet: v, label: VOLETS[v].label, kg, objectif: VOLETS[v].objectif_kg };
  });
  const conformes = pesees.reduce((t, p) => t + p.kg_conformes, 0);
  const retires = pesees.reduce((t, p) => t + p.kg_retires, 0);
  const total = conformes + retires;
  return {
    parVolet,
    kgConformes: conformes,
    kgRetires: retires,
    tauxConformite: total > 0 ? conformes / total : null,
  };
}

// ---------- Utilitaires ----------

/** Réduit une photo (côté le plus long 1280 px, JPEG) pour l'envoi depuis un téléphone. */
export async function compresserPhoto(fichier: File, max = 1280, qualite = 0.72): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Image illisible"));
      i.src = url;
    });
    const echelle = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * echelle);
    canvas.height = Math.round(img.height * echelle);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", qualite);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const formatKg = (kg: number) =>
  `${kg.toLocaleString("fr-FR", { maximumFractionDigits: kg < 10 ? 1 : 0 })} kg`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
