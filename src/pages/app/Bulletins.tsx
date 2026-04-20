import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileDown, FileText, Loader2 } from "lucide-react";
import {
  BulletinParams, MatiereLigne, calculerMoyenneMatiere, calculerMoyenneGenerale,
  genererBulletinPDF, mention,
} from "@/lib/bulletin";

interface Eleve { id: string; nom: string; prenom: string; matricule: string; sexe: string; date_naissance: string; }
interface Classe { id: string; nom: string; annee_scolaire: string; }

export default function Bulletins() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState("");
  const [trimestre, setTrimestre] = useState<"1" | "2" | "3">("1");
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [moyennes, setMoyennes] = useState<Record<string, number | null>>({});
  const [params, setParams] = useState<BulletinParams | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("id, nom, annee_scolaire").order("nom"),
      supabase.from("parametres_notation").select("*").maybeSingle(),
    ]).then(([c, p]) => {
      setClasses(c.data || []);
      setParams(p.data as any);
    });
  }, []);

  const compute = async () => {
    if (!classeId || !params) return;
    setLoading(true);
    const classe = classes.find((c) => c.id === classeId)!;

    const [el, ens, evs] = await Promise.all([
      supabase.from("eleves").select("id, nom, prenom, matricule, sexe, date_naissance").eq("classe_id", classeId).eq("statut", "actif").order("nom"),
      supabase.from("enseignements").select("matiere_id, coefficient, matieres(nom)").eq("classe_id", classeId),
      supabase.from("evaluations").select("id, type, bareme, matiere_id").eq("classe_id", classeId).eq("trimestre", trimestre),
    ]);
    const elList = el.data || [];
    const ensList = (ens.data as any[]) || [];
    const evList = (evs.data as any[]) || [];

    const evIds = evList.map((e) => e.id);
    const notesRes = evIds.length
      ? await supabase.from("notes").select("eleve_id, valeur, evaluation_id").in("evaluation_id", evIds)
      : { data: [] as any[] };

    // calc moyenne générale par élève
    const moyMap: Record<string, number | null> = {};
    elList.forEach((e) => {
      const lignes: MatiereLigne[] = ensList.map((en) => {
        const evMat = evList.filter((ev) => ev.matiere_id === en.matiere_id);
        const notesMat = (notesRes.data || [])
          .filter((n: any) => n.eleve_id === e.id && evMat.some((ev) => ev.id === n.evaluation_id))
          .map((n: any) => {
            const ev = evMat.find((x) => x.id === n.evaluation_id)!;
            return { type: ev.type, valeur: Number(n.valeur), bareme: Number(ev.bareme) };
          });
        return {
          matiere: en.matieres?.nom || "—",
          coefficient: Number(en.coefficient),
          moyenne: calculerMoyenneMatiere(notesMat, params),
        };
      });
      moyMap[e.id] = calculerMoyenneGenerale(lignes);
    });
    setEleves(elList);
    setMoyennes(moyMap);
    setLoading(false);
  };

  // Rang
  const rangs = (() => {
    const arr = Object.entries(moyennes)
      .filter(([, m]) => m != null)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    const map: Record<string, number> = {};
    arr.forEach(([id], i) => { map[id] = i + 1; });
    return map;
  })();

  const downloadOne = async (eleve: Eleve) => {
    if (!params || !classeId) return;
    const classe = classes.find((c) => c.id === classeId)!;
    const ens = await supabase.from("enseignements").select("matiere_id, coefficient, matieres(nom)").eq("classe_id", classeId);
    const evs = await supabase.from("evaluations").select("id, type, bareme, matiere_id").eq("classe_id", classeId).eq("trimestre", trimestre);
    const evIds = (evs.data || []).map((e: any) => e.id);
    const notes = evIds.length
      ? await supabase.from("notes").select("valeur, evaluation_id").eq("eleve_id", eleve.id).in("evaluation_id", evIds)
      : { data: [] as any[] };

    const lignes: MatiereLigne[] = ((ens.data as any[]) || []).map((en) => {
      const evMat = ((evs.data as any[]) || []).filter((ev) => ev.matiere_id === en.matiere_id);
      const notesMat = (notes.data || [])
        .filter((n: any) => evMat.some((ev) => ev.id === n.evaluation_id))
        .map((n: any) => {
          const ev = evMat.find((x) => x.id === n.evaluation_id)!;
          return { type: ev.type, valeur: Number(n.valeur), bareme: Number(ev.bareme) };
        });
      return {
        matiere: en.matieres?.nom || "—",
        coefficient: Number(en.coefficient),
        moyenne: calculerMoyenneMatiere(notesMat, params),
      };
    });

    genererBulletinPDF({
      eleve, classe: classe.nom, annee_scolaire: classe.annee_scolaire, trimestre, lignes,
      rang: rangs[eleve.id] ?? null, effectif: eleves.length,
    }, params);
  };

  const downloadAll = async () => {
    for (const e of eleves) {
      await downloadOne(e);
      await new Promise((r) => setTimeout(r, 250));
    }
    toast.success(`${eleves.length} bulletin(s) générés`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Bulletins trimestriels</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Sélection</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <Select value={classeId} onValueChange={setClasseId}>
            <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={trimestre} onValueChange={(v: any) => setTrimestre(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Trimestre 1</SelectItem>
              <SelectItem value="2">Trimestre 2</SelectItem>
              <SelectItem value="3">Trimestre 3</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={compute} disabled={!classeId || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Calculer les moyennes
          </Button>
        </CardContent>
      </Card>

      {eleves.length > 0 && params && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{eleves.length} élève(s)</CardTitle>
              <Button onClick={downloadAll} variant="default">
                <FileDown className="h-4 w-4 mr-2" />Tout télécharger
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Rang</TableHead><TableHead>Matricule</TableHead><TableHead>Élève</TableHead>
                <TableHead>Moy. générale</TableHead><TableHead>Mention</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {eleves.map((e) => {
                  const m = moyennes[e.id];
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{rangs[e.id] ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{e.matricule}</TableCell>
                      <TableCell className="font-medium">{e.nom} {e.prenom}</TableCell>
                      <TableCell>{m != null ? m.toFixed(2) : "—"} / {params.bareme}</TableCell>
                      <TableCell className="text-muted-foreground">{m != null ? mention(m, params) : "—"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => downloadOne(e)}>
                          <FileDown className="h-4 w-4 mr-1" />PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
