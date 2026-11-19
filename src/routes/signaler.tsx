import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  ImageIcon,
  ListChecks,
  Loader2,
  LocateFixed,
  MapPin,
  Megaphone,
  PlusCircle,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Bandeau, CarteSection, EnTeteProjet } from "@/components/AppShell";
import { PriseDePhoto } from "@/components/PriseDePhoto";
import {
  GRAVITES,
  QUARTIERS,
  TYPES_DECHET,
  useCreerSignalement,
  type Gravite,
  type TypeDechet,
} from "@/lib/donnees";

export const Route = createFileRoute("/signaler")({
  head: () => ({ meta: [{ title: "Signaler un site — Jeunes Éco-Acteurs de Pikine" }] }),
  component: Signaler,
});

type Position = { lat: number; lon: number; precision: number };

function Signaler() {
  const navigate = useNavigate();
  const creer = useCreerSignalement();

  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOuverte, setCameraOuverte] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [gps, setGps] = useState<"attente" | "recherche" | "ok" | "erreur">("attente");
  const [typeDechet, setTypeDechet] = useState<TypeDechet>("plastique");
  const [gravite, setGravite] = useState<Gravite>(2);
  const [quartier, setQuartier] = useState(QUARTIERS[0]);
  const [commentaire, setCommentaire] = useState("");

  const localiser = () => {
    if (!("geolocation" in navigator)) {
      setGps("erreur");
      return;
    }
    setGps("recherche");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          precision: Math.round(p.coords.accuracy),
        });
        setGps("ok");
      },
      () => setGps("erreur"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const recevoirPhoto = (dataUrl: string) => {
    setPhoto(dataUrl);
    // La position est ajoutée automatiquement au moment de la photo
    if (gps === "attente" || gps === "erreur") localiser();
  };

  const envoyer = async () => {
    if (!photo) return toast.error("Ajoutez une photo du site");
    if (!position)
      return toast.error("La position est nécessaire pour placer le site sur la carte");
    try {
      const s = await creer.mutateAsync({
        lat: position.lat,
        lon: position.lon,
        quartier,
        type_dechet: typeDechet,
        gravite,
        commentaire: commentaire.trim(),
        photo_avant: photo,
      });
      toast.success("Merci ! Votre signalement a été envoyé.");
      navigate({ to: "/site/$id", params: { id: s.id } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell>
      <EnTeteProjet />

      <Bandeau
        icone={<Megaphone className="-rotate-12" fill="currentColor" strokeWidth={1.6} />}
        titre="Signaler un site sale"
        sousTitre="Aidez-nous à garder Pikine propre"
      />

      <div className="relative -mt-3 flex flex-col gap-3 px-3">
        {/* Photo */}
        <CarteSection icone={<ImageIcon className="h-5 w-5" />} titre="Photo du site">
          <div className="grid grid-cols-[1.35fr_1fr] gap-2">
            <button
              type="button"
              onClick={() => setCameraOuverte(true)}
              className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-navy/30 bg-[#F4F7FB] text-center text-navy"
            >
              <span className="relative">
                <Camera className="h-9 w-9" fill="currentColor" stroke="white" strokeWidth={1.5} />
                <PlusCircle
                  className="absolute -right-1.5 -bottom-1 h-4 w-4 rounded-full bg-white text-primary"
                  fill="currentColor"
                  stroke="white"
                />
              </span>
              <span className="text-[13px] leading-tight font-semibold">
                {photo ? "Changer la photo" : "Ajouter une photo"}
              </span>
              <span className="text-[11px] leading-tight text-navy/70">(ouvre la caméra)</span>
            </button>
            <figure className="relative overflow-hidden rounded-2xl">
              <img
                src={photo ?? "/exemple-site-sale.svg"}
                alt={
                  photo ? "Photo du site signalé" : "Exemple : sacs d'ordures au pied d'un arbre"
                }
                className="aspect-[4/3] h-full w-full object-cover"
              />
              {!photo && (
                <figcaption className="absolute bottom-1 left-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Exemple
                </figcaption>
              )}
            </figure>
          </div>
          <PriseDePhoto
            ouvert={cameraOuverte}
            onFermer={() => setCameraOuverte(false)}
            onPhoto={recevoirPhoto}
          />
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-navy" /> Ne photographiez pas de visages.
          </p>
        </CarteSection>

        {/* Position */}
        <CarteSection
          icone={<MapPin className="h-5 w-5" fill="currentColor" stroke="white" />}
          titre="Position du site"
        >
          <button
            type="button"
            onClick={localiser}
            className="flex w-full items-center gap-2.5 rounded-xl bg-[#EEF2F8] py-2 pr-2 pl-3 text-left text-navy"
          >
            <MapPin className="h-4 w-4 shrink-0" fill="currentColor" stroke="white" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">
                {gps === "ok" && position
                  ? `${position.lat.toFixed(5)}, ${position.lon.toFixed(5)}`
                  : gps === "recherche"
                    ? "Recherche de la position…"
                    : gps === "erreur"
                      ? "Position introuvable — réessayer"
                      : "Utiliser ma position"}
              </span>
              {gps === "ok" && position && (
                <span className="block text-[11px] text-navy/70">
                  Précision ± {position.precision} m
                </span>
              )}
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow-sm">
              {gps === "recherche" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LocateFixed className="h-5 w-5" strokeWidth={2.4} />
              )}
            </span>
          </button>
          <select
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
            aria-label="Quartier"
            className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-navy outline-none focus:border-primary"
          >
            {QUARTIERS.map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </CarteSection>

        {/* Détails utilisés par la carte et le tableau de bord */}
        <CarteSection icone={<Trash2 className="h-5 w-5" />} titre="Type de déchets et gravité">
          <Choix
            options={Object.entries(TYPES_DECHET) as [TypeDechet, string][]}
            valeur={typeDechet}
            onChange={setTypeDechet}
          />
          <div className="mt-2">
            <Choix
              options={(Object.entries(GRAVITES) as [string, string][]).map(([k, v]) => [
                Number(k) as Gravite,
                v,
              ])}
              valeur={gravite}
              onChange={setGravite}
              colonnes={3}
            />
          </div>
        </CarteSection>

        {/* Description */}
        <CarteSection icone={<ListChecks className="h-5 w-5" />} titre="Description">
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            maxLength={MAX_DESCRIPTION}
            rows={3}
            aria-label="Description"
            placeholder="Ex. : Accumulation de déchets plastiques près du marché…"
            className="w-full resize-none rounded-xl border border-navy/20 bg-white px-3 py-2.5 text-[13px] text-navy outline-none placeholder:text-navy/50 focus:border-primary"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {commentaire.length} / {MAX_DESCRIPTION}
          </p>
        </CarteSection>

        <button
          type="button"
          onClick={envoyer}
          disabled={creer.isPending}
          className="mt-1 flex items-center justify-center gap-3 rounded-full bg-primary py-4 font-display text-[17px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(7,154,10,0.7)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {creer.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Send className="h-6 w-6" fill="currentColor" />
          )}
          Envoyer le signalement
        </button>
      </div>
    </AppShell>
  );
}

const MAX_DESCRIPTION = 200;

function Choix<T extends string | number>({
  options,
  valeur,
  onChange,
  colonnes = 2,
}: {
  options: [T, string][];
  valeur: T;
  onChange: (v: T) => void;
  colonnes?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` }}
    >
      {options.map(([k, label]) => {
        const actif = k === valeur;
        return (
          <button
            key={String(k)}
            type="button"
            onClick={() => onChange(k)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              actif ? "border-primary bg-secondary text-primary" : "bg-white text-navy"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
