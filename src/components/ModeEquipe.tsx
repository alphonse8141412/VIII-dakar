import { useState } from "react";
import { ShieldCheck, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { CarteSection } from "@/components/AppShell";
import { useEquipe } from "@/lib/equipe";

export function ModeEquipe() {
  const { actif, activer, desactiver } = useEquipe();
  const [code, setCode] = useState("");

  if (actif) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-secondary p-3.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-navy">
          <ShieldCheck className="h-5 w-5 text-primary" /> Mode équipe actif
        </span>
        <button
          type="button"
          onClick={desactiver}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Quitter
        </button>
      </div>
    );
  }

  return (
    <CarteSection icone={<Users />} titre="Espace équipe scouts">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (activer(code)) {
            toast.success("Mode équipe activé");
            setCode("");
          } else toast.error("Code incorrect");
        }}
      >
        <p className="text-xs text-muted-foreground">
          Pour vérifier les signalements et saisir les pesées.
        </p>
        <div className="mt-2.5 flex gap-2">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code équipe"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-navy/15 bg-[#F4F7FB] px-4 py-2.5 text-sm text-navy outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(7,154,10,0.7)] active:scale-[0.97]"
          >
            Entrer
          </button>
        </div>
      </form>
    </CarteSection>
  );
}
