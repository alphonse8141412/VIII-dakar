import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jeunes Éco-Acteurs de Pikine" },
      {
        name: "description",
        content: "Sensibiliser, agir et transformer : signalez un site sale à Pikine et suivez son nettoyage.",
      },
      { property: "og:title", content: "Jeunes Éco-Acteurs de Pikine" },
      { property: "og:description", content: "Signalez un site sale, suivez les nettoyages et les kilos de plastique collectés." },
      { property: "og:image", content: "/logo-gx.png" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preload", href: "/logo-gx.webp", as: "image" },
      { rel: "preload", href: "/entree-pied.webp", as: "image" },
    ],
  }),
  component: Entree,
});

/**
 * Page d'entrée (maquette ~/scout/maquette/entré.webp), en plein écran, sans cadre de téléphone :
 * ciel et nuages en haut, logo Setal Sunu Gox au centre, carte givrée, vague verte et bleue en bas.
 */
function Entree() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate({ to: "/accueil" }), 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Link
      to="/accueil"
      aria-label="Entrer dans l'application"
      className="relative flex h-dvh w-full flex-col items-center overflow-hidden bg-white"
    >
      {/* Ciel */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[62%]"
        style={{ background: "linear-gradient(180deg, #BFE2F6 0%, #DCEFFA 32%, #F3F9FD 60%, #FFFFFF 100%)" }}
      />
      <Nuages />

      {/* Logo + carte */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[min(30vw,24vh)]">
        <img
          src="/logo-gx.webp"
          alt="Setal Sunu Gox"
          width={720}
          height={454}
          className="bt-splash-logo h-auto w-[min(68vw,320px)]"
        />

        <div
          className="bt-fade-up mt-10 w-[min(80vw,340px)] rounded-3xl border border-white/80 bg-white/55 px-5 py-4 text-center shadow-[0_12px_30px_-12px_rgba(7,46,92,0.25)] backdrop-blur-md"
          style={{ animationDelay: "600ms" }}
        >
          <p className="font-display text-[17px] font-bold text-navy">Jeunes Éco-Acteurs de Pikine</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Sensibiliser, agir et transformer</p>
          <span aria-hidden="true" className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <span className="bt-splash-bar block h-full rounded-full bg-brand-gradient" />
          </span>
        </div>
      </div>

      {/* Pied : vague + silhouette de la ville */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 w-[min(100vw,92vh,600px)] -translate-x-1/2"
      >
        <img src="/entree-pied.webp" alt="" width={1200} height={430} className="block h-auto w-full" />
        <Ville className="absolute right-[3%] bottom-[30%] w-[34%]" />
      </div>
    </Link>
  );
}

/** Masse de nuages blancs (en haut à droite, comme sur la maquette). */
function Nuages() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 h-[55%] w-full"
    >
      <defs>
        <filter id="flou-nuage" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="fondu-nuage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g fill="url(#fondu-nuage)" filter="url(#flou-nuage)">
        {/* Grand banc à droite */}
        <circle cx="330" cy="110" r="55" />
        <circle cx="390" cy="90" r="60" />
        <circle cx="270" cy="140" r="45" />
        <circle cx="215" cy="165" r="40" />
        <circle cx="300" cy="175" r="55" />
        <circle cx="380" cy="170" r="65" />
        {/* Banc bas qui se fond dans le blanc */}
        <circle cx="40" cy="210" r="50" />
        <circle cx="110" cy="200" r="45" />
        <circle cx="170" cy="215" r="50" />
        <rect x="-20" y="215" width="440" height="100" />
      </g>
      {/* Petit nuage à gauche */}
      <g fill="#fff" opacity="0.8" filter="url(#flou-nuage)">
        <circle cx="60" cy="70" r="18" />
        <circle cx="85" cy="62" r="22" />
        <circle cx="110" cy="72" r="16" />
      </g>
    </svg>
  );
}

/** Silhouette de ville avec palmier, posée sur la vague à droite. */
function Ville({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} fill="#072E5C">
      <rect x="0" y="44" width="10" height="16" />
      <rect x="12" y="36" width="9" height="24" />
      <path d="M24 60V30h4v-5h2v5h4v30z" />
      <rect x="38" y="40" width="8" height="20" />
      <path d="M50 60V34a6 6 0 0 1 12 0v26z" />
      <rect x="55" y="24" width="2" height="6" />
      <rect x="66" y="22" width="10" height="38" />
      <rect x="70" y="16" width="2" height="6" />
      <rect x="79" y="38" width="9" height="22" />
      <path d="M92 60V28l6-6 6 6v32z" />
      <rect x="108" y="32" width="8" height="28" />
      <rect x="119" y="42" width="11" height="18" />
      <path d="M133 60V36a5 5 0 0 1 10 0v24z" />
      <rect x="137" y="26" width="2" height="6" />
      <rect x="146" y="44" width="10" height="16" />
      {/* Palmier */}
      <path d="M176 60c1-14 2-24 1-34h2c1 10 0 20-1 34z" />
      <path d="M178 26c-6-6-14-6-20-2 7-1 13 0 20 3zM178 26c6-6 14-6 20-2-7-1-13 0-20 3zM178 26c-3-7-9-11-16-11 6 2 11 6 16 12zM178 26c3-7 9-11 16-11-6 2-11 6-16 12zM178 26c0-6 0-10-2-14 3 3 4 8 3 14z" />
      <rect x="160" y="50" width="12" height="10" />
    </svg>
  );
}
