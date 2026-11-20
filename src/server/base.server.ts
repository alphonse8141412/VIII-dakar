/**
 * Base de données : Turso (libSQL, compatible SQLite) en production sur Vercel,
 * simple fichier SQLite local en développement (ou sur un VPS).
 *
 * Variables d'environnement :
 *   TURSO_DATABASE_URL  adresse de la base Turso (libsql://…) — obligatoire sur Vercel
 *   TURSO_AUTH_TOKEN    jeton d'accès à la base Turso
 *   DOSSIER_DONNEES     sans Turso : dossier de la base et des photos (défaut : ./donnees-serveur)
 *   DONNEES_DEMO=1      ajoute les données de démonstration à la création de la base
 */
import { createClient, type Client, type InStatement } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { PESEES_DEMO, SIGNALEMENTS_DEMO, SITE_BOUNTOU } from "./amorce.server";
import type { Pesee, Signalement } from "@/lib/types";

/** Sur Vercel, le disque est temporaire : la base doit être sur Turso. */
const SUR_VERCEL = Boolean(process.env.VERCEL);

export const DOSSIER = resolve(process.env.DOSSIER_DONNEES ?? "donnees-serveur");
export const DOSSIER_PHOTOS = join(DOSSIER, "photos");

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS signalements (
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
  )`,
  `CREATE TABLE IF NOT EXISTS pesees (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    volet TEXT NOT NULL,
    lieu TEXT NOT NULL,
    kg_conformes REAL NOT NULL,
    kg_retires REAL NOT NULL,
    saisi_par TEXT NOT NULL,
    cree_le TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  "CREATE TABLE IF NOT EXISTS reglages (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL)",
];

function connexion(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  if (SUR_VERCEL) throw new Error("TURSO_DATABASE_URL doit être défini sur Vercel.");
  mkdirSync(DOSSIER_PHOTOS, { recursive: true });
  return createClient({ url: pathToFileURL(join(DOSSIER, "eco-pikine.sqlite")).href });
}

let pret: Promise<Client> | undefined;

/** Connexion prête à l'emploi (tables créées et données d'amorçage ajoutées, une fois par démarrage). */
export function db(): Promise<Client> {
  pret ??= preparer().catch((e) => {
    pret = undefined; // nouvel essai à la prochaine requête
    throw e;
  });
  return pret;
}

async function preparer(): Promise<Client> {
  const c = connexion();
  await c.batch(SCHEMA, "write");
  await amorcer(c);
  // Bases déjà créées : vraie photo de Bountou et coordonnées exactes des sites
  await c.batch(
    [
      {
        sql: "UPDATE signalements SET photo_avant = ? WHERE id = ? AND photo_avant = '/bountou-avant.svg'",
        args: [SITE_BOUNTOU.photo_avant, SITE_BOUNTOU.id],
      },
      ...[SITE_BOUNTOU, ...SIGNALEMENTS_DEMO].map((s) => ({
        sql: "UPDATE signalements SET lat = ?, lon = ? WHERE id = ?",
        args: [s.lat, s.lon, s.id],
      })),
    ],
    "write",
  );
  return c;
}

/** Ajoute une seule fois le site de Bountou (et la démo si DONNEES_DEMO=1), en une transaction. */
async function amorcer(c: Client) {
  const deja = await c.execute("SELECT 1 FROM reglages WHERE cle = 'amorce'");
  if (deja.rows.length) return;
  const demo = process.env.DONNEES_DEMO === "1";
  await c.batch(
    [
      ...[SITE_BOUNTOU, ...(demo ? SIGNALEMENTS_DEMO : [])].map(insertionSignalement),
      ...(demo ? PESEES_DEMO.map(insertionPesee) : []),
      {
        sql: "INSERT OR IGNORE INTO reglages (cle, valeur) VALUES ('amorce', ?)",
        args: [new Date().toISOString()],
      },
    ],
    "write",
  );
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

export async function listerSignalements(): Promise<Signalement[]> {
  const r = await (await db()).execute("SELECT * FROM signalements ORDER BY cree_le DESC");
  return (r.rows as unknown as Ligne[]).map(versSignalement);
}

export async function lireSignalement(id: string): Promise<Signalement | undefined> {
  const r = await (
    await db()
  ).execute({
    sql: "SELECT * FROM signalements WHERE id = ?",
    args: [id],
  });
  const l = r.rows[0] as unknown as Ligne | undefined;
  return l && versSignalement(l);
}

const insertionSignalement = (s: Signalement): InStatement => ({
  sql: `INSERT OR IGNORE INTO signalements
        (id, cree_le, maj_le, lat, lon, quartier, type_dechet, gravite, commentaire, photo_avant, photo_apres, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
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
  ],
});

export async function insererSignalement(s: Signalement) {
  await (await db()).execute(insertionSignalement(s));
}

export async function modifierSignalement(
  id: string,
  modif: { statut?: Signalement["statut"]; photo_apres?: string | null },
): Promise<Signalement> {
  const actuel = await lireSignalement(id);
  if (!actuel) throw new Error("Site introuvable");
  await (
    await db()
  ).execute({
    sql: "UPDATE signalements SET statut = ?, photo_apres = ?, maj_le = ? WHERE id = ?",
    args: [
      modif.statut ?? actuel.statut,
      modif.photo_apres !== undefined ? modif.photo_apres : actuel.photo_apres,
      new Date().toISOString(),
      id,
    ],
  });
  return (await lireSignalement(id))!;
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

export async function listerPesees(): Promise<Pesee[]> {
  const r = await (await db()).execute("SELECT * FROM pesees ORDER BY date DESC, cree_le DESC");
  return (r.rows as unknown as Ligne[]).map(versPesee);
}

const insertionPesee = (p: Pesee): InStatement => ({
  sql: `INSERT OR IGNORE INTO pesees (id, date, volet, lieu, kg_conformes, kg_retires, saisi_par)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
  args: [p.id, p.date, p.volet, p.lieu, p.kg_conformes, p.kg_retires, p.saisi_par],
});

export async function insererPesee(p: Pesee) {
  await (await db()).execute(insertionPesee(p));
}

export async function supprimerPesee(id: string) {
  await (await db()).execute({ sql: "DELETE FROM pesees WHERE id = ?", args: [id] });
}
