import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(50),
  prenom: z.string().trim().min(1, "Prénom requis").max(50),
  date_naissance: z.string().min(1, "Date de naissance requise"),
  lieu_naissance: z.string().trim().max(80).optional(),
  sexe: z.enum(["M", "F"]),
  adresse: z.string().trim().max(200).optional(),
  classe_id: z.string().uuid().optional().or(z.literal("")),
});

const NouvelEleve = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [classes, setClasses] = useState<{ id: string; nom: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("classes").select("id, nom").order("nom").then(({ data }) => setClasses(data ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      nom: fd.get("nom"),
      prenom: fd.get("prenom"),
      date_naissance: fd.get("date_naissance"),
      lieu_naissance: fd.get("lieu_naissance") || undefined,
      sexe: fd.get("sexe"),
      adresse: fd.get("adresse") || undefined,
      classe_id: (fd.get("classe_id") as string) || "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("eleves").insert({
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      date_naissance: parsed.data.date_naissance,
      lieu_naissance: parsed.data.lieu_naissance,
      sexe: parsed.data.sexe,
      adresse: parsed.data.adresse,
      classe_id: parsed.data.classe_id || null,
      parent_id: user.id,
      matricule: "", // auto via trigger
      statut: isAdmin ? "actif" : "en_attente",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isAdmin ? "Élève créé" : "Demande d'inscription envoyée — l'administration la validera.");
    navigate("/app/eleves");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-3">
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-primary text-primary-foreground shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="font-display text-2xl">{isAdmin ? "Nouvel élève" : "Inscription en ligne"}</CardTitle>
              <CardDescription>
                {isAdmin ? "Créer un dossier élève." : "Inscrivez votre enfant au Cours Secondaire Elites Divo."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" name="prenom" required maxLength={50} />
              </div>
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" name="nom" required maxLength={50} />
              </div>
              <div>
                <Label htmlFor="date_naissance">Date de naissance *</Label>
                <Input id="date_naissance" name="date_naissance" type="date" required />
              </div>
              <div>
                <Label htmlFor="sexe">Sexe *</Label>
                <Select name="sexe" defaultValue="M" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                <Input id="lieu_naissance" name="lieu_naissance" maxLength={80} placeholder="Divo" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" name="adresse" maxLength={200} placeholder="Quartier, rue…" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="classe_id">Classe souhaitée {!isAdmin && "(à valider par l'école)"}</Label>
                <Select name="classe_id">
                  <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
              <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isAdmin ? "Créer l'élève" : "Envoyer la demande"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NouvelEleve;
