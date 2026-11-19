import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CameraOff, ImageUp, Loader2, RefreshCw, SwitchCamera, X } from "lucide-react";
import { compresserPhoto } from "@/lib/donnees";

type Etat = "demarrage" | "pret" | "erreur";

/**
 * Appareil photo intégré : ouvre directement la caméra du téléphone (caméra arrière)
 * ou la webcam de l'ordinateur. Si la caméra est refusée ou absente, propose d'importer une photo.
 * Renvoie une image JPEG réduite (côté le plus long 1280 px), comme compresserPhoto.
 */
export function PriseDePhoto({
  ouvert,
  onFermer,
  onPhoto,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onPhoto: (dataUrl: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const importer = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState<Etat>("demarrage");
  const [erreur, setErreur] = useState("");
  const [face, setFace] = useState<"environment" | "user">("environment");
  const [plusieursCameras, setPlusieursCameras] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);

  const arreter = useCallback(() => {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
  }, []);

  useEffect(() => {
    if (!ouvert || apercu) return;
    let annule = false;
    setEtat("demarrage");

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErreur(
          window.isSecureContext
            ? "Cet appareil ne permet pas d'utiliser la caméra depuis le navigateur."
            : "La caméra n'est disponible que sur une adresse sécurisée (https).",
        );
        setEtat("erreur");
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: face }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (annule) return s.getTracks().forEach((t) => t.stop());
        arreter();
        flux.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {});
        }
        const appareils = await navigator.mediaDevices.enumerateDevices();
        if (!annule) {
          setPlusieursCameras(appareils.filter((a) => a.kind === "videoinput").length > 1);
          setEtat("pret");
        }
      } catch (e) {
        if (annule) return;
        const nom = (e as DOMException).name;
        setErreur(
          nom === "NotAllowedError"
            ? "L'accès à la caméra a été refusé. Autorisez-le dans le navigateur ou importez une photo."
            : nom === "NotFoundError" || nom === "OverconstrainedError"
              ? "Aucune caméra trouvée sur cet appareil."
              : "Impossible d'ouvrir la caméra.",
        );
        setEtat("erreur");
      }
    })();

    return () => {
      annule = true;
    };
  }, [ouvert, face, apercu, arreter]);

  // Coupe la caméra à la fermeture
  useEffect(() => {
    if (!ouvert) {
      arreter();
      setApercu(null);
    }
    return arreter;
  }, [ouvert, arreter]);

  const declencher = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const echelle = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * echelle);
    canvas.height = Math.round(v.videoHeight * echelle);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    setApercu(canvas.toDataURL("image/jpeg", 0.72));
    arreter();
  };

  const importerFichier = async (f: File | undefined) => {
    if (!f) return;
    try {
      onPhoto(await compresserPhoto(f));
      onFermer();
    } catch {
      setErreur("Impossible de lire cette photo.");
    }
  };

  if (!ouvert || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Prendre une photo du site"
      className="fixed inset-0 z-[2000] flex justify-center bg-black/80"
    >
      <div className="relative flex h-dvh w-full max-w-[440px] flex-col bg-black text-white">
        {/* Barre du haut */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15"
          >
            <X className="h-6 w-6" />
          </button>
          <p className="font-display text-[16px] font-bold">Photo du site</p>
          {plusieursCameras && !apercu && etat === "pret" ? (
            <button
              type="button"
              onClick={() => setFace((f) => (f === "environment" ? "user" : "environment"))}
              aria-label="Changer de caméra"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15"
            >
              <SwitchCamera className="h-6 w-6" />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
        </div>

        {/* Image */}
        <div className="relative mx-3 min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#0B1B2E]">
          {apercu ? (
            <img src={apercu} alt="Aperçu de la photo" className="h-full w-full object-contain" />
          ) : (
            <video
              ref={video}
              playsInline
              muted
              className={`h-full w-full object-cover ${face === "user" ? "-scale-x-100" : ""} ${etat === "pret" ? "" : "invisible"}`}
            />
          )}
          {!apercu && etat === "demarrage" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">Ouverture de la caméra…</p>
            </div>
          )}
          {!apercu && etat === "erreur" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <CameraOff className="h-12 w-12 text-white/70" />
              <p className="text-[14px] leading-relaxed">{erreur}</p>
            </div>
          )}
          {!apercu && etat === "pret" && (
            <p className="absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-black/55 px-3 py-1 text-[12px]">
              Ne photographiez pas de visages
            </p>
          )}
        </div>

        {/* Commandes */}
        <div className="flex items-center justify-around px-6 pt-5 pb-8">
          {apercu ? (
            <>
              <button
                type="button"
                onClick={() => setApercu(null)}
                className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-[15px] font-semibold"
              >
                <RefreshCw className="h-5 w-5" /> Reprendre
              </button>
              <button
                type="button"
                onClick={() => {
                  onPhoto(apercu);
                  onFermer();
                }}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-bold shadow-[0_10px_24px_-10px_rgba(7,154,10,0.9)]"
              >
                <Camera className="h-5 w-5" /> Utiliser
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => importer.current?.click()}
                aria-label="Importer une photo"
                className="flex w-16 flex-col items-center gap-1 text-[11px] text-white/80"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15">
                  <ImageUp className="h-5 w-5" />
                </span>
                Importer
              </button>
              <button
                type="button"
                onClick={declencher}
                disabled={etat !== "pret"}
                aria-label="Prendre la photo"
                className="grid h-20 w-20 place-items-center rounded-full border-4 border-white disabled:opacity-40"
              >
                <span className="h-16 w-16 rounded-full bg-white transition-transform active:scale-90" />
              </button>
              <span className="w-16" />
            </>
          )}
          <input
            ref={importer}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => importerFichier(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
