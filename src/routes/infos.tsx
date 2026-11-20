import { createFileRoute } from "@tanstack/react-router";
import {
  Brush,
  CalendarDays,
  CircleCheck,
  HardHat,
  Info,
  Leaf,
  MapPin,
  Recycle,
  School,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { AppShell, Bandeau, CarteSection, EnTeteProjet } from "@/components/AppShell";
import { ModeEquipe } from "@/components/ModeEquipe";
import {
  ECOLES,
  OBJECTIF_TOTAL_KG,
  ORDRE_STATUTS,
  POUBELLES,
  STATUTS,
  type Statut,
} from "@/lib/donnees";

export const Route = createFileRoute("/infos")({
  head: () => ({ meta: [{ title: "Infos — Jeunes Éco-Acteurs de Pikine" }] }),
  component: Infos,
});

const VOLETS = [
  {
    icone: Brush,
    titre: "Nettoyer et réhabiliter",
    texte: "Journées de nettoyage, pavés en plastique recyclé et fresques en français et en wolof.",
  },
  {
    icone: Recycle,
    titre: "Collecter et valoriser",
    texte: `Bacs dans ${ECOLES.length} écoles et ${POUBELLES.length} poubelles à plastique, relevés, triés et pesés par les scouts.`,
  },
  {
    icone: MapPin,
    titre: "Signaler et suivre",
    texte:
      "Chaque site signalé est vérifié sur place puis passe au statut « nettoyé » avec photo avant/après.",
  },
];

/** Mêmes icônes que la carte et le suivi. */
const ICONES_STATUTS: Record<Statut, React.ReactNode> = {
  cible: <Target className="h-4 w-4" strokeWidth={2.4} />,
  signale: <TriangleAlert className="h-4 w-4" fill="currentColor" stroke="white" />,
  verifie: <HardHat className="h-4 w-4" strokeWidth={2.4} />,
  nettoye: <CircleCheck className="h-4 w-4" fill="currentColor" stroke="white" />,
  rehabilite: <Sparkles className="h-4 w-4" fill="currentColor" />,
};

const ETAPES_STATUTS: Record<Statut, string> = {
  cible: "Site repéré par le projet, à vérifier sur le terrain.",
  signale: "Un habitant envoie photo et position.",
  verifie: "L'équipe scout confirme sur place.",
  nettoye: "Le site est nettoyé, photo « après » ajoutée.",
  rehabilite: "Pavés, fresque ou poubelle installés.",
};

/** Page Infos : le projet, les règles et l'espace équipe. */
function Infos() {
  return (
    <AppShell>
      <EnTeteProjet />

      <Bandeau
        icone={<Info strokeWidth={2.4} />}
        titre="Le projet"
        sousTitre="Pikine propre en 8 semaines"
      />

      <div className="relative -mt-3 flex flex-col gap-3 px-3">
        {/* Chiffres clés */}
        <CarteSection icone={<Target />} titre="Nos objectifs">
          <div className="grid grid-cols-4 gap-2">
            <Chiffre
              icone={<Recycle className="h-5 w-5" />}
              valeur={`${OBJECTIF_TOTAL_KG}`}
              unite="kg"
              label="de plastique"
            />
            <Chiffre
              icone={<School className="h-5 w-5" />}
              valeur={`${ECOLES.length}`}
              label="écoles"
            />
            <Chiffre
              icone={<Trash2 className="h-5 w-5" />}
              valeur={`${POUBELLES.length}`}
              label="poubelles"
            />
            <Chiffre icone={<CalendarDays className="h-5 w-5" />} valeur="8" label="semaines" />
          </div>
        </CarteSection>

        {/* Volets */}
        <CarteSection icone={<Leaf />} titre="Nos trois volets">
          <ul className="flex flex-col gap-2.5">
            {VOLETS.map(({ icone: Icone, titre, texte }, i) => (
              <li key={titre} className="flex gap-3 rounded-2xl bg-[#F4F7FB] p-3">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Icone className="h-5 w-5" />
                  <span className="absolute -top-1.5 -left-1.5 grid h-5 w-5 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <span>
                  <span className="block font-display text-[14px] font-bold text-navy">
                    {titre}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-navy/75">
                    {texte}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </CarteSection>

        {/* Parcours d'un signalement */}
        <CarteSection
          icone={<MapPin fill="currentColor" stroke="white" />}
          titre="Le parcours d'un site"
        >
          <ol className="relative flex flex-col gap-3 pl-1">
            <span
              aria-hidden="true"
              className="absolute top-3 bottom-3 left-[17px] w-0.5 rounded-full bg-[#E2E8E0]"
            />
            {(["cible", ...ORDRE_STATUTS] as Statut[]).map((st) => (
              <li key={st} className="relative flex items-center gap-3">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-white"
                  style={{ background: `${STATUTS[st].couleur}33`, color: STATUTS[st].fonce }}
                >
                  {ICONES_STATUTS[st]}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[13px] font-bold"
                    style={{ color: STATUTS[st].fonce }}
                  >
                    {STATUTS[st].label}
                  </span>
                  <span className="block text-[12px] text-navy/75">{ETAPES_STATUTS[st]}</span>
                </span>
              </li>
            ))}
          </ol>
        </CarteSection>

        {/* Règles */}
        <section className="flex gap-3 rounded-2xl border border-[#FACC15]/60 bg-[#FEF9E7] p-3.5">
          <ShieldAlert className="h-6 w-6 shrink-0 text-[#B45309]" />
          <p className="text-[12px] leading-relaxed text-navy">
            Aucun nom n'est demandé. Merci de <strong>ne pas photographier de visages</strong>.
          </p>
        </section>

        {/* Espace équipe */}
        <ModeEquipe />

        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Leaf className="h-3.5 w-3.5 text-primary" /> Ville de Pikine · Fonds Jeunesse et Action
          pour le Climat
        </p>
      </div>
    </AppShell>
  );
}

function Chiffre({
  icone,
  valeur,
  unite,
  label,
}: {
  icone: React.ReactNode;
  valeur: string;
  unite?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary px-1 py-2.5 text-center">
      <span className="text-primary">{icone}</span>
      <p className="font-display text-[20px] leading-none font-bold text-navy">
        {valeur}
        {unite && <span className="ml-0.5 text-[12px]">{unite}</span>}
      </p>
      <p className="text-[11px] leading-tight text-navy/75">{label}</p>
    </div>
  );
}
