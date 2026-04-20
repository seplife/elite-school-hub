import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, CalendarDays, Clock, MapPin, UserCheck, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { genererConvocationPDF } from "@/lib/convocation";

interface Examen {
  id: string;
  titre: string;
  type: "composition" | "devoir_surveille" | "examen_blanc" | "bac_blanc";
  classe_id: string;
  matiere_id: string;
  evaluation_id: string | null;
  date_debut: string;
  duree_minutes: number;
  salle: string | null;
  surveillant_nom: string | null;
  instructions: string | null;
  trimestre: "1" | "2" | "3" | null;
  annee_scolaire: string;
  classes?: { nom: string } | null;
  matieres?: { nom: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  composition: "Composition",
  devoir_surveille: "Devoir surveillé",
  examen_blanc: "Examen blanc",
  bac_blanc: "BAC blanc",
};

const TYPE_COLOR: Record<string, string> = {
  composition: "default",
  devoir_surveille: "secondary",
  examen_blanc: "outline",
  bac_blanc: "destructive",
};

export default function Examens() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState<Examen[]>([]);
  const [classes, setClasses] = useState<{ id: string; nom: string; annee_scolaire: string }[]>([]);
  const [matieres, setMatieres] = useState<{ id: string; nom: string }[]>([]);
  const [evaluations, setEvaluations] = useState<{ id: string; titre: string; classe_id: string; matiere_id: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [cursor, setCursor] = useState(new Date());

  const [form, setForm] = useState({
    titre: "",
    type: "composition" as Examen["type"],
    classe_id: "",
    matiere_id: "",
    evaluation_id: "none",
    date: "",
    heure: "08:00",
    duree_minutes: 120,
    salle: "",
    surveillant_nom: "",
    instructions: "",
    trimestre: "1" as "1" | "2" | "3",
  });

  const load = async () => {
    const [ex, c, m, ev] = await Promise.all([
      supabase.from("examens").select("*, classes(nom), matieres(nom)").order("date_debut"),
      supabase.from("classes").select("id, nom, annee_scolaire").order("nom"),
      supabase.from("matieres").select("id, nom").order("ordre"),
      supabase.from("evaluations").select("id, titre, classe_id, matiere_id").order("created_at", { ascending: false }),
    ]);
    if (ex.error) toast.error(ex.error.message);
    setList((ex.data as any) || []);
    setClasses(c.data || []);
    setMatieres(m.data || []);
    setEvaluations(ev.data || []);
  };

  useEffect(() => { load(); }, []);

  const reset = () => setForm({
    titre: "", type: "composition", classe_id: "", matiere_id: "", evaluation_id: "none",
    date: "", heure: "08:00", duree_minutes: 120, salle: "", surveillant_nom: "", instructions: "", trimestre: "1",
  });

  const create = async () => {
    if (!form.titre || !form.classe_id || !form.matiere_id || !form.date) {
      return toast.error("Champs requis manquants");
    }
    const classe = classes.find((c) => c.id === form.classe_id);
    const date_debut = new Date(`${form.date}T${form.heure}:00`).toISOString();
    const { error } = await supabase.from("examens").insert({
      titre: form.titre,
      type: form.type,
      classe_id: form.classe_id,
      matiere_id: form.matiere_id,
      evaluation_id: form.evaluation_id === "none" ? null : form.evaluation_id,
      date_debut,
      duree_minutes: form.duree_minutes,
      salle: form.salle || null,
      surveillant_nom: form.surveillant_nom || null,
      instructions: form.instructions || null,
      trimestre: form.trimestre,
      annee_scolaire: classe?.annee_scolaire || "2025-2026",
    });
    if (error) return toast.error(error.message);
    toast.success("Examen planifié");
    setOpen(false); reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet examen ?")) return;
    const { error } = await supabase.from("examens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const filteredEvals = evaluations.filter(
    (e) => e.classe_id === form.classe_id && e.matiere_id === form.matiere_id
  );

  const exportConvocation = (classeId: string) => {
    const classe = classes.find((c) => c.id === classeId);
    if (!classe) return;
    const examensClasse = list.filter((e) => e.classe_id === classeId);
    if (!examensClasse.length) {
      toast.error("Aucun examen planifié pour cette classe");
      return;
    }
    genererConvocationPDF({
      nom_etablissement: "Établissement scolaire",
      classe: classe.nom,
      annee_scolaire: classe.annee_scolaire,
      trimestre: examensClasse[0]?.trimestre || null,
      examens: examensClasse.map((e) => ({
        titre: e.titre,
        type: e.type,
        matiere: e.matieres?.nom || "",
        date_debut: e.date_debut,
        duree_minutes: e.duree_minutes,
        salle: e.salle,
        surveillant_nom: e.surveillant_nom,
        instructions: e.instructions,
      })),
    });
    toast.success("Convocation générée");
  };

  // Calendrier mensuel
  const monthGrid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // lundi=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date | null; examens: Examen[] }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null, examens: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const examens = list.filter((e) => {
        const ed = new Date(e.date_debut);
        return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === d;
      });
      cells.push({ date, examens });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, examens: [] });
    return cells;
  }, [cursor, list]);

  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Examens</h1>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm" onClick={() => setView("calendar")}>
            Calendrier
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
            Liste
          </Button>
          <Select onValueChange={exportConvocation}>
            <SelectTrigger className="w-[210px] h-9">
              <div className="flex items-center gap-1">
                <FileDown className="h-4 w-4" />
                <SelectValue placeholder="Convocation PDF…" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Planifier</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nouvel examen</DialogTitle></DialogHeader>
                <div className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="md:col-span-2" />
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="composition">Composition</SelectItem>
                      <SelectItem value="devoir_surveille">Devoir surveillé</SelectItem>
                      <SelectItem value="examen_blanc">Examen blanc</SelectItem>
                      <SelectItem value="bac_blanc">BAC blanc</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.trimestre} onValueChange={(v: any) => setForm({ ...form, trimestre: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Trimestre 1</SelectItem>
                      <SelectItem value="2">Trimestre 2</SelectItem>
                      <SelectItem value="3">Trimestre 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.classe_id} onValueChange={(v) => setForm({ ...form, classe_id: v, evaluation_id: "none" })}>
                    <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.matiere_id} onValueChange={(v) => setForm({ ...form, matiere_id: v, evaluation_id: "none" })}>
                    <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                    <SelectContent>{matieres.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  <Input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} />
                  <Input type="number" min="15" step="15" value={form.duree_minutes} onChange={(e) => setForm({ ...form, duree_minutes: Number(e.target.value) })} placeholder="Durée (min)" />
                  <Input placeholder="Salle (ex: A12)" value={form.salle} onChange={(e) => setForm({ ...form, salle: e.target.value })} />
                  <Input placeholder="Surveillant" value={form.surveillant_nom} onChange={(e) => setForm({ ...form, surveillant_nom: e.target.value })} className="md:col-span-2" />
                  <Select value={form.evaluation_id} onValueChange={(v) => setForm({ ...form, evaluation_id: v })}>
                    <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Évaluation liée (optionnel)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucune —</SelectItem>
                      {filteredEvals.map((e) => <SelectItem key={e.id} value={e.id}>{e.titre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Instructions / matériel autorisé" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="md:col-span-2" />
                  <Button onClick={create} className="md:col-span-2"><Plus className="h-4 w-4 mr-2" />Créer l'examen</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="capitalize">{monthLabel}</CardTitle>
              <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-2">
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => <div key={d} className="text-center py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((cell, i) => (
                <div key={i} className={`min-h-24 border rounded-md p-1 ${cell.date ? "bg-card" : "bg-muted/30"}`}>
                  {cell.date && (
                    <>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">{cell.date.getDate()}</div>
                      <div className="space-y-0.5">
                        {cell.examens.slice(0, 3).map((e) => (
                          <div key={e.id} className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate" title={`${e.titre} • ${e.classes?.nom} • ${e.salle || ""}`}>
                            {new Date(e.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} {e.classes?.nom}
                          </div>
                        ))}
                        {cell.examens.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">+{cell.examens.length - 3}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const d = new Date(e.date_debut);
            return (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={TYPE_COLOR[e.type] as any}>{TYPE_LABEL[e.type]}</Badge>
                      <h3 className="font-semibold">{e.titre}</h3>
                      <span className="text-sm text-muted-foreground">— {e.classes?.nom} • {e.matieres?.nom}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} • {e.duree_minutes} min</span>
                      {e.salle && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Salle {e.salle}</span>}
                      {e.surveillant_nom && <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" />{e.surveillant_nom}</span>}
                    </div>
                    {e.instructions && <p className="text-sm text-muted-foreground">{e.instructions}</p>}
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => remove(e.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {!list.length && <p className="text-center text-muted-foreground py-12">Aucun examen planifié</p>}
        </div>
      )}
    </div>
  );
}
