import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  MapPinned,
  Plus,
  BarChart3,
  Info,
  LayoutDashboard,
  Lock,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useEquipe } from "@/lib/equipe";

const tabs = [
  { to: "/accueil", label: "Accueil", icon: Home, remplirActif: true },
  { to: "/carte", label: "Carte", icon: MapPinned, aussi: ["/site/"] },
  { to: "/signaler", label: "Signaler", icon: Plus, central: true },
  { to: "/bilan", label: "Suivi", icon: BarChart3, aussi: ["/pesees"] },
  { to: "/infos", label: "Infos", icon: Info, plein: true },
] as const;

/** En-tête du projet (maquettes Accueil et Signalé) : logo Setal Sunu Gox + nom du groupe et du projet.
 * Masqué sur grand écran : le menu latéral porte déjà le logo et le nom. */
export function EnTeteProjet() {
  return (
    <header className="mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-secondary px-3 py-3 lg:hidden">
      <img
        src="/logo-gx.webp"
        alt="Setal Sunu Gox"
        className="h-14 w-14 shrink-0 rounded-full bg-white object-contain p-1 shadow-sm"
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Scouts Groupe VIIIe Dakar
        </p>
        <h1 className="font-display text-[clamp(15px,4.6vw,20px)] font-bold leading-tight whitespace-nowrap text-navy">
          Jeunes Éco-Acteurs de Pikine
        </h1>
      </div>
    </header>
  );
}

/** Bandeau bleu marine à vagues (maquette signalé.png) : icône, titre de la page, sous-titre, action facultative. */
export function Bandeau({
  icone,
  titre,
  sousTitre,
  action,
}: {
  icone: ReactNode;
  titre: string;
  sousTitre?: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative mt-3 bg-navy pt-5 pb-12 text-white lg:mt-0">
      <svg
        viewBox="0 0 400 24"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-6 w-full lg:hidden"
      >
        <path d="M0 0h400v6C300 26 100 26 0 6z" className="fill-[var(--background)]" />
      </svg>
      <div className="relative flex items-center justify-center gap-3 px-4 pt-3">
        <span className="shrink-0 [&_svg]:h-12 [&_svg]:w-12">{icone}</span>
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(19px,6vw,25px)] leading-tight font-bold whitespace-nowrap">
            {titre}
          </h1>
          {sousTitre && <p className="text-[13px] text-white/90">{sousTitre}</p>}
        </div>
      </div>
      {action && <div className="relative mt-3 flex justify-center">{action}</div>}
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-10 w-full"
      >
        <path d="M0 22C120 4 260 4 400 22v18H0z" className="fill-leaf" />
        <path d="M0 30C130 12 270 12 400 30v10H0z" className="fill-[var(--background)]" />
      </svg>
    </section>
  );
}

/** Carte blanche à titre vert et bleu, utilisée sur Signaler et Suivi. */
export function CarteSection({
  icone,
  titre,
  droite,
  children,
}: {
  icone: ReactNode;
  titre: string;
  droite?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_-12px_rgba(7,46,92,0.3)]">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-navy">
          <span className="text-primary [&_svg]:h-5 [&_svg]:w-5">{icone}</span>
          {titre}
        </h2>
        {droite}
      </div>
      {children}
    </section>
  );
}

/** En-tête standard : titre + sous-titre, avec la vague du logo en fond. */
export function EnTete({
  titre,
  sousTitre,
  droite,
}: {
  titre: string;
  sousTitre?: string;
  droite?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden px-5 pt-5 pb-4">
      <img
        src="/entree-pied.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-20 w-56 opacity-15"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-bold leading-tight text-navy">{titre}</h1>
          {sousTitre && <p className="mt-0.5 text-[13px] text-muted-foreground">{sousTitre}</p>}
        </div>
        {droite}
      </div>
    </div>
  );
}

/** Largeur du contenu sur grand écran : « etroite » (une colonne centrée) ou « large » (tableau de bord). */
const LARGEURS = {
  etroite: "lg:max-w-3xl lg:pt-4",
  large: "lg:max-w-[1440px]",
} as const;

export function AppShell({
  header,
  children,
  largeur = "etroite",
}: {
  header?: ReactNode;
  children: ReactNode;
  largeur?: keyof typeof LARGEURS;
}) {
  const { pathname } = useLocation();

  return (
    <PhoneFrame>
      <BarreLaterale pathname={pathname} />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {header && (
          <div className={`relative z-20 shrink-0 lg:mx-auto lg:w-full ${LARGEURS[largeur]}`}>
            {header}
          </div>
        )}

        <main className="bt-page no-scrollbar min-h-0 flex-1 overflow-y-auto pb-36 text-foreground lg:pb-10">
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { scrollbar-width: none; }`}</style>
          <div className={`lg:mx-auto lg:w-full ${LARGEURS[largeur]}`}>{children}</div>
        </main>

        <BarreNavigation pathname={pathname} />
      </div>
    </PhoneFrame>
  );
}

const estActif = (pathname: string, to: string, aussi: readonly string[] = []) =>
  pathname === to || pathname.startsWith(`${to}/`) || aussi.some((a) => pathname.startsWith(a));

const liensLateraux = [
  { to: "/accueil", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/carte", label: "Carte des sites", icon: MapPinned, aussi: ["/site/"] },
  { to: "/bilan", label: "Suivi du projet", icon: BarChart3 },
  { to: "/pesees", label: "Registre des pesées", icon: Scale },
  { to: "/infos", label: "Infos du projet", icon: Info },
] as const;

/** Menu latéral des grands écrans (remplace le menu du bas du téléphone). */
function BarreLaterale({ pathname }: { pathname: string }) {
  const { actif: equipe } = useEquipe();
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-navy text-white lg:flex">
      <Link to="/accueil" className="flex items-center gap-3 px-4 pt-5 pb-5">
        <img
          src="/logo-gx.webp"
          alt="Setal Sunu Gox"
          className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-1"
        />
        <span className="min-w-0">
          <span className="block text-[9.5px] font-bold tracking-wide whitespace-nowrap text-leaf uppercase">
            Scouts Groupe VIIIe Dakar
          </span>
          <span className="block font-display text-[15px] leading-tight font-bold">
            Jeunes Éco-Acteurs de Pikine
          </span>
        </span>
      </Link>

      <nav aria-label="Menu principal" className="flex flex-col gap-1 px-3">
        {liensLateraux.map(({ to, label, icon: Icon, ...t }) => {
          const actif = estActif(pathname, to, "aussi" in t ? t.aussi : []);
          return (
            <Link
              key={to}
              to={to}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-colors ${
                actif
                  ? "bg-leaf/15 text-white shadow-[inset_3px_0_0_var(--leaf)]"
                  : "text-[#CFE0F2] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={actif ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/signaler"
        className="mx-3 mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(7,154,10,0.7)] transition-transform hover:brightness-110 active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" strokeWidth={3} /> Signaler un site sale
      </Link>

      <Link
        to="/infos"
        className="mx-3 mt-auto mb-4 flex items-center gap-2.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-[13px] text-[#CFE0F2] hover:bg-white/5"
      >
        {equipe ? <ShieldCheck className="h-4 w-4 text-leaf" /> : <Lock className="h-4 w-4" />}
        {equipe ? "Mode équipe actif" : "Mode équipe"}
      </Link>
    </aside>
  );
}

/** Menu du bas (maquette Accueil.png) : vague verte et bleue, bouton « Signaler » au centre. */
function BarreNavigation({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Menu principal"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 lg:hidden"
    >
      <img
        src="/vague-menu.webp"
        alt=""
        aria-hidden="true"
        width={1200}
        height={136}
        className="block h-auto w-full"
      />
      <ul
        className="pointer-events-auto grid grid-cols-5 items-end bg-white px-1 pt-1 pb-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {tabs.map(({ to, label, icon: Icon, ...t }) => {
          const actif = estActif(pathname, to, "aussi" in t ? t.aussi : []);
          if ("central" in t) {
            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  className="-mt-14 flex flex-col items-center gap-1"
                  aria-label="Signaler un site sale"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-white shadow-[0_0_0_6px_rgba(95,209,26,0.25),0_8px_20px_-4px_rgba(7,154,10,0.6)] ring-4 ring-white">
                    <Icon className="h-8 w-8" strokeWidth={3} />
                  </span>
                  <span className="text-[13px] font-semibold leading-none text-primary">
                    {label}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={actif ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 ${actif ? "text-primary" : "text-navy"}`}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={actif ? 2.6 : 2}
                  {...("plein" in t
                    ? { fill: "currentColor", stroke: "white" }
                    : actif && "remplirActif" in t
                      ? { fill: "currentColor" }
                      : {})}
                />
                <span
                  className={`text-[12px] leading-none ${actif ? "font-extrabold" : "font-medium"}`}
                >
                  {label}
                </span>
                <span
                  className={`mt-0.5 h-1 w-10 rounded-full ${actif ? "bg-primary" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
