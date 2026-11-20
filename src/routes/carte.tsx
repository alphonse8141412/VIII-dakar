import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  CircleCheck,
  HardHat,
  LayoutGrid,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CarteSites, type MaPosition } from "@/components/CarteSites";
import {
  formatDate,
  TYPES_DECHET,
  useSignalements,
  type Signalement,
  type Statut,
} from "@/lib/donnees";

export const Route = createFileRoute("/carte")({
  ssr: false,
  head: () => ({ meta: [{ title: "Carte des sites — Jeunes Éco-Acteurs de Pikine" }] }),
  component: Carte,
});

type Groupe = "tous" | "cibles" | "a_traiter" | "en_cours" | "nettoyes";

/** Filtres de la maquette : les sites cibles, puis les 4 statuts de la demande. */
const GROUPES: Record<Exclude<Groupe, "tous">, { label: string; statuts: Statut[] }> = {
  cibles: { label: "Cibles", statuts: ["cible"] },
  a_traiter: { label: "À traiter", statuts: ["signale"] },
  en_cours: { label: "En cours", statuts: ["verifie"] },
  nettoyes: { label: "Nettoyés", statuts: ["nettoye", "rehabilite"] },
};

const BADGES: Record<Statut, { label: string; classe: string }> = {
  cible: { label: "Site cible", classe: "bg-[#1D4ED8] text-white" },
  signale: { label: "À traiter", classe: "bg-[#DC2626] text-white" },
  verifie: { label: "En cours", classe: "bg-[#FACC15] text-navy" },
  nettoye: { label: "Nettoyé", classe: "bg-primary text-white" },
  rehabilite: { label: "Réhabilité", classe: "bg-[#6D28D9] text-white" },
};

function Carte() {
  const { data: tous = [] } = useSignalements();
  const [groupe, setGroupe] = useState<Groupe>("tous");
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState<string | null>(null);
  const [maPosition, setMaPosition] = useState<MaPosition | null>(null);
  const [localisation, setLocalisation] = useState(false);

  const sites = useMemo(() => {
    const q = normaliser(recherche);
    return tous.filter(
      (s) =>
        (groupe === "tous" || GROUPES[groupe].statuts.includes(s.statut)) &&
        (!q || normaliser(s.quartier).includes(q)),
    );
  }, [tous, groupe, recherche]);

  const aTraiter = tous.filter((s) => s.statut === "signale").length;
  const site = sites.find((s) => s.id === choisi) ?? sites[0];

  const meLocaliser = () => {
    if (!("geolocation" in navigator))
      return toast.error("La localisation n'est pas disponible sur cet appareil");
    setLocalisation(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMaPosition({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          precision: Math.round(p.coords.accuracy),
        });
        setLocalisation(false);
      },
      () => {
        toast.error("Position introuvable : activez la localisation du téléphone");
        setLocalisation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <AppShell largeur="large">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-5 lg:px-6 lg:pt-6">
        {/* Recherche + alertes */}
        <div className="flex items-center gap-3 px-4 pt-4 lg:col-start-2 lg:px-0 lg:pt-0">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-white px-4 shadow-[0_4px_16px_-6px_rgba(7,46,92,0.25)]">
            <Search className="h-5 w-5 shrink-0 text-navy" strokeWidth={2.6} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un quartier"
              aria-label="Rechercher un quartier"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-navy outline-none placeholder:text-muted-foreground"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setGroupe("a_traiter")}
            aria-label={`${aTraiter} site${aTraiter > 1 ? "s" : ""} à traiter`}
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-navy shadow-[0_4px_16px_-6px_rgba(7,46,92,0.25)]"
          >
            <Bell className="h-6 w-6" strokeWidth={2.2} />
            {aTraiter > 0 && (
              <span className="absolute top-2 right-2.5 h-3 w-3 rounded-full bg-[#EF4444] ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Filtres */}
        <div className="mt-4 grid grid-cols-5 gap-1.5 px-4 lg:col-start-2 lg:px-0">
          <Filtre
            actif={groupe === "tous"}
            onClick={() => setGroupe("tous")}
            label="Tous"
            n={tous.length}
            icone={<LayoutGrid className="h-6 w-6" />}
          />
          <Filtre
            actif={groupe === "cibles"}
            onClick={() => setGroupe("cibles")}
            label="Cibles"
            n={compter(tous, "cibles")}
            icone={<Target className="h-6 w-6 text-[#2563EB]" strokeWidth={2.4} />}
          />
          <Filtre
            actif={groupe === "a_traiter"}
            onClick={() => setGroupe("a_traiter")}
            label="À traiter"
            n={compter(tous, "a_traiter")}
            icone={
              <TriangleAlert
                className="h-6 w-6 text-[#E11D2E]"
                fill="currentColor"
                stroke="white"
              />
            }
          />
          <Filtre
            actif={groupe === "en_cours"}
            onClick={() => setGroupe("en_cours")}
            label="En cours"
            n={compter(tous, "en_cours")}
            icone={<HardHat className="h-6 w-6 text-[#EAB308]" strokeWidth={2.4} />}
          />
          <Filtre
            actif={groupe === "nettoyes"}
            onClick={() => setGroupe("nettoyes")}
            label="Nettoyés"
            n={compter(tous, "nettoyes")}
            icone={
              <CircleCheck className="h-6 w-6 text-primary" fill="currentColor" stroke="white" />
            }
          />
        </div>

        {/* Carte */}
        <div className="relative mx-3 mt-4 overflow-hidden rounded-2xl shadow-[0_6px_20px_-10px_rgba(7,46,92,0.35)] lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:m-0">
          <CarteSites
            sites={sites}
            choisi={site?.id}
            onChoisir={setChoisi}
            maPosition={maPosition}
            hauteur="h-[max(18rem,48dvh)] lg:h-[calc(100dvh-5.5rem)]"
            zoom={false}
          />
          <button
            type="button"
            onClick={meLocaliser}
            aria-label="Me localiser"
            className="absolute top-3 right-3 z-[500] grid h-14 w-14 place-items-center rounded-full bg-white text-navy shadow-lg"
          >
            {localisation ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <LocateFixed className="h-7 w-7" strokeWidth={2.4} />
            )}
          </button>
        </div>

        {/* Site choisi (et, sur grand écran, la liste des sites du filtre) */}
        <div className="px-4 pt-4 lg:col-start-2 lg:min-h-0 lg:px-0">
          {site ? (
            <FicheCourte s={site} />
          ) : (
            <div className="rounded-3xl border border-dashed bg-white p-5 text-center">
              <p className="text-sm text-muted-foreground">
                {tous.length === 0
                  ? "Aucun site signalé pour le moment."
                  : "Aucun site ne correspond à ce filtre."}
              </p>
              <Link to="/signaler" className="mt-2 inline-block text-sm font-bold text-primary">
                Signaler un site sale →
              </Link>
            </div>
          )}

          {/* Grand écran : les autres sites du filtre, à choisir dans la liste */}
          {sites.length > 1 && (
            <ul className="mt-3 hidden flex-col gap-1 lg:flex">
              {sites
                .filter((x) => x.id !== site?.id)
                .map((x) => (
                  <li key={x.id}>
                    <button
                      type="button"
                      onClick={() => setChoisi(x.id)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 text-left text-[13px] hover:bg-white"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-navy" />
                      <span className="min-w-0 flex-1 truncate font-semibold text-navy">
                        {x.quartier}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${BADGES[x.statut].classe}`}
                      >
                        {BADGES[x.statut].label}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FicheCourte({ s }: { s: Signalement }) {
  const badge = BADGES[s.statut];
  return (
    <Link
      to="/site/$id"
      params={{ id: s.id }}
      className="bt-fade-up flex items-center gap-3 rounded-3xl bg-white p-2.5 shadow-[0_8px_24px_-12px_rgba(7,46,92,0.3)] transition-transform active:scale-[0.98]"
    >
      <img
        src={s.photo_apres ?? s.photo_avant}
        alt=""
        className="aspect-[4/3] w-[38%] shrink-0 rounded-2xl object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-display text-[16px] leading-tight font-bold text-navy">
          <MapPin className="h-4 w-4 shrink-0" fill="currentColor" stroke="white" />
          <span className="truncate">{s.quartier}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-navy">
          {s.commentaire || `${TYPES_DECHET[s.type_dechet]} · ${formatDate(s.cree_le)}`}
        </span>
        <span
          className={`mt-2 inline-block rounded-full px-3.5 py-1 text-[13px] font-bold ${badge.classe}`}
        >
          {badge.label}
        </span>
      </span>
      <ChevronRight className="h-6 w-6 shrink-0 text-navy" strokeWidth={2.6} />
    </Link>
  );
}

function Filtre({
  actif,
  onClick,
  label,
  n,
  icone,
}: {
  actif: boolean;
  onClick: () => void;
  label: string;
  n: number;
  icone: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`flex flex-col items-center gap-1 rounded-2xl px-0.5 py-2.5 text-[12px] font-semibold transition-colors ${
        actif
          ? "bg-primary text-white shadow-[0_8px_18px_-8px_rgba(7,154,10,0.7)]"
          : "bg-white text-navy shadow-[0_4px_14px_-6px_rgba(7,46,92,0.25)]"
      }`}
    >
      {actif ? (
        <span className="text-white [&_svg]:!text-white [&_svg]:!fill-none [&_svg]:!stroke-white">
          {icone}
        </span>
      ) : (
        icone
      )}
      <span className="leading-none whitespace-nowrap">{label}</span>
      <span
        className={`text-[11px] leading-none ${actif ? "text-white/80" : "text-muted-foreground"}`}
      >
        {n}
      </span>
    </button>
  );
}

const compter = (liste: Signalement[], g: Exclude<Groupe, "tous">) =>
  liste.filter((s) => GROUPES[g].statuts.includes(s.statut)).length;

const normaliser = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
