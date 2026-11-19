import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Brush,
  ChevronRight,
  CircleCheck,
  HardHat,
  MapPin,
  MapPinned,
  Recycle,
  Scale,
  School,
  Sparkles,
  Target,
  Trees,
  TriangleAlert,
} from "lucide-react";
import { AppShell, Bandeau, CarteSection, EnTeteProjet } from "@/components/AppShell";
import {
  bilanPesees,
  formatKg,
  OBJECTIF_CONFORMITE,
  OBJECTIF_TOTAL_KG,
  ORDRE_STATUTS,
  SEUIL_MINIMUM_KG,
  STATUTS,
  usePesees,
  useSignalements,
  type Statut,
  type Volet,
} from "@/lib/donnees";

export const Route = createFileRoute("/bilan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Suivi — Jeunes Éco-Acteurs de Pikine" }] }),
  component: Bilan,
});

const ICONES_VOLETS: Record<Volet, React.ReactNode> = {
  ecoles: <School className="h-5 w-5" />,
  espaces_publics: <Trees className="h-5 w-5" />,
  nettoyage: <Brush className="h-5 w-5" />,
};

/** Mêmes icônes que les filtres de la carte. */
const ICONES_STATUTS: Record<Statut, React.ReactNode> = {
  signale: <TriangleAlert className="h-5 w-5" fill="currentColor" stroke="white" />,
  verifie: <HardHat className="h-5 w-5" strokeWidth={2.4} />,
  nettoye: <CircleCheck className="h-5 w-5" fill="currentColor" stroke="white" />,
  rehabilite: <Sparkles className="h-5 w-5" fill="currentColor" />,
};

function Bilan() {
  const { data: pesees = [] } = usePesees();
  const { data: signalements = [] } = useSignalements();
  const b = bilanPesees(pesees);

  const parQuartier = Object.entries(
    signalements.reduce<Record<string, number>>(
      (acc, s) => ((acc[s.quartier] = (acc[s.quartier] ?? 0) + 1), acc),
      {},
    ),
  )
    .map(([quartier, n]) => ({ quartier, n }))
    .sort((a, z) => z.n - a.n);
  const maxQuartier = Math.max(1, ...parQuartier.map((q) => q.n));

  return (
    <AppShell>
      <EnTeteProjet />

      <Bandeau
        icone={<BarChart3 strokeWidth={2.6} />}
        titre="Suivi du projet"
        sousTitre="Résultats mis à jour en continu"
        action={
          <Link
            to="/pesees"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-primary shadow-md transition-transform active:scale-[0.97]"
          >
            <Scale className="h-4 w-4" /> Registre des pesées
            <ChevronRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        }
      />

      <div className="relative -mt-3 flex flex-col gap-3 px-3">
        {/* Total */}
        <CarteSection
          icone={<Recycle />}
          titre="Plastique collecté"
          droite={
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12px] whitespace-nowrap text-primary">
              <Target className="h-4 w-4" /> Objectif : <strong>{OBJECTIF_TOTAL_KG} kg</strong>
            </span>
          }
        >
          <div className="flex items-end justify-between gap-2">
            <p className="font-display text-[34px] leading-none font-bold text-primary">
              {formatKg(b.kgConformes)}
            </p>
            <p className="pb-1 text-[12px] text-navy">
              <strong>{Math.round(Math.min(1, b.kgConformes / OBJECTIF_TOTAL_KG) * 100)} %</strong>{" "}
              de l'objectif
            </p>
          </div>
          <JaugeObjectif valeur={b.kgConformes} />
        </CarteSection>

        {/* Par volet */}
        <CarteSection icone={<Target />} titre="Kilos par volet">
          <ul className="flex flex-col gap-3">
            {b.parVolet.map((v) => {
              const p = Math.min(1, v.kg / v.objectif);
              return (
                <li key={v.volet} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                    {ICONES_VOLETS[v.volet]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="font-semibold text-navy">{v.label}</span>
                      <span className="text-[12px] whitespace-nowrap text-muted-foreground">
                        <strong className="text-navy">{formatKg(v.kg)}</strong> / {v.objectif} kg
                      </span>
                    </div>
                    <Barre part={p} />
                  </div>
                </li>
              );
            })}
          </ul>
        </CarteSection>

        {/* Conformité */}
        <CarteSection
          icone={<CircleCheck fill="currentColor" stroke="white" />}
          titre="Qualité du tri"
          droite={<BadgeConformite taux={b.tauxConformite} />}
        >
          <div className="flex items-center gap-4">
            <Anneau taux={b.tauxConformite} />
            <div className="flex flex-1 flex-col gap-1.5 text-[12px] text-navy">
              <p className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                Conformes <strong className="text-primary">{formatKg(b.kgConformes)}</strong>
              </p>
              <p className="flex items-center justify-between rounded-xl bg-[#FEF3C7] px-3 py-2">
                Retirés des sacs <strong className="text-[#B45309]">{formatKg(b.kgRetires)}</strong>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Objectif : au moins {OBJECTIF_CONFORMITE * 100} % de déchets conformes.
              </p>
            </div>
          </div>
        </CarteSection>

        {/* Signalements par statut */}
        <CarteSection
          icone={<MapPin fill="currentColor" stroke="white" />}
          titre="Signalements"
          droite={
            <Link
              to="/carte"
              className="flex items-center gap-0.5 text-[12px] font-bold text-primary"
            >
              {signalements.length} sur la carte{" "}
              <ChevronRight className="h-4 w-4" strokeWidth={3} />
            </Link>
          }
        >
          <div className="grid grid-cols-4 gap-2">
            {ORDRE_STATUTS.map((st) => (
              <div
                key={st}
                className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-center"
                style={{ background: `${STATUTS[st].couleur}26`, color: STATUTS[st].fonce }}
              >
                {ICONES_STATUTS[st]}
                <p className="font-display text-[22px] leading-none font-bold">
                  {signalements.filter((s) => s.statut === st).length}
                </p>
                <p className="text-[11px] leading-tight font-semibold text-navy">
                  {STATUTS[st].label}
                </p>
              </div>
            ))}
          </div>
        </CarteSection>

        {/* Par quartier */}
        <CarteSection icone={<MapPinned />} titre="Signalements par quartier">
          {parQuartier.length === 0 ? (
            <p className="rounded-2xl border border-dashed py-4 text-center text-sm text-muted-foreground">
              Pas encore de données.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {parQuartier.map((q, i) => (
                <li
                  key={q.quartier}
                  className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2.5"
                >
                  <span className="truncate text-[13px] font-semibold text-navy">{q.quartier}</span>
                  <Barre part={q.n / maxQuartier} fort={i === 0} />
                  <span className="w-5 text-right font-display text-[14px] font-bold text-navy">
                    {q.n}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CarteSection>
      </div>
    </AppShell>
  );
}

function Barre({ part, fort = true }: { part: number; fort?: boolean }) {
  return (
    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#E2E8E0]">
      <div
        className={`h-full rounded-full transition-all duration-700 ${fort ? "bg-gradient-to-r from-primary to-leaf" : "bg-leaf/70"}`}
        style={{ width: `${Math.max(part > 0 ? 4 : 0, part * 100)}%` }}
      />
    </div>
  );
}

function JaugeObjectif({ valeur }: { valeur: number }) {
  const p = Math.min(1, valeur / OBJECTIF_TOTAL_KG);
  const seuil = SEUIL_MINIMUM_KG / OBJECTIF_TOTAL_KG;
  return (
    <div className="mt-3">
      <div className="relative h-3.5 rounded-full bg-[#E2E8E0]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-leaf transition-all duration-700"
          style={{ width: `${p * 100}%` }}
        />
        <span
          className="absolute -top-1 h-[22px] w-1 -translate-x-1/2 rounded-full bg-navy"
          style={{ left: `${seuil * 100}%` }}
        />
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-navy">
        <span className="absolute left-0">0 kg</span>
        <span
          className="absolute -translate-x-1/2 font-semibold"
          style={{ left: `${seuil * 100}%` }}
        >
          Seuil {SEUIL_MINIMUM_KG} kg
        </span>
        <span className="absolute right-0">{OBJECTIF_TOTAL_KG} kg</span>
      </div>
    </div>
  );
}

function BadgeConformite({ taux }: { taux: number | null }) {
  if (taux == null) return null;
  const ok = taux >= OBJECTIF_CONFORMITE;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${ok ? "bg-primary text-white" : "bg-[#FACC15] text-navy"}`}
    >
      {ok ? "Objectif atteint" : "À améliorer"}
    </span>
  );
}

function Anneau({ taux }: { taux: number | null }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const ok = taux != null && taux >= OBJECTIF_CONFORMITE;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E2E8E0" strokeWidth="9" />
        {taux != null && (
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={ok ? "#079A0A" : "#D97706"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${c * taux} ${c}`}
            className="transition-[stroke-dasharray] duration-1000"
          />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display text-[20px] leading-none font-bold ${ok ? "text-primary" : "text-navy"}`}
        >
          {taux == null ? "—" : `${Math.round(taux * 100)} %`}
        </span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">conformes</span>
      </span>
    </div>
  );
}
