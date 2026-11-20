/**
 * Couche de données de la plateforme Jeunes Éco-Acteurs de Pikine.
 *
 * Les données sont enregistrées sur le serveur (SQLite + photos sur le VPS) et partagées
 * entre tous les téléphones. Les pages n'utilisent que les hooks exportés ici.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ajouterPeseeFn,
  creerSignalementFn,
  listerPeseesFn,
  listerSignalementsFn,
  majSignalementFn,
  supprimerPeseeFn,
} from "@/lib/api";
import { VOLETS, type Pesee, type Signalement, type Statut, type Volet } from "@/lib/types";

export * from "@/lib/types";

/** Rafraîchit les listes toutes les 30 s et au retour sur l'onglet : on voit les signalements des autres. */
const RAFRAICHIR_MS = 30_000;

// ---------- Hooks ----------

export function useSignalements() {
  return useQuery({
    queryKey: ["signalements"],
    queryFn: () => listerSignalementsFn(),
    refetchInterval: RAFRAICHIR_MS,
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
    mutationFn: (s: NouveauSignalement) =>
      creerSignalementFn({ data: s }).catch(
        messageLisible("Le signalement n'a pas pu être envoyé"),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signalements"] }),
  });
}

export function useMajSignalement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modif: {
      id: string;
      statut?: Statut;
      photo_avant?: string;
      photo_apres?: string;
    }) => majSignalementFn({ data: modif }).catch(messageLisible("La modification a échoué")),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signalements"] }),
  });
}

export function usePesees() {
  return useQuery({
    queryKey: ["pesees"],
    queryFn: () => listerPeseesFn(),
    refetchInterval: RAFRAICHIR_MS,
  });
}

export function useAjouterPesee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Omit<Pesee, "id">) =>
      ajouterPeseeFn({ data: p }).catch(messageLisible("La pesée n'a pas pu être enregistrée")),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pesees"] }),
  });
}

export function useSupprimerPesee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      supprimerPeseeFn({ data: { id } }).catch(messageLisible("La suppression a échoué")),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pesees"] }),
  });
}

/** Transforme une erreur serveur (zod, réseau…) en message affichable dans un toast. */
function messageLisible(defaut: string) {
  return (e: unknown): never => {
    const brut = e instanceof Error ? e.message : "";
    let message = defaut;
    if (/fetch|network/i.test(brut)) message = "Pas de connexion : réessayez dans un instant.";
    else if (brut && !brut.trim().startsWith("[")) message = brut; // les erreurs zod sont du JSON
    throw new Error(message);
  };
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
