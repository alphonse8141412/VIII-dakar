import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, Check, Loader2, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CarteSites } from "@/components/CarteSites";
import { useEquipe } from "@/lib/equipe";
import {
  compresserPhoto,
  formatDate,
  GALERIES_AVANT,
  GRAVITES,
  ORDRE_STATUTS,
  STATUTS,
  TYPES_DECHET,
  useMajSignalement,
  useSignalement,
  type Statut,
} from "@/lib/donnees";

export const Route = createFileRoute("/site/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Site signalé — Jeunes Éco-Acteurs de Pikine" }] }),
  component: FicheSite,
});

function FicheSite() {
  const { id } = Route.useParams();
  const { data: s, isLoading } = useSignalement(id);
  const { actif: equipe } = useEquipe();
  const maj = useMajSignalement();
  const [photoChoisie, setPhotoChoisie] = useState(0);

  if (isLoading)
    return (
      <AppShell>
        <p className="p-6 text-center text-sm text-muted-foreground">Chargement…</p>
      </AppShell>
    );
  if (!s)
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Ce site est introuvable.</p>
          <Link to="/carte" className="mt-2 inline-block text-sm font-bold text-primary">
            Retour à la carte
          </Link>
        </div>
      </AppShell>
    );

  const photosAvant = GALERIES_AVANT[s.id] ?? [s.photo_avant];
  const photoAvant = photosAvant[photoChoisie] ?? photosAvant[0];
  const st = STATUTS[s.statut];
  const etape = ORDRE_STATUTS.indexOf(s.statut);

  const changerStatut = async (statut: Statut) => {
    if ((statut === "nettoye" || statut === "rehabilite") && !s.photo_apres) {
      toast.error("Ajoutez d'abord la photo « après »");
      return;
    }
    try {
      await maj.mutateAsync({ id: s.id, statut });
      toast.success(`Statut : ${STATUTS[statut].label}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const ajouterPhotoApres = async (f: File | undefined) => {
    if (!f) return;
    try {
      await maj.mutateAsync({ id: s.id, photo_apres: await compresserPhoto(f) });
      toast.success("Photo « après » ajoutée");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell
      header={
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <Link
            to="/carte"
            className="grid h-10 w-10 place-items-center rounded-full border bg-white"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 text-navy" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[18px] font-bold text-navy">{s.quartier}</h1>
            <p className="text-[12px] text-muted-foreground">Signalé le {formatDate(s.cree_le)}</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${st.couleur}33`, color: st.fonce }}
          >
            {st.label}
          </span>
        </div>
      }
    >
      {/* Avant / après */}
      <div className="grid grid-cols-2 gap-2 px-4">
        <Photo
          src={photoAvant}
          legende={
            photosAvant.length > 1 ? `Avant ${photoChoisie + 1}/${photosAvant.length}` : "Avant"
          }
        />
        {s.photo_apres ? (
          <Photo src={s.photo_apres} legende="Après" />
        ) : (
          <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed bg-muted text-center text-[12px] text-muted-foreground">
            <Camera className="mb-1 h-6 w-6" />
            Photo « après »<br />à venir
          </div>
        )}
      </div>

      {photosAvant.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2 px-4">
          {photosAvant.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setPhotoChoisie(i)}
              aria-label={`Voir la photo avant ${i + 1}`}
              aria-pressed={i === photoChoisie}
              className={`overflow-hidden rounded-xl border-2 ${i === photoChoisie ? "border-primary" : "border-transparent opacity-70"}`}
            >
              <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Suivi */}
      <section className="mx-4 mt-4 rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-[14px] font-bold text-navy">Suivi</h2>
        <ol className="flex items-start justify-between">
          {ORDRE_STATUTS.map((k, i) => {
            const fait = i <= etape;
            return (
              <li key={k} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full text-white"
                  style={{ background: fait ? STATUTS[k].fonce : "#D5DED2" }}
                >
                  {fait ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`text-[11px] ${fait ? "font-bold text-navy" : "text-muted-foreground"}`}
                >
                  {STATUTS[k].label}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Détails */}
      <section className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <Info label="Déchets" valeur={TYPES_DECHET[s.type_dechet]} />
        <Info label="Gravité" valeur={GRAVITES[s.gravite]} />
      </section>
      {s.commentaire && (
        <p className="mx-4 mt-3 rounded-2xl bg-muted p-3.5 text-sm text-navy">
          « {s.commentaire} »
        </p>
      )}

      <div className="mx-4 mt-3 overflow-hidden rounded-2xl border">
        <CarteSites sites={[s]} hauteur="h-44" />
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`}
        target="_blank"
        rel="noreferrer"
        className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-2xl border bg-white py-3 text-sm font-semibold text-navy"
      >
        <Navigation className="h-4 w-4" /> Itinéraire vers le site
      </a>

      {/* Actions de l'équipe */}
      {equipe ? (
        <section className="mx-4 mt-5 rounded-2xl border-2 border-primary/30 bg-secondary p-4">
          <h2 className="text-[14px] font-bold text-navy">Actions de l'équipe</h2>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-navy">
            {maj.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {s.photo_apres ? "Remplacer la photo « après »" : "Ajouter la photo « après »"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => ajouterPhotoApres(e.target.files?.[0])}
            />
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["verifie", "nettoye", "rehabilite"] as Statut[]).map((k) => (
              <button
                key={k}
                type="button"
                disabled={maj.isPending || s.statut === k}
                onClick={() => changerStatut(k)}
                className="rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-40"
                style={{ background: STATUTS[k].fonce }}
              >
                {STATUTS[k].label}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="mx-4 mt-5 flex items-center gap-2 text-[12px] text-muted-foreground">
          <MapPin className="h-4 w-4" /> Les scouts vérifient chaque site sur place avant le
          nettoyage.
        </p>
      )}
    </AppShell>
  );
}

function Photo({ src, legende }: { src: string; legende: string }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl">
      <img
        src={src}
        alt={`Photo ${legende.toLowerCase()}`}
        className="aspect-square w-full object-cover"
      />
      <figcaption className="absolute top-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-bold text-white">
        {legende}
      </figcaption>
    </figure>
  );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-navy">{valeur}</p>
    </div>
  );
}
