// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Sur Vercel (variable VERCEL définie pendant la compilation) : fonctions Vercel.
  // Ailleurs : serveur Node autonome, `npm start` (node .output/server/index.mjs).
  // Région fra1 (Francfort) : au plus près de la base Turso (aws-eu-central-1) et du Sénégal.
  // (option `vercel` transmise telle quelle à nitro, absente du type de la config Lovable)
  nitro: {
    preset: process.env.VERCEL ? "vercel" : "node-server",
    ...{ vercel: { functions: { regions: ["fra1"] } } },
  },
});
