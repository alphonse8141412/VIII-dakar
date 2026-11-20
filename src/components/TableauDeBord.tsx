import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CircleCheck,
  MapPin,
  MapPinned,
  Recycle,
  Scale,
  Star,
  Target,
  Trash2,
  Activity,
} from "lucide-react";
import { CarteSites } from "@/components/CarteSites";
import {
  bilanPesees,
  estCible,
  formatKg,
  OBJECTIF_CONFORMITE,
  OBJECTIF_TOTAL_KG,
  POUBELLES,
  STATUTS,
  usePesees,
  useSignalements,
  type Statut,
} from "@/lib/donnees";

/** Vrai à partir de 1024 px (breakpoint lg) : la carte n'est montée que sur grand écran. */
function useGrandEcran() {
  const [grand, setGrand] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const maj = () => setGrand(mql.matches);
    maj();
    mql.addEventListener("change", maj);
    return () => mql.removeEventListener("change", maj);
  }, []);
  return grand;
}

const LEGENDE: Statut[] = ["cible", "signale", "verifie", "nettoye", "rehabilite"];

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Accueil sur grand écran : chiffres clés, carte, sites, pesées (affiché à partir de lg). */
export function TableauDeBord() {
  const grandEcran = useGrandEcran();
  const navigate = useNavigate();
  const { data: signalements = [] } = useSignalements();
  const { data: pesees = [] } = usePesees();
  const b = bilanPesees(pesees);

  const signales = signalements.filter((s) => !estCible(s));
  const cibles = signalements.length - signales.length;
  const nettoyes = signalements.filter(
    (s) => s.statut === "nettoye" || s.statut === "rehabilite",
  ).length;
  const partObjectif = Math.min(1, b.kgConformes / OBJECTIF_TOTAL_KG);
  const siteUne = signalements.find((s) => s.id === "bountou-pikine") ?? signales[0];
  const derniers = [...signalements].sort((a, z) => z.maj_le.localeCompare(a.maj_le)).slice(0, 6);
  const dernieresPesees = pesees.slice(0, 4);

  return (
    <div className="flex flex-col gap-4 px-7 pt-6">
      {/* Titre */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-navy">Tableau de bord</h1>
          <p className="text-[13px] text-muted-foreground">
            Pikine · résultats mis à jour en continu
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-[13px] font-bold text-primary">
          <Target className="h-4 w-4" /> Objectif : {OBJECTIF_TOTAL_KG} kg de plastique
        </span>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-4">
        <Bloc className="flex items-center gap-3.5">
          <Pastille>
            <Recycle />
          </Pastille>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[26px] leading-tight font-bold text-primary">
              {formatKg(b.kgConformes)}
            </p>
            <p className="text-[12px] text-muted-foreground">
              collectés · {Math.round(partObjectif * 100)} % de l'objectif
            </p>
            <Barre part={partObjectif} />
          </div>
        </Bloc>
        <Chiffre
          icone={<MapPin />}
          teinte="bg-[#FDECEC] text-[#B91C1C]"
          valeur={signales.length}
          label="Sites signalés"
          detail={
            cibles > 0
              ? `+ ${cibles} site${cibles > 1 ? "s" : ""} cible${cibles > 1 ? "s" : ""}`
              : undefined
          }
        />
        <Chiffre icone={<CircleCheck />} valeur={nettoyes} label="Sites nettoyés" />
        <Chiffre
          icone={<Trash2 />}
          teinte="bg-[#E7EEF8] text-navy"
          valeur={POUBELLES.length}
          label="Poubelles prévues"
        />
        <Chiffre
          icone={<CircleCheck />}
          valeur={b.tauxConformite == null ? "—" : `${Math.round(b.tauxConformite * 100)} %`}
          label="Tri conforme"
        />
      </div>

      {/* Carte + sites */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Bloc className="flex flex-col">
          <Titre icone={<MapPinned />} droite={<Legende />}>
            Carte des sites
          </Titre>
          <div className="overflow-hidden rounded-xl">
            {grandEcran ? (
              <CarteSites
                sites={signalements}
                onChoisir={(id) => navigate({ to: "/site/$id", params: { id } })}
                hauteur="h-[min(30rem,52dvh)]"
              />
            ) : (
              <div className="h-[min(30rem,52dvh)] bg-muted" />
            )}
          </div>
        </Bloc>

        <div className="flex min-w-0 flex-col gap-4">
          {siteUne && (
            <Link to="/site/$id" params={{ id: siteUne.id }} className="block">
              <Bloc className="transition-shadow hover:shadow-[0_12px_28px_-12px_rgba(7,46,92,0.45)]">
                <Titre icone={<Star fill="currentColor" />}>Site à la une</Titre>
                <div className="flex gap-3">
                  <img
                    src={siteUne.photo_avant}
                    alt=""
                    className="aspect-[3/2] w-40 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-bold text-navy">
                      {siteUne.quartier}
                    </p>
                    <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-muted-foreground">
                      {siteUne.commentaire}
                    </p>
                    <BadgeStatut statut={siteUne.statut} className="mt-2" />
                  </div>
                </div>
              </Bloc>
            </Link>
          )}

          <Bloc className="flex-1">
            <Titre icone={<Activity />}>Derniers sites mis à jour</Titre>
            {derniers.length === 0 ? (
              <Vide>Aucun site pour le moment.</Vide>
            ) : (
              <ul className="divide-y divide-border">
                {derniers.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/site/$id"
                      params={{ id: s.id }}
                      className="flex items-center gap-3 rounded-lg px-1 py-2 text-[13px] hover:bg-muted"
                    >
                      <span className="min-w-0 flex-1 truncate font-semibold text-navy">
                        {s.quartier}
                      </span>
                      <span className="text-muted-foreground">{dateCourte(s.maj_le)}</span>
                      <BadgeStatut statut={s.statut} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/carte"
              className="mt-2 flex items-center justify-center gap-1 text-[13px] font-bold text-primary"
            >
              Voir tous les sites sur la carte <ArrowRight className="h-4 w-4" />
            </Link>
          </Bloc>
        </div>
      </div>

      {/* Pesées */}
      <div className="grid grid-cols-3 gap-4">
        <Bloc>
          <Titre icone={<Target />}>Kilos par volet</Titre>
          <ul className="flex flex-col gap-2.5">
            {b.parVolet.map((v) => (
              <li key={v.volet} className="text-[13px]">
                <div className="flex justify-between gap-2">
                  <span className="text-navy">{v.label}</span>
                  <span className="text-muted-foreground">
                    <strong className="text-navy">{formatKg(v.kg)}</strong> / {v.objectif}
                  </span>
                </div>
                <Barre part={Math.min(1, v.kg / v.objectif)} />
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc>
          <Titre
            icone={<CircleCheck />}
            droite={
              b.tauxConformite != null && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    b.tauxConformite >= OBJECTIF_CONFORMITE
                      ? "bg-primary text-white"
                      : "bg-[#FACC15] text-navy"
                  }`}
                >
                  {b.tauxConformite >= OBJECTIF_CONFORMITE ? "Objectif atteint" : "À améliorer"}
                </span>
              )
            }
          >
            Qualité du tri
          </Titre>
          <div className="flex items-center gap-4">
            <AnneauTri taux={b.tauxConformite} />
            <div className="flex flex-1 flex-col gap-2 text-[13px] text-navy">
              <p className="flex justify-between rounded-xl bg-secondary px-3 py-2">
                Conformes <strong className="text-primary">{formatKg(b.kgConformes)}</strong>
              </p>
              <p className="flex justify-between rounded-xl bg-[#FEF3C7] px-3 py-2">
                Retirés des sacs <strong className="text-[#B45309]">{formatKg(b.kgRetires)}</strong>
              </p>
            </div>
          </div>
        </Bloc>

        <Bloc>
          <Titre
            icone={<Scale />}
            droite={
              <Link to="/pesees" className="text-[12px] font-bold text-primary">
                Registre →
              </Link>
            }
          >
            Dernières pesées
          </Titre>
          {dernieresPesees.length === 0 ? (
            <Vide>Aucune pesée enregistrée.</Vide>
          ) : (
            <ul className="divide-y divide-border text-[13px]">
              {dernieresPesees.map((p) => (
                <li key={p.id} className="flex gap-3 py-2">
                  <span className="w-14 shrink-0 text-muted-foreground">{dateCourte(p.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-navy">{p.lieu}</span>
                  <strong className="text-primary">{formatKg(p.kg_conformes)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Bloc>
      </div>
    </div>
  );
}

// ---------- Petits composants ----------

function Bloc({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={`rounded-2xl bg-white p-4 shadow-[0_8px_24px_-12px_rgba(7,46,92,0.3)] ${className}`}
    >
      {children}
    </section>
  );
}

function Titre({
  icone,
  droite,
  children,
}: {
  icone: ReactNode;
  droite?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-primary [&_svg]:h-[18px] [&_svg]:w-[18px]">{icone}</span>
      <h2 className="font-display text-[15px] font-bold text-navy">{children}</h2>
      {droite && <div className="ml-auto">{droite}</div>}
    </div>
  );
}

function Pastille({
  teinte = "bg-secondary text-primary",
  children,
}: {
  teinte?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl [&_svg]:h-[22px] [&_svg]:w-[22px] ${teinte}`}
    >
      {children}
    </span>
  );
}

function Chiffre({
  icone,
  teinte,
  valeur,
  label,
  detail,
}: {
  icone: ReactNode;
  teinte?: string;
  valeur: number | string;
  label: string;
  detail?: string;
}) {
  return (
    <Bloc className="flex items-center gap-3">
      <Pastille teinte={teinte}>{icone}</Pastille>
      <div className="min-w-0">
        <p className="font-display text-[26px] leading-tight font-bold text-navy">{valeur}</p>
        <p className="text-[12px] text-muted-foreground">{label}</p>
        {detail && <p className="text-[11px] font-semibold text-[#1D4ED8]">{detail}</p>}
      </div>
    </Bloc>
  );
}

function Barre({ part }: { part: number }) {
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E2E8E0]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-leaf transition-all duration-700"
        style={{ width: `${Math.max(part > 0 ? 3 : 0, part * 100)}%` }}
      />
    </div>
  );
}

function BadgeStatut({ statut, className = "" }: { statut: Statut; className?: string }) {
  const st = STATUTS[statut];
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${className}`}
      style={{ background: `${st.couleur}33`, color: st.fonce }}
    >
      {st.label}
    </span>
  );
}

function Legende() {
  return (
    <ul className="flex gap-3 text-[12px] text-muted-foreground">
      {LEGENDE.map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUTS[k].fonce }} />
          {STATUTS[k].label}
        </li>
      ))}
    </ul>
  );
}

function AnneauTri({ taux }: { taux: number | null }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const ok = taux != null && taux >= OBJECTIF_CONFORMITE;
  return (
    <svg
      viewBox="0 0 36 36"
      className="h-24 w-24 shrink-0"
      role="img"
      aria-label="Taux de tri conforme"
    >
      <circle cx="18" cy="18" r={r} fill="none" stroke="#E2E8E0" strokeWidth="4" />
      {taux != null && (
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={ok ? "#079A0A" : "#D97706"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${c * taux} ${c}`}
          transform="rotate(-90 18 18)"
        />
      )}
      <text
        x="18"
        y="20"
        textAnchor="middle"
        className="font-display"
        fontSize="8"
        fontWeight="700"
        fill={ok ? "#079A0A" : "#0B2545"}
      >
        {taux == null ? "—" : `${Math.round(taux * 100)} %`}
      </text>
    </svg>
  );
}

function Vide({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed py-4 text-center text-[13px] text-muted-foreground">
      {children}
    </p>
  );
}
