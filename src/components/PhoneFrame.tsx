import type { ReactNode } from "react";

/**
 * Cadre imitant un écran de téléphone : 440px max de large, hauteur exacte
 * de l'écran (h-screen, responsive — pas une taille fixe en pixels),
 * arrondi sur tablette, plein écran sur mobile.
 * Grand écran (lg, 1024 px et plus) : plus de cadre, toute la largeur, menu latéral à gauche.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh justify-center bg-shell">
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-app-gradient text-foreground shadow-frame sm:rounded-[2.5rem] sm:border sm:border-border lg:max-w-none lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none">
        {children}
      </div>
    </div>
  );
}
