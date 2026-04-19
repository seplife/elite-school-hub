import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Check, X, Trash2, Inbox } from "lucide-react";
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
  parent_id: string | null;
  created_at: string;
}

interface Classe {
  id: string;
  nom: string;
  niveau: string;
  serie: string;
}

const Inscriptions = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasse, setSelectedClasse] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: el, error: e1 }, { data: cl, error: e2 }] = await Promise.all([
      supabase.from("eleves").select("*").in("statut", ["en_attente", "rejete"]).order("created_at", { ascending: false }),
      supabase.from("classes").select("id, nom, niveau, serie").order("nom"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setEleves((el as any) ?? []);
    setClasses((cl as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!authLoading && !isAdmin) return <Navigate to="/app" replace />;

  const valider = async (eleve: Eleve) => {
    const classeId = selectedClasse[eleve.id];
    if (!classeId) {
      toast.error("Veuillez sélectionner une classe avant de valider.");
      return;
    }
    setBusy(eleve.id);
    const { error } = await supabase
      .from("eleves")
      .update({ statut: "actif", classe_id: classeId })
      .eq("id", eleve.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${eleve.prenom} ${eleve.nom} validé(e) et affecté(e).`);
    load();
  };

  const rejeter = async (eleve: Eleve) => {
    setBusy(eleve.id);
    const { error } = await supabase.from("eleves").update({ statut: "rejete" }).eq("id", eleve.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Inscription rejetée.");
    load();
  };

  const restaurer = async (eleve: Eleve) => {
    setBusy(eleve.id);
    const { error } = await supabase.from("eleves").update({ statut: "en_attente" }).eq("id", eleve.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Inscription remise en attente.");
    load();
  };

  const supprimer = async (eleve: Eleve) => {
    setBusy(eleve.id);
    const { error } = await supabase.from("eleves").delete().eq("id", eleve.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Inscription supprimée définitivement.");
    load();
  };

  const enAttente = eleves.filter((e) => e.statut === "en_attente");
  const rejetes = eleves.filter((e) => e.statut === "rejete");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Inscriptions</h1>
        <p className="text-muted-foreground">Validez ou rejetez les demandes d'inscription des parents.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="attente">
          <TabsList>
            <TabsTrigger value="attente">
              En attente <Badge variant="secondary" className="ml-2">{enAttente.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejete">
              Rejetées <Badge variant="secondary" className="ml-2">{rejetes.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attente" className="space-y-3 mt-4">
            {enAttente.length === 0 ? (
              <EmptyState label="Aucune inscription en attente." />
            ) : (
              enAttente.map((e) => (
                <EleveRow
                  key={e.id}
                  eleve={e}
                  classes={classes}
                  selectedClasse={selectedClasse[e.id]}
                  onSelectClasse={(v) => setSelectedClasse((s) => ({ ...s, [e.id]: v }))}
                  busy={busy === e.id}
                  actions={
                    <>
                      <Button
                        size="sm"
                        onClick={() => valider(e)}
                        disabled={busy === e.id}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        <Check className="h-4 w-4 mr-1" /> Valider
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejeter(e)} disabled={busy === e.id}>
                        <X className="h-4 w-4 mr-1" /> Rejeter
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejete" className="space-y-3 mt-4">
            {rejetes.length === 0 ? (
              <EmptyState label="Aucune inscription rejetée." />
            ) : (
              rejetes.map((e) => (
                <EleveRow
                  key={e.id}
                  eleve={e}
                  classes={classes}
                  selectedClasse={selectedClasse[e.id]}
                  onSelectClasse={(v) => setSelectedClasse((s) => ({ ...s, [e.id]: v }))}
                  busy={busy === e.id}
                  showClasseSelect={false}
                  actions={
                    <>
                      <Button size="sm" variant="outline" onClick={() => restaurer(e)} disabled={busy === e.id}>
                        Restaurer
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={busy === e.id}>
                            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. L'inscription de {e.prenom} {e.nom} sera supprimée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => supprimer(e)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  }
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <Card className="border-dashed">
    <CardContent className="py-10 text-center text-muted-foreground space-y-2">
      <Inbox className="h-10 w-10 mx-auto opacity-50" />
      <p>{label}</p>
    </CardContent>
  </Card>
);

const EleveRow = ({
  eleve, classes, selectedClasse, onSelectClasse, actions, busy, showClasseSelect = true,
}: {
  eleve: Eleve;
  classes: Classe[];
  selectedClasse?: string;
  onSelectClasse: (v: string) => void;
  actions: React.ReactNode;
  busy: boolean;
  showClasseSelect?: boolean;
}) => (
  <Card className="border-border">
    <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold shrink-0">
          {eleve.prenom[0]}{eleve.nom[0]}
        </div>
        <div className="min-w-0">
          <div className="font-display font-semibold truncate">{eleve.prenom} {eleve.nom}</div>
          <div className="text-xs text-muted-foreground font-mono">{eleve.matricule} · {eleve.sexe === "M" ? "Garçon" : "Fille"} · né(e) {new Date(eleve.date_naissance).toLocaleDateString("fr-FR")}</div>
        </div>
      </div>
      {showClasseSelect && (
        <div className="md:w-56">
          <Select value={selectedClasse} onValueChange={onSelectClasse} disabled={busy}>
            <SelectTrigger><SelectValue placeholder="Affecter une classe" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">{actions}</div>
    </CardContent>
  </Card>
);

export default Inscriptions;
