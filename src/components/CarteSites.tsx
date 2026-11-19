import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Map as LMap, LayerGroup, Marker } from "leaflet";
import leafletCss from "leaflet/dist/leaflet.css?url";
import { Check, HardHat, Sparkles, Trash2 } from "lucide-react";
import { CENTRE_PIKINE, STATUTS, type Signalement, type Statut } from "@/lib/donnees";

export type MaPosition = { lat: number; lon: number; precision: number };

/** Icône dessinée dans chaque marqueur, selon le statut (maquette map.png). */
const ICONES: Record<Statut, string> = Object.fromEntries(
  (
    [
      ["signale", Trash2],
      ["verifie", HardHat],
      ["nettoye", Check],
      ["rehabilite", Sparkles],
    ] as const
  ).map(([k, Icone]) => [k, renderToStaticMarkup(<Icone width={18} height={18} color="#fff" strokeWidth={2.6} />)]),
) as Record<Statut, string>;

/** Couleurs des marqueurs (le jaune de la maquette pour « en cours »). */
const COULEURS: Record<Statut, [string, string]> = {
  signale: ["#F04438", "#C81E1E"],
  verifie: ["#FACC15", "#D9A400"],
  nettoye: ["#16A34A", "#0B7A2E"],
  rehabilite: ["#3B82F6", "#1D4ED8"],
};

function htmlMarqueur(statut: Statut, choisi: boolean) {
  const [clair, fonce] = COULEURS[statut];
  const t = choisi ? 1.2 : 1;
  return `<div style="width:${40 * t}px;height:${52 * t}px;position:relative;filter:drop-shadow(0 4px 4px rgba(0,0,0,.3));transform-origin:bottom center">
    <svg viewBox="0 0 40 52" width="100%" height="100%" style="position:absolute;inset:0">
      <defs><linearGradient id="g-${statut}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${clair}"/><stop offset="1" stop-color="${fonce}"/></linearGradient></defs>
      <path d="M20 51C20 51 2 31 2 19A18 18 0 0 1 38 19C38 31 20 51 20 51Z" fill="url(#g-${statut})" stroke="#fff" stroke-width="${choisi ? 3 : 2}"/>
    </svg>
    <div style="position:absolute;top:${10 * t}px;left:0;right:0;display:flex;justify-content:center">${ICONES[statut]}</div>
  </div>`;
}

/** Carte OpenStreetMap des signalements. Leaflet n'est chargé que dans le navigateur. */
export function CarteSites({
  sites,
  onChoisir,
  choisi,
  maPosition,
  hauteur = "h-80",
  zoom = true,
}: {
  sites: Signalement[];
  onChoisir?: (id: string) => void;
  choisi?: string | null;
  maPosition?: MaPosition | null;
  hauteur?: string;
  zoom?: boolean;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<LMap | null>(null);
  const couche = useRef<LayerGroup | null>(null);
  const coucheMoi = useRef<LayerGroup | null>(null);
  const marqueurs = useRef(new Map<string, Marker>());
  const L = useRef<typeof import("leaflet") | null>(null);
  const choisir = useRef(onChoisir);
  choisir.current = onChoisir;
  // Valeurs les plus récentes : Leaflet se charge après le premier rendu
  const actuel = useRef({ sites, choisi, maPosition });
  actuel.current = { sites, choisi, maPosition };

  const dessiner = () => {
    const Lf = L.current;
    if (!Lf || !carte.current || !couche.current) return;
    const { sites, choisi } = actuel.current;
    couche.current.clearLayers();
    marqueurs.current.clear();
    for (const s of sites) {
      const m = Lf.marker([s.lat, s.lon], {
        icon: icone(Lf, s.statut, s.id === choisi),
        title: `${STATUTS[s.statut].label} — ${s.quartier}`,
        zIndexOffset: s.id === choisi ? 1000 : 0,
      })
        .on("click", () => choisir.current?.(s.id))
        .addTo(couche.current);
      marqueurs.current.set(s.id, m);
    }
    if (sites.length > 0) {
      const limites = Lf.latLngBounds(sites.map((s) => [s.lat, s.lon] as [number, number]));
      carte.current.fitBounds(limites, { padding: [50, 50], maxZoom: 16 });
    }
  };

  useEffect(() => {
    let annule = false;
    if (!document.getElementById("leaflet-css")) {
      const lien = document.createElement("link");
      lien.id = "leaflet-css";
      lien.rel = "stylesheet";
      lien.href = leafletCss;
      document.head.appendChild(lien);
    }
    import("leaflet").then((mod) => {
      if (annule || !conteneur.current || carte.current) return;
      const Lf = (mod as unknown as { default?: typeof import("leaflet") }).default ?? mod;
      L.current = Lf;
      carte.current = Lf.map(conteneur.current, { zoomControl: false, attributionControl: true }).setView(CENTRE_PIKINE, 14);
      if (zoom) Lf.control.zoom({ position: "topright" }).addTo(carte.current);
      Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
        className: "tuiles-claires",
      }).addTo(carte.current);
      couche.current = Lf.layerGroup().addTo(carte.current);
      coucheMoi.current = Lf.layerGroup().addTo(carte.current);
      dessiner();
      dessinerMoi();
    });
    return () => {
      annule = true;
      carte.current?.remove();
      carte.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(dessiner, [sites]);

  // Mise en avant du site choisi, sans recadrer la carte
  useEffect(() => {
    const Lf = L.current;
    if (!Lf) return;
    const { sites, choisi } = actuel.current;
    for (const s of sites) {
      const m = marqueurs.current.get(s.id);
      m?.setIcon(icone(Lf, s.statut, s.id === choisi));
      m?.setZIndexOffset(s.id === choisi ? 1000 : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choisi]);

  const dessinerMoi = () => {
    const Lf = L.current;
    if (!Lf || !carte.current || !coucheMoi.current) return;
    coucheMoi.current.clearLayers();
    const { maPosition } = actuel.current;
    if (!maPosition) return;
    const p: [number, number] = [maPosition.lat, maPosition.lon];
    Lf.circle(p, { radius: Math.max(maPosition.precision, 30), color: "#2F80ED", weight: 1, fillColor: "#2F80ED", fillOpacity: 0.15 }).addTo(
      coucheMoi.current,
    );
    Lf.marker(p, {
      interactive: false,
      icon: Lf.divIcon({
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        html: '<div style="width:22px;height:22px;border-radius:9999px;background:#2F80ED;border:4px solid #fff;box-shadow:0 0 0 8px rgba(47,128,237,.25),0 2px 6px rgba(0,0,0,.3)"></div>',
      }),
    }).addTo(coucheMoi.current);
    carte.current.flyTo(p, Math.max(carte.current.getZoom(), 15), { duration: 0.8 });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(dessinerMoi, [maPosition]);

  return (
    <>
      {/* Fond un peu adouci, plus proche du rendu clair de la maquette */}
      <style>{`.tuiles-claires { filter: saturate(.85) brightness(1.04); }`}</style>
      <div ref={conteneur} className={`${hauteur} w-full bg-muted`} />
    </>
  );
}

function icone(Lf: typeof import("leaflet"), statut: Statut, choisi: boolean) {
  const t = choisi ? 1.2 : 1;
  return Lf.divIcon({
    className: "",
    iconSize: [40 * t, 52 * t],
    iconAnchor: [20 * t, 51 * t],
    html: htmlMarqueur(statut, choisi),
  });
}
