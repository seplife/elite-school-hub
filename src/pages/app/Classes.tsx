import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, School, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Niveau = "6e" | "5e" | "4e" | "3e" | "2nde" | "1ere" | "Tle";
type Serie = "Aucune" | "A" | "C" | "D" | "G";

interface Classe {
  id: string;
  nom: string;
  niveau: Niveau;
  serie: Serie;
  salle: string | null;
  capacite: number;
  annee_scolaire: string;
}

const schema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(50),
  niveau: z.enum(["6e", "5e", "4e", "3e", "2nde", "1ere", "Tle"]),
  serie: z.enum(["Aucune", "A", "C", "D", "G"]),
  salle: z.string().trim().max(20).optional(),
  capacite: z.number().int().min(1).max(200),
  annee_scolaire: z.string().regex(/^\d{4}-\d{4}$/, "Format: 2024-2025"),
});

const Classes = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("classes").select("*").order("niveau").order("nom");
    if (error) toast.error(error.message);
    else setClasses(data as Classe[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      nom: fd.get("nom"),
      niveau: fd.get("niveau"),
      serie: fd.get("serie") || "Aucune",
      salle: fd.get("salle") || undefined,
      capacite: Number(fd.get("capacite")),
      annee_scolaire: fd.get("annee_scolaire"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("classes").insert(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Cette classe existe déjà pour cette année" : error.message);
      return;
    }
    toast.success("Classe créée");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette classe ? Les élèves rattachés seront détachés.")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Classe supprimée");
      load();
    }
  };

  const currentYear = new Date().getFullYear();
  const defaultYear = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Gestion des classes et niveaux scolaires.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle classe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Créer une classe</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" name="nom" placeholder="6e A" required />
                  </div>
                  <div>
                    <Label htmlFor="niveau">Niveau</Label>
                    <Select name="niveau" defaultValue="6e" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["6e", "5e", "4e", "3e", "2nde", "1ere", "Tle"] as Niveau[]).map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="serie">Série</Label>
                    <Select name="serie" defaultValue="Aucune">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["Aucune", "A", "C", "D", "G"] as Serie[]).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salle">Salle</Label>
                    <Input id="salle" name="salle" placeholder="B12" />
                  </div>
                  <div>
                    <Label htmlFor="capacite">Capacité</Label>
                    <Input id="capacite" name="capacite" type="number" defaultValue="40" min={1} max={200} required />
                  </div>
                  <div>
                    <Label htmlFor="annee_scolaire">Année scolaire</Label>
                    <Input id="annee_scolaire" name="annee_scolaire" defaultValue={defaultYear} placeholder="2024-2025" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={submitting} className="bg-gradient-primary text-primary-foreground">
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : classes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <School className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-semibold">Aucune classe créée</p>
              <p className="text-sm text-muted-foreground">Commencez par ajouter une classe pour cette année scolaire.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Card key={c.id} className="border-border hover:shadow-elev transition-smooth">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-gradient-primary text-primary-foreground">
                    <School className="h-5 w-5" />
                  </div>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">{c.nom}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.niveau}{c.serie !== "Aucune" ? ` • Série ${c.serie}` : ""}
                  </p>
                </div>
                <dl className="text-sm space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Salle</dt><dd className="font-medium">{c.salle || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Capacité</dt><dd className="font-medium">{c.capacite}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Année</dt><dd className="font-medium">{c.annee_scolaire}</dd></div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Classes;
