import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Pencil } from "lucide-react";

interface EvalRow {
  id: string; titre: string; bareme: number; classe_id: string; matiere_id: string;
  classes?: { nom: string } | null; matieres?: { nom: string } | null;
}
interface Eleve { id: string; nom: string; prenom: string; matricule: string; }
interface NoteRow { id?: string; eleve_id: string; valeur: string; appreciation: string; }

export default function Notes() {
  const [params, setParams] = useSearchParams();
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [evalId, setEvalId] = useState(params.get("evaluation") || "");
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [notes, setNotes] = useState<Record<string, NoteRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("evaluations").select("*, classes(nom), matieres(nom)").order("created_at", { ascending: false })
      .then(({ data }) => setEvals((data as any) || []));
  }, []);

  useEffect(() => {
    if (!evalId) { setEleves([]); setNotes({}); return; }
    setParams({ evaluation: evalId });
    (async () => {
      const ev = evals.find((e) => e.id === evalId);
      if (!ev) return;
      const [el, nt] = await Promise.all([
        supabase.from("eleves").select("id, nom, prenom, matricule").eq("classe_id", ev.classe_id).eq("statut", "actif").order("nom"),
        supabase.from("notes").select("*").eq("evaluation_id", evalId),
      ]);
      const elList = el.data || [];
      setEleves(elList);
      const map: Record<string, NoteRow> = {};
      elList.forEach((e) => {
        const existing = (nt.data || []).find((n: any) => n.eleve_id === e.id);
        map[e.id] = {
          id: existing?.id,
          eleve_id: e.id,
          valeur: existing?.valeur != null ? String(existing.valeur) : "",
          appreciation: existing?.appreciation || "",
        };
      });
      setNotes(map);
    })();
  }, [evalId, evals]);

  const currentEval = useMemo(() => evals.find((e) => e.id === evalId), [evals, evalId]);

  const saveAll = async () => {
    if (!evalId || !currentEval) return;
    setSaving(true);
    const payload = Object.values(notes)
      .filter((n) => n.valeur !== "")
      .map((n) => ({
        ...(n.id ? { id: n.id } : {}),
        evaluation_id: evalId,
        eleve_id: n.eleve_id,
        valeur: Number(n.valeur),
        appreciation: n.appreciation || null,
      }));

    // Upsert by (evaluation_id, eleve_id) uniqueness
    const { error } = await supabase.from("notes").upsert(payload, { onConflict: "evaluation_id,eleve_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${payload.length} note(s) enregistrée(s)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Pencil className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Saisie des notes</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Choisir l'évaluation</CardTitle></CardHeader>
        <CardContent>
          <Select value={evalId} onValueChange={setEvalId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner une évaluation" /></SelectTrigger>
            <SelectContent>
              {evals.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.classes?.nom} • {e.matieres?.nom} • {e.titre} (T{(e as any).trimestre} /{e.bareme})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentEval && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentEval.titre} — {eleves.length} élève(s)</CardTitle>
              <Button onClick={saveAll} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />Enregistrer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Matricule</TableHead><TableHead>Nom</TableHead>
                <TableHead className="w-32">Note /{currentEval.bareme}</TableHead>
                <TableHead>Appréciation</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {eleves.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.matricule}</TableCell>
                    <TableCell className="font-medium">{e.nom} {e.prenom}</TableCell>
                    <TableCell>
                      <Input
                        type="number" min="0" max={currentEval.bareme} step="0.25"
                        value={notes[e.id]?.valeur || ""}
                        onChange={(ev) => setNotes((p) => ({ ...p, [e.id]: { ...p[e.id], valeur: ev.target.value } }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optionnel"
                        value={notes[e.id]?.appreciation || ""}
                        onChange={(ev) => setNotes((p) => ({ ...p, [e.id]: { ...p[e.id], appreciation: ev.target.value } }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!eleves.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Aucun élève actif dans cette classe</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
