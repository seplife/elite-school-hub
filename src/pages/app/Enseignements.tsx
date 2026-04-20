import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Layers, UserPlus } from "lucide-react";

interface Row {
  id: string;
  classe_id: string;
  matiere_id: string;
  coefficient: number;
  enseignant_id: string | null;
  classes?: { nom: string } | null;
  matieres?: { nom: string } | null;
}

interface Enseignant { user_id: string; full_name: string; }

export default function Enseignements() {
  const [rows, setRows] = useState<Row[]>([]);
  const [classes, setClasses] = useState<{ id: string; nom: string }[]>([]);
  const [matieres, setMatieres] = useState<{ id: string; nom: string }[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [classeId, setClasseId] = useState("");
  const [matiereId, setMatiereId] = useState("");
  const [coef, setCoef] = useState("1");
  const [enseignantId, setEnseignantId] = useState("none");

  const load = async () => {
    const [r, c, m, ur] = await Promise.all([
      supabase.from("enseignements").select("*, classes(nom), matieres(nom)").order("created_at"),
      supabase.from("classes").select("id, nom").order("nom"),
      supabase.from("matieres").select("id, nom").order("ordre"),
      supabase.from("user_roles").select("user_id").eq("role", "enseignant"),
    ]);
    if (r.error) toast.error(r.error.message);
    setRows((r.data as any) || []);
    setClasses(c.data || []);
    setMatieres(m.data || []);

    const ids = (ur.data || []).map((x) => x.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      setEnseignants(profs || []);
    } else {
      setEnseignants([]);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!classeId || !matiereId) return toast.error("Choisir classe et matière");
    const { error } = await supabase.from("enseignements").insert({
      classe_id: classeId,
      matiere_id: matiereId,
      coefficient: Number(coef) || 1,
      enseignant_id: enseignantId === "none" ? null : enseignantId,
    });
    if (error) return toast.error(error.message);
    toast.success("Affectation ajoutée");
    setClasseId(""); setMatiereId(""); setCoef("1"); setEnseignantId("none");
    load();
  };

  const setEnseignant = async (id: string, value: string) => {
    const { error } = await supabase.from("enseignements")
      .update({ enseignant_id: value === "none" ? null : value })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Enseignant assigné");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const { error } = await supabase.from("enseignements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const nameOf = (uid: string | null) =>
    uid ? enseignants.find((e) => e.user_id === uid)?.full_name || "—" : "Non assigné";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Enseignements</h1>
      </div>
      <p className="text-muted-foreground">
        Associer matières, classes, coefficients et enseignants. Un enseignant ne peut saisir des notes
        que pour les couples classe/matière qui lui sont assignés ici.
      </p>

      <Card>
        <CardHeader><CardTitle>Nouvelle affectation</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-3">
          <Select value={classeId} onValueChange={setClasseId}>
            <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={matiereId} onValueChange={setMatiereId}>
            <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
            <SelectContent>{matieres.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" step="0.5" min="0.5" value={coef} onChange={(e) => setCoef(e.target.value)} placeholder="Coef" />
          <Select value={enseignantId} onValueChange={setEnseignantId}>
            <SelectTrigger><SelectValue placeholder="Enseignant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Non assigné</SelectItem>
              {enseignants.map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Liste ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Classe</TableHead><TableHead>Matière</TableHead><TableHead>Coef</TableHead>
              <TableHead>Enseignant</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.classes?.nom}</TableCell>
                  <TableCell>{r.matieres?.nom}</TableCell>
                  <TableCell>{r.coefficient}</TableCell>
                  <TableCell>
                    <Select value={r.enseignant_id || "none"} onValueChange={(v) => setEnseignant(r.id, v)}>
                      <SelectTrigger className="w-56">
                        <SelectValue>{nameOf(r.enseignant_id)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assigné</SelectItem>
                        {enseignants.map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Aucune affectation
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {!enseignants.length && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Aucun utilisateur n'a le rôle "enseignant". Attribuez ce rôle dans la page Utilisateurs.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
