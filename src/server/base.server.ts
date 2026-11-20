/**
 * Base de données du serveur (VPS) : SQLite intégré à Node (node:sqlite, Node ≥ 22.5)
 * et photos enregistrées en fichiers JPEG dans DOSSIER_DONNEES/photos.
 *
 * Variables d'environnement :
 *   DOSSIER_DONNEES  dossier de la base et des photos (défaut : ./donnees-serveur)
 *   DONNEES_DEMO=1   ajoute les données de démonstration à la création de la base
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { PESEES_DEMO, SIGNALEMENTS_DEMO, SITE_BOUNTOU } from "./amorce.server";
import type { Pesee, Signalement } from "@/lib/types";

export const DOSSIER = resolve(process.env.DOSSIER_DONNEES ?? "donnees-serveur");
export const DOSSIER_PHOTOS = join(DOSSIER, "photos");

let base: DatabaseSync | undefined;

export function db(): DatabaseSync {
  if (base) return base;
  mkdirSync(DOSSIER_PHOTOS, { recursive: true });
  base = new DatabaseSync(join(DOSSIER, "eco-pikine.sqlite"));
  base.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS signalements (
      id TEXT PRIMARY KEY,
      cree_le TEXT NOT NULL,
      maj_le TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      quartier TEXT NOT NULL,
      type_dechet TEXT NOT NULL,
      gravite INTEGER NOT NULL,
      commentaire TEXT NOT NULL DEFAULT '',
      photo_avant TEXT NOT NULL,
      photo_apres TEXT,
      statut TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pesees (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      volet TEXT NOT NULL,
      lieu TEXT NOT NULL,
      kg_conformes REAL NOT NULL,
      kg_retires REAL NOT NULL,
      saisi_par TEXT NOT NULL,
      cree_le TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS reglages (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL);
  `);
  amorcer(base);
  // Bases déjà créées : remplace l'ancienne illustration de Bountou par la vraie photo du terrain
  base
    .prepare(
      "UPDATE signalements SET photo_avant = ? WHERE id = ? AND photo_avant = '/bountou-avant.svg'",
    )
    .run(SITE_BOUNTOU.photo_avant, SITE_BOUNTOU.id);
  // Bases déjà créées : applique les coordonnées exactes de Bountou et des sites de démonstration
  const majPosition = base.prepare("UPDATE signalements SET lat = ?, lon = ? WHERE id = ?");
  for (const s of [SITE_BOUNTOU, ...SIGNALEMENTS_DEMO]) majPosition.run(s.lat, s.lon, s.id);
  return base;
}

/** Ajoute une seule fois le site de Bountou (et la démo si DONNEES_DEMO=1). */
function amorcer(b: DatabaseSync) {
  if (b.prepare("SELECT 1 FROM reglages WHERE cle = 'amorce'").get()) return;
  const demo = process.env.DONNEES_DEMO === "1";
  b.exec("BEGIN");
  try {
    for (const s of [SITE_BOUNTOU, ...(demo ? SIGNALEMENTS_DEMO : [])]) insererSignalement(s);
    if (demo) for (const p of PESEES_DEMO) insererPesee(p);
    b.prepare("INSERT INTO reglages (cle, valeur) VALUES ('amorce', ?)").run(
      new Date().toISOString(),
    );
    b.exec("COMMIT");
  } catch (e) {
    b.exec("ROLLBACK");
    throw e;
  }
}

// ---------- Signalements ----------

type Ligne = Record<string, unknown>;

const versSignalement = (l: Ligne): Signalement => ({
  id: String(l.id),
  cree_le: String(l.cree_le),
  maj_le: String(l.maj_le),
  lat: Number(l.lat),
  lon: Number(l.lon),
  quartier: String(l.quartier),
  type_dechet: l.type_dechet as Signalement["type_dechet"],
  gravite: Number(l.gravite) as Signalement["gravite"],
  commentaire: String(l.commentaire ?? ""),
  photo_avant: String(l.photo_avant),
  photo_apres: l.photo_apres == null ? null : String(l.photo_apres),
  statut: l.statut as Signalement["statut"],
});

export function listerSignalements(): Signalement[] {
  return (db().prepare("SELECT * FROM signalements ORDER BY cree_le DESC").all() as Ligne[]).map(
    versSignalement,
  );
}

export function lireSignalement(id: string): Signalement | undefined {
  const l = db().prepare("SELECT * FROM signalements WHERE id = ?").get(id) as Ligne | undefined;
  return l && versSignalement(l);
}

export function insererSignalement(s: Signalement) {
  db()
    .prepare(
      `INSERT OR IGNORE INTO signalements
       (id, cree_le, maj_le, lat, lon, quartier, type_dechet, gravite, commentaire, photo_avant, photo_apres, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      s.id,
      s.cree_le,
      s.maj_le,
      s.lat,
      s.lon,
      s.quartier,
      s.type_dechet,
      s.gravite,
      s.commentaire,
      s.photo_avant,
      s.photo_apres,
      s.statut,
    );
}

export function modifierSignalement(
  id: string,
  modif: { statut?: Signalement["statut"]; photo_apres?: string | null },
) {
  const actuel = lireSignalement(id);
  if (!actuel) throw new Error("Site introuvable");
  db()
    .prepare("UPDATE signalements SET statut = ?, photo_apres = ?, maj_le = ? WHERE id = ?")
    .run(
      modif.statut ?? actuel.statut,
      modif.photo_apres !== undefined ? modif.photo_apres : actuel.photo_apres,
      new Date().toISOString(),
      id,
    );
  return lireSignalement(id)!;
}

// ---------- Pesées ----------

const versPesee = (l: Ligne): Pesee => ({
  id: String(l.id),
  date: String(l.date),
  volet: l.volet as Pesee["volet"],
  lieu: String(l.lieu),
  kg_conformes: Number(l.kg_conformes),
  kg_retires: Number(l.kg_retires),
  saisi_par: String(l.saisi_par),
});

export function listerPesees(): Pesee[] {
  return (
    db().prepare("SELECT * FROM pesees ORDER BY date DESC, cree_le DESC").all() as Ligne[]
  ).map(versPesee);
}

export function insererPesee(p: Pesee) {
  db()
    .prepare(
      `INSERT OR IGNORE INTO pesees (id, date, volet, lieu, kg_conformes, kg_retires, saisi_par)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(p.id, p.date, p.volet, p.lieu, p.kg_conformes, p.kg_retires, p.saisi_par);
}

export function supprimerPesee(id: string) {
  db().prepare("DELETE FROM pesees WHERE id = ?").run(id);
}
