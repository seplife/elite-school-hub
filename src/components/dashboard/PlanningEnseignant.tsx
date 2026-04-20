import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ClipboardEdit, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ExamenItem {
  id: string;
  titre: string;
  type: string;
  date_debut: string;
  salle: string | null;
  duree_minutes: number;
  classes?: { nom: string } | null;
  matieres?: { nom: string } | null;
}

interface EvalItem {
  id: string;
  titre: string;
  date_evaluation: string | null;
  classes?: { nom: string } | null;
  matieres?: { nom: string } | null;
  notes_count: number;
  attendus: number;
}

const TYPE_LABEL: Record<string, string> = {
  composition: "Composition",
  devoir_surveille: "DS",
  examen_blanc: "Blanc",
  bac_blanc: "BAC blanc",
};

export const PlanningEnseignant = () => {
  const { user } = useAuth();
  const [examens, setExamens] = useState<ExamenItem[]>([]);
  const [aCorriger, setACorriger] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Récupérer les enseignements du prof
      const { data: ens } = await supabase
        .from("enseignements")
        .select("classe_id, matiere_id")
        .eq("enseignant_id", user.id);

      if (!ens || !ens.length) {
        setLoading(false);
        return;
      }

      const classeIds = [...new Set(ens.map((e) => e.classe_id))];
      const matiereIds = [...new Set(ens.map((e) => e.matiere_id))];
      const today = new Date().toISOString();

      // Examens à venir (RLS via peut_enseigner laisse passer)
      const { data: ex } = await supabase
        .from("examens")
        .select("id, titre, type, date_debut, salle, duree_minutes, classes(nom), matieres(nom)")
        .in("classe_id", classeIds)
        .in("matiere_id", matiereIds)
        .gte("date_debut", today)
        .order("date_debut")
        .limit(5);
      setExamens((ex as any) || []);

      // Évaluations du prof avec compteur de notes
      const { data: evals } = await supabase
        .from("evaluations")
        .select("id, titre, date_evaluation, classe_id, classes(nom), matieres(nom)")
        .in("classe_id", classeIds)
        .in("matiere_id", matiereIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (evals && evals.length) {
        const evalIds = evals.map((e: any) => e.id);
        const { data: notes } = await supabase
          .from("notes")
          .select("evaluation_id, valeur")
          .in("evaluation_id", evalIds);

        // effectifs par classe
        const { data: eleves } = await supabase
          .from("eleves")
          .select("classe_id")
          .in("classe_id", classeIds)
          .eq("statut", "actif");

        const effectifByClasse: Record<string, number> = {};
        (eleves || []).forEach((e: any) => {
          effectifByClasse[e.classe_id] = (effectifByClasse[e.classe_id] || 0) + 1;
        });

        const notesByEval: Record<string, number> = {};
        (notes || []).forEach((n: any) => {
          if (n.valeur != null) notesByEval[n.evaluation_id] = (notesByEval[n.evaluation_id] || 0) + 1;
        });

        const incomplets = (evals as any[])
          .map((e) => ({
            ...e,
            notes_count: notesByEval[e.id] || 0,
            attendus: effectifByClasse[e.classe_id] || 0,
          }))
          .filter((e) => e.attendus > 0 && e.notes_count < e.attendus)
          .slice(0, 5);

        setACorriger(incomplets);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return null;
  if (!examens.length && !aCorriger.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-muted-foreground flex items-center gap-2">
        <CalendarClock className="h-5 w-5" /> Mon planning
      </h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Prochains examens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {examens.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun examen à venir</p>
            )}
            {examens.map((e) => {
              const d = new Date(e.date_debut);
              return (
                <div key={e.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/40 transition-smooth">
                  <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md min-w-12 py-1">
                    <span className="text-[10px] font-semibold uppercase">
                      {d.toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[e.type] || e.type}</Badge>
                      <span className="font-medium text-sm truncate">{e.titre}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.classes?.nom} • {e.matieres?.nom}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />
                        {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} • {e.duree_minutes}min
                      </span>
                      {e.salle && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.salle}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <Link to="/app/examens">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Voir le calendrier complet <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <ClipboardEdit className="h-4 w-4 text-secondary" /> Évaluations à corriger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aCorriger.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Toutes vos notes sont saisies ✓</p>
            )}
            {aCorriger.map((e) => {
              const pct = e.attendus ? Math.round((e.notes_count / e.attendus) * 100) : 0;
              return (
                <Link key={e.id} to="/app/notes" className="block p-2 rounded-md hover:bg-muted/40 transition-smooth">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{e.titre}</span>
                    <Badge variant={pct === 0 ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                      {e.notes_count}/{e.attendus}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {e.classes?.nom} • {e.matieres?.nom}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
            <Link to="/app/notes">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Saisir les notes <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
