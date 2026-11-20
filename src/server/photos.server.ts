/** Photos des sites : reçues en JPEG (data URL), enregistrées en fichiers et servies par /photos/<nom>. */
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DOSSIER_PHOTOS } from "./base.server";

const TAILLE_MAX = 3 * 1024 * 1024; // 3 Mo (les photos réduites font ~100 à 400 Ko)
const PREFIXE = "data:image/jpeg;base64,";
const NOM_VALIDE = /^[0-9a-f-]{36}\.jpg$/;

/** Enregistre la photo et renvoie son adresse publique. */
export async function enregistrerPhoto(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith(PREFIXE)) throw new Error("La photo doit être une image JPEG.");
  const octets = Buffer.from(dataUrl.slice(PREFIXE.length), "base64");
  if (octets.length === 0 || octets.length > TAILLE_MAX)
    throw new Error("Photo vide ou trop lourde.");
  // Signature JPEG (FF D8 FF)
  if (octets[0] !== 0xff || octets[1] !== 0xd8 || octets[2] !== 0xff)
    throw new Error("Fichier photo invalide.");
  const nom = `${randomUUID()}.jpg`;
  await writeFile(join(DOSSIER_PHOTOS, nom), octets);
  return `/photos/${nom}`;
}

export async function lirePhoto(nom: string): Promise<Buffer | null> {
  if (!NOM_VALIDE.test(nom)) return null;
  try {
    return await readFile(join(DOSSIER_PHOTOS, nom));
  } catch {
    return null;
  }
}
