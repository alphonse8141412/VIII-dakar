import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connexionEquipeFn, deconnexionEquipeFn, statutEquipeFn } from "@/lib/api";

/**
 * Mode équipe (scouts) : débloque la vérification des signalements, la photo « après »
 * et la saisie des pesées.
 *
 * Le code est vérifié par le serveur (variable CODE_EQUIPE), qui pose un cookie HttpOnly signé.
 * Le navigateur ne connaît ni le code ni le secret ; le serveur refuse toute action d'équipe sans cookie valide.
 */
export function useEquipe() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["equipe"],
    queryFn: () => statutEquipeFn(),
    staleTime: 60_000,
  });

  const connexion = useMutation({
    mutationFn: (code: string) => connexionEquipeFn({ data: { code } }),
    onSuccess: (r) => {
      if (r.ok) qc.setQueryData(["equipe"], { actif: true });
    },
  });

  const deconnexion = useMutation({
    mutationFn: () => deconnexionEquipeFn(),
    onSuccess: () => qc.setQueryData(["equipe"], { actif: false }),
  });

  return {
    actif: data?.actif ?? false,
    enCours: connexion.isPending,
    /** Renvoie true si le code est correct. */
    activer: async (code: string) => {
      try {
        return (await connexion.mutateAsync(code)).ok;
      } catch {
        return false;
      }
    },
    desactiver: () => deconnexion.mutate(),
  };
}
