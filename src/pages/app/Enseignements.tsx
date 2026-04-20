import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Layers } from "lucide-react";

interface Row {
  id: string;
  classe_id: string;
  matiere_id: string;
  coefficient: number;
  classes?: { nom: string } | null;
  matieres?: { nom: string } | null;
}

export default function Enseignements() {
  const [rows, setRows] = useState<Row[]>([]);
  const [classes, setClasses] = useState<{ id: string; nom: string }[]>([]);
  const [matieres, setMatieres] = useState<{ id: string; nom: string }[]>([]);
  const [classeId, setClasseId] = useState("");
  const [matiereId, setMatiereId] = useState("");
  const [coef, setCoef] = useState("1");

  const load = async () => {
    const [r, c, m] = await Promise.all([
      supabase.from("enseignements").select("*, classes(nom), matieres(nom)").order("created_at"),
      supabase.from("classes").select("id, nom").order("nom"),
      supabase.from("matieres").select("id, nom").order("ordre"),
    ]);
    if (r.error) toast.error(r.error.message);
    setRows((r.data as any) || []);
    setClasses(c.data || []);
    setMatieres(m.data || []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!classeId || !matiereId) return toast.error("Choisir classe et matière");
    const { error } = await supabase.from("enseignements").insert({
      classe_id: classeId,
      matiere_id: matiereId,
      coefficient: Number(coef) || 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Affectation ajoutée");
    setClasseId(""); setMatiereId(""); setCoef("1");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const { error } = await supabase.from("enseignements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Enseignements</h1>
      </div>
      <p className="text-muted-foreground">Associer matières et classes avec coefficients pour les bulletins.</p>

      <Card>
        <CardHeader><CardTitle>Affecter une matière à une classe</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Select value={classeId} onValueChange={setClasseId}>
            <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={matiereId} onValueChange={setMatiereId}>
            <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
            <SelectContent>{matieres.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" step="0.5" min="0.5" value={coef} onChange={(e) => setCoef(e.target.value)} placeholder="Coefficient" />
          <Button onClick={add}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Liste ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Classe</TableHead><TableHead>Matière</TableHead><TableHead>Coef</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.classes?.nom}</TableCell>
                  <TableCell>{r.matieres?.nom}</TableCell>
                  <TableCell>{r.coefficient}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
