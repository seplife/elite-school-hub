import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, BookOpen } from "lucide-react";

interface Matiere {
  id: string;
  nom: string;
  code: string | null;
  ordre: number;
}

export default function Matieres() {
  const [list, setList] = useState<Matiere[]>([]);
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("matieres").select("*").order("ordre");
    if (error) return toast.error(error.message);
    setList(data || []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!nom.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("matieres").insert({
      nom: nom.trim(),
      code: code.trim() || null,
      ordre: list.length + 1,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Matière ajoutée");
    setNom(""); setCode("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette matière ?")) return;
    const { error } = await supabase.from("matieres").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimée");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Matières</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Ajouter une matière</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input placeholder="Nom (ex: Mathématiques)" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Input placeholder="Code (ex: MATH)" value={code} onChange={(e) => setCode(e.target.value)} className="md:w-40" />
          <Button onClick={add} disabled={loading}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Liste ({list.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.ordre}</TableCell>
                  <TableCell className="font-medium">{m.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{m.code || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
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
