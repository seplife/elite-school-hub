import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, GraduationCap, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface Eleve {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: "M" | "F";
  statut: string;
  classe_id: string | null;
  classes?: { nom: string } | null;
}

const Eleves = () => {
  const { isParent, isAdmin } = useAuth();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("eleves")
        .select("*, classes(nom)")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setEleves((data as any) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = eleves.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q);
  });

  const statutBadge = (s: string) => {
    if (s === "actif") return <Badge className="bg-success text-success-foreground hover:bg-success">Actif</Badge>;
    if (s === "en_attente") return <Badge className="bg-warning text-warning-foreground hover:bg-warning">En attente</Badge>;
    return <Badge variant="secondary">{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">{isParent && !isAdmin ? "Mes enfants" : "Élèves"}</h1>
          <p className="text-muted-foreground">
            {isParent && !isAdmin ? "Vos enfants inscrits ou en cours d'inscription." : "Tous les élèves de l'établissement."}
          </p>
        </div>
        {(isParent || isAdmin) && (
          <Link to="/app/eleves/nouveau">
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md">
              <Plus className="h-4 w-4 mr-2" /> {isAdmin ? "Nouvel élève" : "Inscrire un enfant"}
            </Button>
          </Link>
        )}
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou matricule…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-semibold">Aucun élève {search ? "trouvé" : "pour le moment"}</p>
              {!search && isParent && (
                <p className="text-sm text-muted-foreground">Cliquez sur "Inscrire un enfant" pour commencer.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <Card key={e.id} className="border-border hover:shadow-elev transition-smooth">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg shrink-0">
                    {e.prenom[0]}{e.nom[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold truncate">{e.prenom} {e.nom}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{e.matricule}</p>
                  </div>
                </div>
                <dl className="text-sm space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Classe</dt>
                    <dd className="font-medium">{e.classes?.nom || <span className="text-muted-foreground italic">Non affecté</span>}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sexe</dt>
                    <dd className="font-medium">{e.sexe === "M" ? "Masculin" : "Féminin"}</dd>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <dt className="text-muted-foreground">Statut</dt>
                    <dd>{statutBadge(e.statut)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Eleves;
