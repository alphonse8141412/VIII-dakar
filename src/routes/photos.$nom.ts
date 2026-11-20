import { createFileRoute } from "@tanstack/react-router";
import { lirePhoto } from "@/server/photos.server";

/** Sert les photos enregistrées sur le serveur (noms aléatoires, jamais modifiés : cache long). */
export const Route = createFileRoute("/photos/$nom")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const photo = await lirePhoto(params.nom);
        if (!photo) return new Response("Photo introuvable", { status: 404 });
        return new Response(new Uint8Array(photo), {
          headers: {
            "content-type": "image/jpeg",
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
