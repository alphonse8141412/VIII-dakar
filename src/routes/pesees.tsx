import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EnTete } from "@/components/AppShell";
import { ModeEquipe } from "@/components/ModeEquipe";
import { useEquipe } from "@/lib/equipe";
import {
  ECOLES,
  formatKg,
  POUBELLES,
  useAjouterPesee,
  usePesees,
  useSupprimerPesee,
  VOLETS,
  type Volet,
} from "@/lib/donnees";

export const Route = createFileRoute("/pesees")({
  ssr: false,
  head: () => ({ meta: [{ title: "Registre des pesées — Jeunes Éco-Acteurs de Pikine" }] }),
  component: Pesees,
});

const LIEUX: Record<Volet, string[]> = {
  ecoles: ECOLES,
  espaces_publics: POUBELLES,
  nettoyage: ["Plage de Pikine (journée n° 1)", "Site signalé (journée n° 2)"],
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function Pesees() {
  const { actif: equipe } = useEquipe();
  const { data: pesees = [] } = usePesees();
  const supprimer = useSupprimerPesee();

  return (
    <AppShell header={<EnTete titre="Registre des pesées" sousTitre="Chaque relevé est pesé et enregistré." />}>
      <div className="flex flex-col gap-4 px-4">
        {equipe ? (
          <FormulairePesee />
        ) : (
          <>
            <p className="flex items-center gap-2 rounded-2xl bg-muted p-3.5 text-[12px] text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0 text-navy" /> La saisie est réservée à l'équipe terrain. Le registre reste consultable par tous.
            </p>
            <ModeEquipe />
          </>
        )}

        <section>
          <h2 className="mb-2 text-[14px] font-bold text-navy">Derniers relevés ({pesees.length})</h2>
          {pesees.length === 0 && <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">Aucune pesée enregistrée.</p>}
          <ul className="flex flex-col gap-2">
            {pesees.map((p) => {
              const total = p.kg_conformes + p.kg_retires;
              const taux = total > 0 ? Math.round((p.kg_conformes / total) * 100) : 0;
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border bg-white p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-navy">{p.lieu}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {VOLETS[p.volet].label} · {new Date(p.date).toLocaleDateString("fr-FR")} · {p.saisi_par}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-[15px] font-bold text-primary">{formatKg(p.kg_conformes)}</span>
                    <span className={`block text-[11px] ${taux >= 80 ? "text-muted-foreground" : "font-bold text-amber-600"}`}>{taux} % conforme</span>
                  </span>
                  {equipe && (
                    <button
                      type="button"
                      aria-label="Supprimer"
                      onClick={() => {
                        if (confirm("Supprimer ce relevé ?")) supprimer.mutate(p.id, { onError: (e) => toast.error(e.message) });
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function FormulairePesee() {
  const ajouter = useAjouterPesee();
  const [volet, setVolet] = useState<Volet>("ecoles");
  const [lieu, setLieu] = useState(LIEUX.ecoles[0]);
  const [date, setDate] = useState(aujourdhui);
  const [conformes, setConformes] = useState("");
  const [retires, setRetires] = useState("");
  const [saisiPar, setSaisiPar] = useState("");

  const kgC = Number(conformes.replace(",", "."));
  const kgR = Number((retires || "0").replace(",", "."));

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(kgC >= 0) || conformes === "" || !(kgR >= 0)) return toast.error("Poids invalide");
    if (kgC + kgR > 50) return toast.error("Plus de 50 kg : le peson ne dépasse pas 50 kg, pesez en plusieurs fois.");
    try {
      await ajouter.mutateAsync({
        date,
        volet,
        lieu,
        kg_conformes: kgC,
        kg_retires: kgR,
        saisi_par: saisiPar.trim() || "Équipe terrain",
      });
    } catch (e) {
      return toast.error((e as Error).message);
    }
    toast.success(`${formatKg(kgC)} enregistrés`);
    setConformes("");
    setRetires("");
  };

  return (
    <form onSubmit={enregistrer} className="rounded-2xl border-2 border-primary/30 bg-white p-4">
      <h2 className="text-[14px] font-bold text-navy">Nouveau relevé</h2>

      <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-muted p-1">
        {(Object.keys(VOLETS) as Volet[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setVolet(v);
              setLieu(LIEUX[v][0]);
            }}
            className={`rounded-lg px-1 py-2 text-[11px] font-bold ${volet === v ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}
          >
            {VOLETS[v].label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Champ label="Lieu" className="col-span-2">
          <select value={lieu} onChange={(e) => setLieu(e.target.value)} className={champ}>
            {LIEUX[volet].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Champ>
        <Champ label="Date">
          <input type="date" value={date} max={aujourdhui()} onChange={(e) => setDate(e.target.value)} className={champ} required />
        </Champ>
        <Champ label="Saisi par">
          <input value={saisiPar} onChange={(e) => setSaisiPar(e.target.value)} placeholder="Prénom / groupe" className={champ} />
        </Champ>
        <Champ label="Plastique conforme (kg)">
          <input inputMode="decimal" value={conformes} onChange={(e) => setConformes(e.target.value)} placeholder="0,0" className={champ} required />
        </Champ>
        <Champ label="Déchets retirés (kg)">
          <input inputMode="decimal" value={retires} onChange={(e) => setRetires(e.target.value)} placeholder="0,0" className={champ} />
        </Champ>
      </div>

      <button
        type="submit"
        disabled={ajouter.isPending}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {ajouter.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Enregistrer la pesée
      </button>
    </form>
  );
}

const champ = "w-full rounded-xl border bg-muted px-3 py-2.5 text-sm text-navy outline-none focus:border-primary";

function Champ({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
