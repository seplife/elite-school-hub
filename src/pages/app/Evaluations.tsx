import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardCheck, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

interface Eval {
  id: string;
  titre: string;
  type: "devoir" | "composition";
  trimestre: "1" | "2" | "3";
  date_evaluation: string | null;
  bareme: number;
  annee_scolaire: string;
  classe_id: string;
  matiere_id: string;
  classes?: { nom: string } | null;
  matieres?: { nom: string } | null;
}

export default function Evaluations() {
  const [list, setList] = useState<Eval[]>([]);
  const [classes, setClasses] = useState<{ id: string; nom: string; annee_scolaire: string }[]>([]);
  const [matieres, setMatieres] = useState<{ id: string; nom: string }[]>([]);

  const [titre, setTitre] = useState("");
  const [type, setType] = useState<"devoir" | "composition">("devoir");
  const [trimestre, setTrimestre] = useState<"1" | "2" | "3">("1");
  const [classeId, setClasseId] = useState("");
  const [matiereId, setMatiereId] = useState("");
  const [date, setDate] = useState("");
  const [bareme, setBareme] = useState("20");

  const [filterClasse, setFilterClasse] = useState("all");
  const [filterTrim, setFilterTrim] = useState("all");

  const load = async () => {
    const [e, c, m] = await Promise.all([
      supabase.from("evaluations").select("*, classes(nom), matieres(nom)").order("date_evaluation", { ascending: false, nullsFirst: false }),
      supabase.from("classes").select("id, nom, annee_scolaire").order("nom"),
      supabase.from("matieres").select("id, nom").order("ordre"),
    ]);
    if (e.error) toast.error(e.error.message);
    setList((e.data as any) || []);
    setClasses(c.data || []);
    setMatieres(m.data || []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!titre.trim() || !classeId || !matiereId) return toast.error("Champs requis manquants");
    const classe = classes.find((c) => c.id === classeId);
    const { error } = await supabase.from("evaluations").insert({
      titre: titre.trim(),
      type, trimestre,
      classe_id: classeId,
      matiere_id: matiereId,
      date_evaluation: date || null,
      bareme: Number(bareme) || 20,
      annee_scolaire: classe?.annee_scolaire || "2025-2026",
    });
    if (error) return toast.error(error.message);
    toast.success("Évaluation créée");
    setTitre(""); setDate("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette évaluation et toutes ses notes ?")) return;
    const { error } = await supabase.from("evaluations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = list.filter((e) =>
    (filterClasse === "all" || e.classe_id === filterClasse) &&
    (filterTrim === "all" || e.trimestre === filterTrim)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Évaluations</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Nouvelle évaluation</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Titre (ex: Compo 1er trim)" value={titre} onChange={(e) => setTitre(e.target.value)} className="md:col-span-2" />
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="devoir">Devoir</SelectItem>
              <SelectItem value="composition">Composition</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classeId} onValueChange={setClasseId}>
            <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={matiereId} onValueChange={setMatiereId}>
            <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
            <SelectContent>{matieres.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={trimestre} onValueChange={(v: any) => setTrimestre(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Trimestre 1</SelectItem>
              <SelectItem value="2">Trimestre 2</SelectItem>
              <SelectItem value="3">Trimestre 3</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" min="1" step="1" value={bareme} onChange={(e) => setBareme(e.target.value)} placeholder="Barème" />
          <Button onClick={add} className="md:col-span-3"><Plus className="h-4 w-4 mr-2" />Créer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Liste ({filtered.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterClasse} onValueChange={setFilterClasse}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes classes</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTrim} onValueChange={setFilterTrim}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous trim.</SelectItem>
                  <SelectItem value="1">Trim 1</SelectItem>
                  <SelectItem value="2">Trim 2</SelectItem>
                  <SelectItem value="3">Trim 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Titre</TableHead><TableHead>Type</TableHead><TableHead>Classe</TableHead>
              <TableHead>Matière</TableHead><TableHead>Trim.</TableHead><TableHead>Date</TableHead>
              <TableHead>Barème</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.titre}</TableCell>
                  <TableCell><Badge variant={e.type === "composition" ? "default" : "secondary"}>{e.type}</Badge></TableCell>
                  <TableCell>{e.classes?.nom}</TableCell>
                  <TableCell>{e.matieres?.nom}</TableCell>
                  <TableCell>T{e.trimestre}</TableCell>
                  <TableCell>{e.date_evaluation || "—"}</TableCell>
                  <TableCell>/{e.bareme}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/app/notes?evaluation=${e.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(e.id)}>
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
