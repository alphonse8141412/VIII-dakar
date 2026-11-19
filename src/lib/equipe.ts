import { useEffect, useState } from "react";

/**
 * Mode équipe (scouts) : débloque la vérification des signalements, la photo « après »
 * et la saisie des pesées.
 *
 * Étape 2 : simple code partagé, gardé sur le téléphone. Ce n'est PAS une protection réelle :
 * à l'étape 4 il sera remplacé par une connexion des membres de l'équipe côté serveur.
 */
const CLE = "eco-pikine:equipe";
const CODE = (import.meta.env.VITE_CODE_EQUIPE as string | undefined) ?? "scout8";
const EVENEMENT = "eco-pikine:equipe";

function lireActif() {
  try {
    return window.localStorage.getItem(CLE) === "1";
  } catch {
    return false;
  }
}

export function useEquipe() {
  const [actif, setActif] = useState(false);

  useEffect(() => {
    setActif(lireActif());
    const maj = () => setActif(lireActif());
    window.addEventListener(EVENEMENT, maj);
    return () => window.removeEventListener(EVENEMENT, maj);
  }, []);

  const changer = (v: boolean) => {
    try {
      if (v) window.localStorage.setItem(CLE, "1");
      else window.localStorage.removeItem(CLE);
    } catch {
      /* stockage indisponible : le mode reste actif pour cette page seulement */
    }
    setActif(v);
    window.dispatchEvent(new Event(EVENEMENT));
  };

  return {
    actif,
    activer: (code: string) => {
      const ok = code.trim().toLowerCase() === CODE.toLowerCase();
      if (ok) changer(true);
      return ok;
    },
    desactiver: () => changer(false),
  };
}
