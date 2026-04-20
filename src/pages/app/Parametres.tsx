import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

export default function Parametres() {
  const [p, setP] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("parametres_notation").select("*").maybeSingle().then(({ data }) => setP(data));
  }, []);

  const save = async () => {
    if (!p) return;
    setSaving(true);
    const { error } = await supabase.from("parametres_notation").update({
      bareme: p.bareme,
      poids_composition: p.poids_composition,
      poids_devoir: p.poids_devoir,
      afficher_rang: p.afficher_rang,
      afficher_mention: p.afficher_mention,
      seuil_excellent: p.seuil_excellent,
      seuil_bien: p.seuil_bien,
      seuil_assez_bien: p.seuil_assez_bien,
      seuil_passable: p.seuil_passable,
      nom_etablissement: p.nom_etablissement,
    }).eq("id", p.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Paramètres enregistrés");
  };

  if (!p) return <div className="p-6 text-muted-foreground">Chargement…</div>;

  const upd = (k: string, v: any) => setP({ ...p, [k]: v });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Paramètres de notation</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Établissement</CardTitle></CardHeader>
        <CardContent>
          <Label>Nom de l'établissement</Label>
          <Input value={p.nom_etablissement} onChange={(e) => upd("nom_etablissement", e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Barème & pondération</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div><Label>Barème par défaut</Label>
            <Input type="number" value={p.bareme} onChange={(e) => upd("bareme", Number(e.target.value))} /></div>
          <div><Label>Poids composition</Label>
            <Input type="number" step="0.5" value={p.poids_composition} onChange={(e) => upd("poids_composition", Number(e.target.value))} /></div>
          <div><Label>Poids devoir</Label>
            <Input type="number" step="0.5" value={p.poids_devoir} onChange={(e) => upd("poids_devoir", Number(e.target.value))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bulletins</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Afficher le rang dans la classe</Label>
            <Switch checked={p.afficher_rang} onCheckedChange={(v) => upd("afficher_rang", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Afficher la mention</Label>
            <Switch checked={p.afficher_mention} onCheckedChange={(v) => upd("afficher_mention", v)} />
          </div>
          <div className="grid md:grid-cols-4 gap-3 pt-2">
            <div><Label>Seuil Excellent</Label>
              <Input type="number" step="0.5" value={p.seuil_excellent} onChange={(e) => upd("seuil_excellent", Number(e.target.value))} /></div>
            <div><Label>Seuil Bien</Label>
              <Input type="number" step="0.5" value={p.seuil_bien} onChange={(e) => upd("seuil_bien", Number(e.target.value))} /></div>
            <div><Label>Seuil Assez Bien</Label>
              <Input type="number" step="0.5" value={p.seuil_assez_bien} onChange={(e) => upd("seuil_assez_bien", Number(e.target.value))} /></div>
            <div><Label>Seuil Passable</Label>
              <Input type="number" step="0.5" value={p.seuil_passable} onChange={(e) => upd("seuil_passable", Number(e.target.value))} /></div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} size="lg">
        <Save className="h-4 w-4 mr-2" />Enregistrer
      </Button>
    </div>
  );
}
