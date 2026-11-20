/**
 * Mode équipe vérifié par le serveur : le code n'est jamais envoyé au navigateur.
 * Après un code correct, le serveur pose un cookie HttpOnly signé (HMAC), valable 30 jours.
 *
 * Variables d'environnement :
 *   CODE_EQUIPE     code partagé par l'équipe terrain (obligatoire en production)
 *   SECRET_SESSION  clé de signature des cookies (obligatoire en production, 32 caractères ou plus)
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestUrl,
  setCookie,
} from "@tanstack/react-start/server";

const COOKIE = "eco_equipe";
const DUREE_S = 30 * 24 * 3600;
const PROD = process.env.NODE_ENV === "production";

function config() {
  const code = process.env.CODE_EQUIPE ?? (PROD ? undefined : "scout8");
  const secret = process.env.SECRET_SESSION ?? (PROD ? undefined : "secret-de-developpement-local");
  if (!code || !secret)
    throw new Error("CODE_EQUIPE et SECRET_SESSION doivent être définis sur le serveur.");
  return { code, secret };
}

const signer = (valeur: string) =>
  createHmac("sha256", config().secret).update(valeur).digest("base64url");

function egal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Cookie « Secure » seulement en https (direct ou derrière Caddy/Nginx). */
function enHttps() {
  return getRequestHeader("x-forwarded-proto") === "https" || getRequestUrl().protocol === "https:";
}

export function estEquipe(): boolean {
  const jeton = getCookie(COOKIE);
  if (!jeton) return false;
  const [expire, signature] = jeton.split(".");
  if (!expire || !signature || Number(expire) < Date.now() / 1000) return false;
  return egal(signature, signer(expire));
}

export function exigerEquipe() {
  if (!estEquipe()) throw new Error("Action réservée à l'équipe : entrez le code équipe.");
}

export function connecter(code: string): boolean {
  const ok = egal(code.trim().toLowerCase(), config().code.toLowerCase());
  if (!ok) return false;
  const expire = String(Math.floor(Date.now() / 1000) + DUREE_S);
  setCookie(COOKIE, `${expire}.${signer(expire)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: enHttps(),
    path: "/",
    maxAge: DUREE_S,
  });
  return true;
}

export function deconnecter() {
  deleteCookie(COOKIE, { path: "/" });
}
