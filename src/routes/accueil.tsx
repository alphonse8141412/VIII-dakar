import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  MapPin,
  Megaphone,
  Recycle,
  Star,
  Target,
  Trash2,
} from "lucide-react";
import { AppShell, EnTeteProjet } from "@/components/AppShell";
import { TableauDeBord } from "@/components/TableauDeBord";
import {
  bilanPesees,
  OBJECTIF_TOTAL_KG,
  POUBELLES,
  useSignalements,
  usePesees,
  estCible,
} from "@/lib/donnees";

export const Route = createFileRoute("/accueil")({
  head: () => ({
    meta: [{ title: "Accueil — Jeunes Éco-Acteurs de Pikine" }],
    links: [{ rel: "preload", href: "/accueil-scouts.webp", as: "image" }],
  }),
  component: Accueil,
});

/** Premier site repéré dans la demande (section 3.3). */
const SITE_A_LA_UNE = {
  quartier: "Bountou Pikine",
  precision: "près de l'école Notre-Dame du Cap-Vert",
};

function Accueil() {
  const { data: signalements = [] } = useSignalements();
  const { data: pesees = [] } = usePesees();
  const { kgConformes } = bilanPesees(pesees);
  const nettoyes = signalements.filter(
    (s) => s.statut === "nettoye" || s.statut === "rehabilite",
  ).length;
  const siteUne = signalements.find((s) => s.quartier === SITE_A_LA_UNE.quartier);

  return (
    <AppShell largeur="large">
      {/* Grand écran : tableau de bord */}
      <div className="hidden lg:block">
        <TableauDeBord />
      </div>

      {/* Téléphone et tablette */}
      <div className="lg:hidden">
        <EnTeteProjet />

        {/* Bannière */}
        <section className="bt-fade-up relative mt-3 overflow-hidden">
          <img
            src="/accueil-scouts.webp"
            alt="Des scouts ramassent des déchets plastiques dans un espace vert"
            width={1000}
            height={412}
            className="block aspect-[1000/412] w-full object-cover"
          />
          <p className="absolute top-[33%] left-0 w-[44%] rounded-r-[2rem] bg-navy py-2.5 pr-3 pl-3 font-display text-[15px] leading-tight font-bold text-white italic shadow-lg">
            Jeunes Éco-Acteurs de Pikine — <span className="text-[#FFD60A]">En cours</span>
            <span aria-hidden="true" className="mt-1.5 block h-[3px] w-4/5 rounded-full bg-leaf" />
          </p>
        </section>

        {/* Signaler */}
        <Link
          to="/signaler"
          className="mx-4 mt-4 flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-white shadow-[0_10px_24px_-10px_rgba(7,154,10,0.7)] transition-transform active:scale-[0.98]"
        >
          <Megaphone className="h-7 w-7 shrink-0" fill="currentColor" />
          <span className="flex-1 text-center font-display text-[19px] font-bold">
            Signaler un site sale
          </span>
          <ChevronRight className="h-6 w-6 shrink-0" strokeWidth={3} />
        </Link>

        {/* Indicateurs */}
        <section className="mx-4 mt-4 rounded-3xl bg-white p-4 shadow-[0_8px_24px_-12px_rgba(7,46,92,0.25)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1 font-display text-[15px] font-bold whitespace-nowrap text-navy">
              <MapPin className="h-5 w-5" fill="currentColor" stroke="white" /> Plastique collecté
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5 text-[12px] whitespace-nowrap text-primary">
              <Target className="h-4 w-4" /> Objectif : <strong>{OBJECTIF_TOTAL_KG} kg</strong>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-[1.25fr_1fr_1fr_1fr] items-start">
            <Anneau kg={kgConformes} />
            <Chiffre
              icone={
                <MapPin className="h-7 w-7 text-[#1D6FD1]" fill="currentColor" stroke="white" />
              }
              valeur={signalements.filter((x) => !estCible(x)).length}
              label="Sites signalés"
              couleur="text-navy"
            />
            <Chiffre
              icone={
                <CircleCheck className="h-7 w-7 text-primary" fill="currentColor" stroke="white" />
              }
              valeur={nettoyes}
              label="Sites nettoyés"
              couleur="text-primary"
            />
            <Chiffre
              icone={<Trash2 className="h-7 w-7 text-primary" strokeWidth={2.4} />}
              valeur={POUBELLES.length}
              label="Poubelles prévues"
              couleur="text-primary"
            />
          </div>
        </section>

        {/* Site à la une */}
        <Link
          to={siteUne ? "/site/$id" : "/carte"}
          params={siteUne ? { id: siteUne.id } : undefined}
          className="mx-4 mt-4 block rounded-3xl bg-white p-2 pt-0 shadow-[0_8px_24px_-12px_rgba(7,46,92,0.25)]"
        >
          <div className="flex">
            <span className="-ml-2 flex items-center gap-1.5 rounded-t-2xl rounded-br-2xl bg-navy px-3 py-2 text-[14px] font-bold text-white">
              <Star className="h-4 w-4" fill="currentColor" /> Site à la une
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <img
              src="/site-une-bountou.webp"
              alt="Mur couvert de graffitis le long d'une rue de Bountou Pikine"
              width={1200}
              height={436}
              loading="lazy"
              className="aspect-[3/2] w-[44%] shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-start gap-1 font-display text-[14px] leading-snug font-bold text-navy">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" stroke="white" />
                {SITE_A_LA_UNE.quartier},
              </p>
              <p className="pl-5 text-[13px] leading-snug text-navy">{SITE_A_LA_UNE.precision}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <ArrowRight className="h-5 w-5" strokeWidth={3} />
            </span>
          </div>
          <span aria-hidden="true" className="mt-2 ml-[46%] block h-1 rounded-full bg-primary" />
        </Link>
      </div>
    </AppShell>
  );
}

/** Anneau de progression vers l'objectif total (OBJECTIF_TOTAL_KG), avec le logo recyclage au centre. */
function Anneau({ kg }: { kg: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, kg / OBJECTIF_TOTAL_KG);
  const kgAffiche = kg.toLocaleString("fr-FR", { maximumFractionDigits: kg < 10 ? 1 : 0 });
  return (
    <div className="flex flex-col items-center border-r border-navy/30 pr-2 text-center">
      <div
        className="relative h-[72px] w-[72px]"
        role="img"
        aria-label={`${Math.round(p * 100)} % de l'objectif atteint`}
      >
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#E2E8E0" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="#079A0A"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            className="transition-[stroke-dashoffset] duration-1000"
          />
        </svg>
        <Recycle className="absolute inset-0 m-auto h-7 w-7 text-primary" strokeWidth={2.6} />
      </div>
      <p className="mt-1 font-display text-[22px] leading-none font-bold text-primary">
        {kgAffiche} kg
      </p>
      <p className="mt-0.5 text-[12px] text-primary">Collectés</p>
    </div>
  );
}

function Chiffre({
  icone,
  valeur,
  label,
  couleur,
}: {
  icone: React.ReactNode;
  valeur: number;
  label: string;
  couleur: string;
}) {
  return (
    <div className="flex flex-col items-center border-r border-navy/30 px-1 text-center last:border-r-0">
      {icone}
      <p className={`mt-1 font-display text-[24px] leading-none font-bold ${couleur}`}>{valeur}</p>
      <p className={`mt-1 text-[12px] leading-tight ${couleur}`}>{label}</p>
    </div>
  );
}
