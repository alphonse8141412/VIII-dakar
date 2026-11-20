/**
 * Fonctions serveur (createServerFn) : appelées comme des fonctions depuis les pages,
 * elles s'exécutent sur le serveur (fonctions Vercel en production). Toute donnée reçue est validée ici avec zod.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  insererPesee,
  insererSignalement,
  listerPesees,
  listerSignalements,
  modifierSignalement,
  supprimerPesee,
} from "@/server/base.server";
import { connecter, deconnecter, estEquipe, exigerEquipe } from "@/server/equipe.server";
import { enregistrerPhoto } from "@/server/photos.server";
import { QUARTIERS, type Signalement } from "@/lib/types";

/** Valide avec zod et renvoie une erreur lisible (le premier problème trouvé). */
const valider =
  <T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>) =>
  (d: unknown): T => {
    const r = schema.safeParse(d);
    if (!r.success) throw new Error(r.error.issues[0]?.message ?? "Données invalides");
    return r.data;
  };

const statut = z.enum(["signale", "verifie", "nettoye", "rehabilite"]);
const photo = z.string().startsWith("data:image/jpeg;base64,");

// ---------- Signalements ----------

export const listerSignalementsFn = createServerFn({ method: "GET" }).handler(() =>
  listerSignalements(),
);

const schemaSignalement = z.object({
  // Zone large autour de Pikine : évite les positions aberrantes
  lat: z.number().min(14.5).max(15),
  lon: z.number().min(-17.7).max(-17.1),
  quartier: z.enum(QUARTIERS as [string, ...string[]]),
  type_dechet: z.enum(["plastique", "menagers", "gravats", "mixte"]),
  gravite: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  commentaire: z.string().trim().max(200),
  photo_avant: photo,
});

export const creerSignalementFn = createServerFn({ method: "POST" })
  .validator(valider(schemaSignalement))
  .handler(async ({ data }) => {
    const maintenant = new Date().toISOString();
    const s: Signalement = {
      ...data,
      id: crypto.randomUUID(),
      cree_le: maintenant,
      maj_le: maintenant,
      photo_avant: await enregistrerPhoto(data.photo_avant),
      photo_apres: null,
      statut: "signale",
    };
    await insererSignalement(s);
    return s;
  });

const schemaMaj = z
  .object({
    id: z.string().min(1).max(64),
    statut: statut.optional(),
    photo_apres: photo.optional(),
  })
  .refine((d) => d.statut || d.photo_apres, "Rien à modifier");

export const majSignalementFn = createServerFn({ method: "POST" })
  .validator(valider(schemaMaj))
  .handler(async ({ data }) => {
    exigerEquipe();
    const photo_apres = data.photo_apres ? await enregistrerPhoto(data.photo_apres) : undefined;
    return modifierSignalement(data.id, { statut: data.statut, photo_apres });
  });

// ---------- Pesées ----------

export const listerPeseesFn = createServerFn({ method: "GET" }).handler(() => listerPesees());

const kg = z.number().min(0).max(50);
const schemaPesee = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    volet: z.enum(["ecoles", "espaces_publics", "nettoyage"]),
    lieu: z.string().trim().min(1).max(100),
    kg_conformes: kg,
    kg_retires: kg,
    saisi_par: z.string().trim().max(60),
  })
  .refine((p) => p.kg_conformes + p.kg_retires <= 50, "Plus de 50 kg : pesez en plusieurs fois.");

export const ajouterPeseeFn = createServerFn({ method: "POST" })
  .validator(valider(schemaPesee))
  .handler(async ({ data }) => {
    exigerEquipe();
    await insererPesee({
      ...data,
      id: crypto.randomUUID(),
      saisi_par: data.saisi_par || "Équipe terrain",
    });
  });

export const supprimerPeseeFn = createServerFn({ method: "POST" })
  .validator(valider(z.object({ id: z.string().min(1).max(64) })))
  .handler(async ({ data }) => {
    exigerEquipe();
    await supprimerPesee(data.id);
  });

// ---------- Équipe ----------

export const statutEquipeFn = createServerFn({ method: "GET" }).handler(() => ({
  actif: estEquipe(),
}));

export const connexionEquipeFn = createServerFn({ method: "POST" })
  .validator(valider(z.object({ code: z.string().max(100) })))
  .handler(async ({ data }) => {
    // Petit délai contre les essais de code à la chaîne
    await new Promise((r) => setTimeout(r, 400));
    return { ok: connecter(data.code) };
  });

export const deconnexionEquipeFn = createServerFn({ method: "POST" }).handler(() => {
  deconnecter();
});
